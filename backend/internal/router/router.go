package router

import (
	"context"
	"github.com/julienschmidt/httprouter"
	"net/http"
	"strings"
	"taskflow/backend/internal/config"
	"taskflow/backend/internal/handlers"
)

func New(h *handlers.Handler, cfg config.Config) http.Handler {
	r := httprouter.New()
	r.GET("/api/v1/health", h.Health)
	r.POST("/api/v1/auth/register", h.Register)
	r.POST("/api/v1/auth/login", h.Login)
	r.GET("/api/v1/auth/me", auth(h, cfg, h.Me))
	r.POST("/api/v1/auth/logout", auth(h, cfg, h.Logout))
	r.GET("/api/v1/tasks", auth(h, cfg, h.ListTasks))
	r.POST("/api/v1/tasks", auth(h, cfg, h.CreateTask))
	r.GET("/api/v1/tasks/:id", auth(h, cfg, func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		if p.ByName("id") == "stats" {
			h.Stats(w, r, p)
			return
		}
		h.GetTask(w, r, p)
	}))
	r.PUT("/api/v1/tasks/:id", auth(h, cfg, h.UpdateTask))
	r.PATCH("/api/v1/tasks/:id/status", auth(h, cfg, h.Status))
	r.DELETE("/api/v1/tasks/:id", auth(h, cfg, h.DeleteTask))
	return cors(r, cfg)
}
func auth(h *handlers.Handler, cfg config.Config, next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		c, e := r.Cookie("taskflow_session")
		if e != nil || c.Value == "" {
			if r.Method == "POST" && strings.HasSuffix(r.URL.Path, "logout") {
				next(w, r, p)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(401)
			return
		}
		u, e := h.Repo.UserBySession(r.Context(), c.Value)
		if e != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(401)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), handlers.UserKeyForMiddleware(), u)), p)
	}
}
func cors(next http.Handler, cfg config.Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", cfg.FrontendOrigin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}
