package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/julienschmidt/httprouter"
	"golang.org/x/crypto/bcrypt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"taskflow/backend/internal/config"
	"taskflow/backend/internal/models"
	"taskflow/backend/internal/repository"
	"time"
)

type contextKey string

// from context
const userKey contextKey = "user"

func UserKeyForMiddleware() any { return userKey }

type Handler struct {
	Repo   *repository.Repository
	Config config.Config
}

func New(repo *repository.Repository, cfg config.Config) *Handler { return &Handler{repo, cfg} }
func User(r *http.Request) (models.User, bool) {
	u, ok := r.Context().Value(userKey).(models.User)
	return u, ok
}
func jsonResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func ok(w http.ResponseWriter, data any) {
	jsonResponse(w, http.StatusOK, map[string]any{"data": data})
}
func fail(w http.ResponseWriter, status int, code, message string) {
	jsonResponse(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}
func decode(r *http.Request, v any) error {
	if r.Header.Get("Content-Type") != "" && !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		return errors.New("content type")
	}
	r.Body = io.NopCloser(io.LimitReader(r.Body, 1<<20))
	return json.NewDecoder(r.Body).Decode(v)
}
func (h *Handler) Health(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	ok(w, map[string]string{"status": "ok"})
}
func (h *Handler) Register(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var in struct{ Name, Email, Password string }
	if decode(r, &in) != nil || len(strings.TrimSpace(in.Name)) < 1 || len(in.Name) > 100 || !strings.Contains(in.Email, "@") || len(in.Password) < 8 {
		fail(w, 400, "VALIDATION_ERROR", "Please check the submitted information.")
		return
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	hash, e := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to register.")
		return
	}
	u, e := h.Repo.CreateUser(r.Context(), strings.TrimSpace(in.Name), email, string(hash))
	if e != nil {
		fail(w, 409, "EMAIL_EXISTS", "An account with that email already exists.")
		return
	}
	if h.startSession(w, r, u.ID) != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to create session.")
		return
	}
	ok(w, u)
}
func (h *Handler) Login(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var in struct{ Email, Password string }
	if decode(r, &in) != nil {
		fail(w, 400, "VALIDATION_ERROR", "Please check the submitted information.")
		return
	}
	u, hash, e := h.Repo.FindUser(r.Context(), strings.ToLower(strings.TrimSpace(in.Email)))
	if e != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		fail(w, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.")
		return
	}
	if h.startSession(w, r, u.ID) != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to create session.")
		return
	}
	ok(w, u)
}
func (h *Handler) startSession(w http.ResponseWriter, r *http.Request, id uint64) error {
	b := make([]byte, 32)
	if _, e := rand.Read(b); e != nil {
		return e
	}
	token := hex.EncodeToString(b)
	sum := sha256.Sum256([]byte(token))
	expires := time.Now().UTC().Add(7 * 24 * time.Hour)
	if e := h.Repo.SaveSession(r.Context(), id, hex.EncodeToString(sum[:]), expires); e != nil {
		return e
	}
	http.SetCookie(w, &http.Cookie{Name: "taskflow_session", Value: token, Path: "/", HttpOnly: true, Secure: h.Config.CookieSecure, SameSite: http.SameSiteLaxMode, Expires: expires})
	return nil
}
func (h *Handler) Me(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	u, _ := User(r)
	ok(w, u)
}
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	if c, e := r.Cookie("taskflow_session"); e == nil {
		_ = h.Repo.DeleteSession(r.Context(), c.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: "taskflow_session", Value: "", Path: "/", HttpOnly: true, MaxAge: -1, Secure: h.Config.CookieSecure, SameSite: http.SameSiteLaxMode})
	ok(w, map[string]string{"status": "logged_out"})
}
func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	u, _ := User(r)
	q := r.URL.Query()
	status, search := q.Get("status"), q.Get("search")
	if status != "" && status != "pending" && status != "completed" {
		fail(w, 400, "VALIDATION_ERROR", "Invalid status.")
		return
	}
	priority := q.Get("priority")
	if priority != "" && !validPriority(priority) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid priority.")
		return
	}
	sortBy := q.Get("sort")
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	offset, _ := strconv.Atoi(q.Get("offset"))
	if offset < 0 {
		offset = 0
	}
	tasks, total, e := h.Repo.ListTasks(r.Context(), u.ID, status, priority, search, sortBy, limit, offset)
	if e != nil {
		log.Printf("ListTasks error: %v", e)
		fail(w, 500, "INTERNAL_ERROR", "Unable to load tasks.")
		return
	}
	ok(w, map[string]any{"tasks": tasks, "pagination": map[string]int{"limit": limit, "offset": offset, "total": total}})
}
func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	u, _ := User(r)
	var t models.Task
	if decode(r, &t) != nil || len(strings.TrimSpace(t.Title)) < 1 || len(t.Title) > 200 {
		fail(w, 400, "VALIDATION_ERROR", "Please provide a valid task title (1-200 characters).")
		return
	}
	if t.Status == "" {
		t.Status = "pending"
	}
	if !validStatus(t.Status) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid status.")
		return
	}
	if t.Priority == "" {
		t.Priority = "medium"
	}
	if !validPriority(t.Priority) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid priority. Must be low, medium, or high.")
		return
	}
	t.Title = strings.TrimSpace(t.Title)
	t, e := h.Repo.CreateTask(r.Context(), u.ID, t)
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to create task.")
		return
	}
	jsonResponse(w, 201, map[string]any{"data": t})
}
func validStatus(s string) bool   { return s == "pending" || s == "completed" }
func validPriority(p string) bool { return p == "low" || p == "medium" || p == "high" }
func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	u, _ := User(r)
	id, _ := strconv.ParseUint(p.ByName("id"), 10, 64)
	t, e := h.Repo.GetTask(r.Context(), id, u.ID)
	if errors.Is(e, repository.ErrNotFound) {
		fail(w, 404, "NOT_FOUND", "Task not found.")
		return
	}
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to load task.")
		return
	}
	ok(w, t)
}
func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	u, _ := User(r)
	id, _ := strconv.ParseUint(p.ByName("id"), 10, 64)
	var t models.Task
	if decode(r, &t) != nil || len(strings.TrimSpace(t.Title)) < 1 || len(t.Title) > 200 {
		fail(w, 400, "VALIDATION_ERROR", "Please provide a valid task title (1-200 characters).")
		return
	}
	if t.Status == "" {
		t.Status = "pending"
	}
	if !validStatus(t.Status) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid status.")
		return
	}
	if t.Priority == "" {
		t.Priority = "medium"
	}
	if !validPriority(t.Priority) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid priority. Must be low, medium, or high.")
		return
	}
	t.Title = strings.TrimSpace(t.Title)
	e := h.Repo.UpdateTask(r.Context(), id, u.ID, t)
	if errors.Is(e, repository.ErrNotFound) {
		fail(w, 404, "NOT_FOUND", "Task not found.")
		return
	}
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to update task.")
		return
	}
	t, e = h.Repo.GetTask(r.Context(), id, u.ID)
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to load task.")
		return
	}
	ok(w, t)
}
func (h *Handler) Status(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	u, _ := User(r)
	var in struct{ Status string }
	if decode(r, &in) != nil || !validStatus(in.Status) {
		fail(w, 400, "VALIDATION_ERROR", "Invalid status.")
		return
	}
	id, _ := strconv.ParseUint(p.ByName("id"), 10, 64)
	e := h.Repo.UpdateStatus(r.Context(), id, u.ID, in.Status)
	if errors.Is(e, repository.ErrNotFound) {
		fail(w, 404, "NOT_FOUND", "Task not found.")
		return
	}
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to update task.")
		return
	}
	ok(w, map[string]string{"status": in.Status})
}
func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	u, _ := User(r)
	id, _ := strconv.ParseUint(p.ByName("id"), 10, 64)
	e := h.Repo.DeleteTask(r.Context(), id, u.ID)
	if errors.Is(e, repository.ErrNotFound) {
		fail(w, 404, "NOT_FOUND", "Task not found.")
		return
	}
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to delete task.")
		return
	}
	ok(w, map[string]string{"status": "deleted"})
}
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	u, _ := User(r)
	s, e := h.Repo.Stats(r.Context(), u.ID)
	if e != nil {
		fail(w, 500, "INTERNAL_ERROR", "Unable to load statistics.")
		return
	}
	ok(w, s)
}
