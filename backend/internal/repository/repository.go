package repository

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"taskflow/backend/internal/models"
	"time"
)

var ErrNotFound = errors.New("not found")

type Repository struct{ DB *sql.DB }

func New(db *sql.DB) *Repository {
	// Auto-ensure priority column exists on tasks table
	_, _ = db.Exec("ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium'")
	return &Repository{db}
}

func (r *Repository) CreateUser(ctx context.Context, name, email, hash string) (models.User, error) {
	now := time.Now().UTC()
	res, err := r.DB.ExecContext(ctx, `INSERT INTO users(name,email,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)`, name, email, hash, now, now)
	if err != nil {
		return models.User{}, err
	}
	id, err := res.LastInsertId()
	return models.User{ID: uint64(id), Name: name, Email: email, CreatedAt: now}, err
}

func (r *Repository) FindUser(ctx context.Context, email string) (models.User, string, error) {
	var u models.User
	var hash string
	err := r.DB.QueryRowContext(ctx, `SELECT id,name,email,created_at,password_hash FROM users WHERE email=?`, email).Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		err = ErrNotFound
	}
	return u, hash, err
}

func (r *Repository) UserBySession(ctx context.Context, token string) (models.User, error) {
	sum := sha256.Sum256([]byte(token))
	var u models.User
	err := r.DB.QueryRowContext(ctx, `SELECT u.id,u.name,u.email,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`, hex.EncodeToString(sum[:]), time.Now().UTC()).Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		err = ErrNotFound
	}
	return u, err
}

func (r *Repository) SaveSession(ctx context.Context, userID uint64, tokenHash string, expires time.Time) error {
	_, err := r.DB.ExecContext(ctx, `INSERT INTO sessions(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?)`, userID, tokenHash, expires, time.Now().UTC())
	return err
}

func (r *Repository) DeleteSession(ctx context.Context, token string) error {
	sum := sha256.Sum256([]byte(token))
	_, err := r.DB.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash=?`, hex.EncodeToString(sum[:]))
	return err
}

func (r *Repository) CreateTask(ctx context.Context, userID uint64, t models.Task) (models.Task, error) {
	now := time.Now().UTC()
	if t.Priority == "" {
		t.Priority = "medium"
	}
	result, err := r.DB.ExecContext(ctx, `INSERT INTO tasks(user_id,title,description,status,priority,due_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`, userID, t.Title, t.Description, t.Status, t.Priority, t.DueDate, now, now)
	if err != nil {
		return t, err
	}
	insertedID, _ := result.LastInsertId()
	t.ID = uint64(insertedID)
	t.UserID = userID
	t.CreatedAt = now
	t.UpdatedAt = now
	return t, nil
}

func scanTask(row interface{ Scan(...any) error }) (models.Task, error) {
	var t models.Task
	err := row.Scan(&t.ID, &t.UserID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.DueDate, &t.CreatedAt, &t.UpdatedAt)
	return t, err
}

func (r *Repository) GetTask(ctx context.Context, id, userID uint64) (models.Task, error) {
	t, e := scanTask(r.DB.QueryRowContext(ctx, `SELECT id,user_id,title,description,status,COALESCE(priority, 'medium') as priority,DATE_FORMAT(due_date,'%Y-%m-%d'),created_at,updated_at FROM tasks WHERE id=? AND user_id=?`, id, userID))
	if errors.Is(e, sql.ErrNoRows) {
		e = ErrNotFound
	}
	return t, e
}

func (r *Repository) ListTasks(ctx context.Context, userID uint64, status, priority, search, sortBy string, limit, offset int) ([]models.Task, int, error) {
	where := ` WHERE user_id=?`
	args := []any{userID}
	if status != "" {
		where += ` AND status=?`
		args = append(args, status)
	}
	if priority != "" {
		where += ` AND priority=?`
		args = append(args, priority)
	}
	if search != "" {
		where += ` AND (title LIKE ? OR description LIKE ?)`
		pattern := "%" + strings.ReplaceAll(search, "%", "\\%") + "%"
		args = append(args, pattern, pattern)
	}
	var total int
	if e := r.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM tasks"+where, args...).Scan(&total); e != nil {
		return nil, 0, e
	}

	orderBy := "created_at DESC"
	switch sortBy {
	case "due_date_asc":
		orderBy = "CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at DESC"
	case "due_date_desc":
		orderBy = "CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date DESC, created_at DESC"
	case "priority_desc":
		orderBy = "FIELD(priority, 'high', 'medium', 'low'), created_at DESC"
	case "priority_asc":
		orderBy = "FIELD(priority, 'low', 'medium', 'high'), created_at DESC"
	case "created_asc":
		orderBy = "created_at ASC"
	case "title_asc":
		orderBy = "title ASC"
	default:
		orderBy = "created_at DESC"
	}

	query := `SELECT id,user_id,title,description,status,COALESCE(priority, 'medium') as priority,DATE_FORMAT(due_date,'%Y-%m-%d'),created_at,updated_at FROM tasks` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`
	args = append(args, limit, offset)
	rows, e := r.DB.QueryContext(ctx, query, args...)
	if e != nil {
		return nil, 0, e
	}
	defer rows.Close()
	out := make([]models.Task, 0)
	for rows.Next() {
		t, e := scanTask(rows)
		if e != nil {
			return nil, 0, e
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *Repository) UpdateTask(ctx context.Context, id, userID uint64, t models.Task) error {
	if t.Priority == "" {
		t.Priority = "medium"
	}
	res, e := r.DB.ExecContext(ctx, `UPDATE tasks SET title=?,description=?,status=?,priority=?,due_date=?,updated_at=? WHERE id=? AND user_id=?`, t.Title, t.Description, t.Status, t.Priority, t.DueDate, time.Now().UTC(), id, userID)
	if e == nil {
		n, _ := res.RowsAffected()
		if n == 0 {
			e = ErrNotFound
		}
	}
	return e
}

func (r *Repository) UpdateStatus(ctx context.Context, id, userID uint64, status string) error {
	res, e := r.DB.ExecContext(ctx, `UPDATE tasks SET status=?,updated_at=? WHERE id=? AND user_id=?`, status, time.Now().UTC(), id, userID)
	if e == nil {
		n, _ := res.RowsAffected()
		if n == 0 {
			e = ErrNotFound
		}
	}
	return e
}

func (r *Repository) DeleteTask(ctx context.Context, id, userID uint64) error {
	res, e := r.DB.ExecContext(ctx, `DELETE FROM tasks WHERE id=? AND user_id=?`, id, userID)
	if e == nil {
		n, _ := res.RowsAffected()
		if n == 0 {
			e = ErrNotFound
		}
	}
	return e
}

func (r *Repository) Stats(ctx context.Context, userID uint64) (models.Stats, error) {
	var s models.Stats
	today := time.Now().UTC().Format("2006-01-02")
	e := r.DB.QueryRowContext(ctx, `SELECT 
		COUNT(*),
		COALESCE(SUM(status='pending'),0),
		COALESCE(SUM(status='completed'),0),
		COALESCE(SUM(priority='high' AND status='pending'),0),
		COALESCE(SUM(due_date < ? AND status='pending'),0)
	FROM tasks WHERE user_id=?`, today, userID).Scan(&s.Total, &s.Pending, &s.Completed, &s.HighPriority, &s.Overdue)
	if s.Total > 0 {
		s.CompletionRate = float64(s.Completed) * 100 / float64(s.Total)
	}
	return s, e
}
