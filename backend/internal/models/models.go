package models

import "time"

type User struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type Task struct {
	ID          uint64    `json:"id"`
	UserID      uint64    `json:"user_id,omitempty"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	DueDate     *string   `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Stats struct {
	Total          int     `json:"total"`
	Pending        int     `json:"pending"`
	Completed      int     `json:"completed"`
	HighPriority   int     `json:"high_priority"`
	Overdue        int     `json:"overdue"`
	CompletionRate float64 `json:"completion_rate"`
}
