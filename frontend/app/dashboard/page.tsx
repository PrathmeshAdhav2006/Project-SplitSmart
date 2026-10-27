"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Edit3,
  LogOut,
  Plus,
  Search,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Flame,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  X,
  Sparkles,
  ListTodo
} from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  created_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

type Stats = {
  total: number;
  pending: number;
  completed: number;
  high_priority: number;
  overdue: number;
  completion_rate: number;
};

export default function Dashboard() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    completed: 0,
    high_priority: 0,
    overdue: 0,
    completion_rate: 0,
  });

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "completed">("");
  const [priorityFilter, setPriorityFilter] = useState<"" | "low" | "medium" | "high">("");
  const [sortBy, setSortBy] = useState("created_desc");

  // Modal & Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDateText, setCurrentDateText] = useState("");

  useEffect(() => {
    setCurrentDateText(
      new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    );
  }, []);

  // Today's date in YYYY-MM-DD format for overdue calculations
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Initials for avatar
  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [user]);

  async function loadData() {
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set("status", statusFilter);
      if (priorityFilter) query.set("priority", priorityFilter);
      if (search.trim()) query.set("search", search.trim());
      if (sortBy) query.set("sort", sortBy);

      const [meRes, tasksRes, statsRes] = await Promise.all([
        fetch(api + "/auth/me", { credentials: "include" }),
        fetch(api + "/tasks?" + query.toString(), { credentials: "include" }),
        fetch(api + "/tasks/stats", { credentials: "include" }),
      ]);

      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meData = await meRes.json();
      setUser(meData.data);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.data?.tasks || []);
      } else {
        const err = await tasksRes.json().catch(() => ({}));
        console.error("Tasks fetch failed:", tasksRes.status, err);
        toast.error(err?.error?.message || "Could not load tasks from backend");
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || {
          total: 0,
          pending: 0,
          completed: 0,
          high_priority: 0,
          overdue: 0,
          completion_rate: 0,
        });
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, search, sortBy]);

  function openCreateModal() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setModalOpen(true);
  }

  function openEditModal(t: Task) {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setPriority(t.priority || "medium");
    setDueDate(t.due_date || "");
    setModalOpen(true);
  }

  async function handleSaveTask(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority: priority,
        due_date: dueDate || null,
        status: editingTask ? editingTask.status : "pending",
      };

      const url = editingTask ? `${api}/tasks/${editingTask.id}` : `${api}/tasks`;
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to save task");
      }

      toast.success(editingTask ? "Task updated successfully!" : "Task created successfully!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save task");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(t: Task) {
    const nextStatus = t.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`${api}/tasks/${t.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(nextStatus === "completed" ? "Task completed! 🎉" : "Task marked as pending");
        loadData();
      } else {
        toast.error("Unable to update task status");
      }
    } catch {
      toast.error("Network error while updating status");
    }
  }

  async function deleteTask(t: Task) {
    if (!confirm(`Are you sure you want to delete "${t.title}"?`)) return;

    try {
      const res = await fetch(`${api}/tasks/${t.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Task deleted");
        loadData();
      } else {
        toast.error("Unable to delete task");
      }
    } catch {
      toast.error("Network error while deleting task");
    }
  }

  async function handleLogout() {
    await fetch(api + "/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  }

  return (
    <main className="dashboard">
      {/* Top Navigation Bar with User Profile Info */}
      <nav className="dashnav">
        <div className="brand">
          <ListTodo size={24} color="#6257e8" />
          <span>task</span>flow
        </div>

        <div className="actions">
          {user && (
            <div className="user-pill">
              <div className="avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}

          <button className="btn secondary" onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </nav>

      {/* Header Greeting & Action */}
      <header className="dash-header">
        <div>
          <p className="muted" suppressHydrationWarning style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
            {currentDateText || "Welcome to your workspace"}
          </p>
          <h1>
            Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
        </div>

        <button className="btn primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </header>

      {/* Stats Cards Section */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Tasks</span>
            <ListTodo size={16} />
          </div>
          <div className="stat-value">{stats.total ?? 0}</div>
          <div className="muted" style={{ fontSize: "12px" }}>
            {stats.completed ?? 0} of {stats.total ?? 0} finished
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Pending</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: "#d97706" }}>
            {stats.pending ?? 0}
          </div>
          <div className="muted" style={{ fontSize: "12px" }}>
            {stats.high_priority ? `${stats.high_priority} high priority` : "Everything in progress"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Completed</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: "#10b981" }}>
            {stats.completed ?? 0}
          </div>
          <div className="muted" style={{ fontSize: "12px" }}>
            Great job on getting things done!
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Completion Rate</span>
            <Sparkles size={16} color="#6257e8" />
          </div>
          <div className="stat-value">
            {(stats.completion_rate || 0).toFixed(0)}%
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, stats.completion_rate || 0))}%` }}
            />
          </div>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <section className="controls-bar">
        <div className="filters-group">
          {/* Status Pills */}
          <div className="filter-pills">
            <button
              className={`pill-btn ${statusFilter === "" ? "active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              All
            </button>
            <button
              className={`pill-btn ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`pill-btn ${statusFilter === "completed" ? "active" : ""}`}
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </button>
          </div>

          {/* Priority Filter */}
          <select
            className="select-control"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="high">🔥 High Priority</option>
            <option value="medium">⚡ Medium Priority</option>
            <option value="low">🌱 Low Priority</option>
          </select>

          {/* Sort Selector */}
          <select
            className="select-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="created_desc">Newest First</option>
            <option value="due_date_asc">Due Date (Earliest)</option>
            <option value="priority_desc">Highest Priority</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>

        {/* Search input with clear button */}
        <div className="search-field">
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* Task List Card */}
      <section className="card" style={{ padding: 0 }}>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>
              {search || statusFilter || priorityFilter ? "No matching tasks found" : "No tasks yet"}
            </h3>
            <p className="muted" style={{ margin: "0 0 16px", maxWidth: "340px", fontSize: "14px" }}>
              {search || statusFilter || priorityFilter
                ? "Try adjusting your filters or search keywords to find what you're looking for."
                : "Your workspace is clear! Start your day by creating your first task."}
            </p>
            {(!search && !statusFilter && !priorityFilter) && (
              <button className="btn primary" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Create a Task</span>
              </button>
            )}
          </div>
        ) : (
          tasks.map((t, idx) => {
            const isCompleted = t.status === "completed";
            const isOverdue = !isCompleted && t.due_date && t.due_date < todayStr;

            return (
              <div className="task-item" key={`task-${t.id || idx}`}>
                {/* Status Toggle Checkbox */}
                <button
                  className={`check-btn ${isCompleted ? "checked" : ""}`}
                  aria-label={isCompleted ? "Mark pending" : "Mark completed"}
                  onClick={() => toggleStatus(t)}
                >
                  <Check size={14} strokeWidth={3} />
                </button>

                {/* Task Details */}
                <div className="task-main">
                  <h3 className={`task-title ${isCompleted ? "completed" : ""}`}>
                    {t.title}
                  </h3>

                  {t.description && (
                    <p className="task-desc">{t.description}</p>
                  )}

                  {/* Metadata Chips: Priority, Due Date, Overdue */}
                  <div className="task-meta">
                    {/* Priority Badge */}
                    <span className={`badge badge-priority-${t.priority || "medium"}`}>
                      {t.priority === "high" && <Flame size={12} />}
                      {t.priority || "medium"}
                    </span>

                    {/* Due Date Chip */}
                    {t.due_date && (
                      <span className={`badge ${isOverdue ? "badge-overdue" : "badge-date"}`}>
                        {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                        {isOverdue ? `Overdue (${t.due_date})` : `Due ${t.due_date}`}
                      </span>
                    )}

                    {/* Completed Badge */}
                    {isCompleted && (
                      <span className="badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Edit and Delete */}
                <div className="actions" style={{ marginTop: 0 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => openEditModal(t)}
                    title="Edit task"
                    aria-label="Edit task"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={() => deleteTask(t)}
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => !busy && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? "Edit Task" : "New Task"}</h2>
              <button
                className="btn-ghost"
                onClick={() => setModalOpen(false)}
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              {/* Title Field */}
              <div className="field">
                <label htmlFor="task-title">Title *</label>
                <input
                  id="task-title"
                  placeholder="What needs to be done?"
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description Field */}
              <div className="field">
                <label htmlFor="task-desc">Description (optional)</label>
                <textarea
                  id="task-desc"
                  rows={3}
                  placeholder="Add details, links, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Priority Selector */}
              <div className="field">
                <label>Priority</label>
                <div className="priority-selector">
                  <button
                    type="button"
                    className={`priority-option ${priority === "low" ? "selected-low" : ""}`}
                    onClick={() => setPriority("low")}
                  >
                    🌱 Low
                  </button>
                  <button
                    type="button"
                    className={`priority-option ${priority === "medium" ? "selected-medium" : ""}`}
                    onClick={() => setPriority("medium")}
                  >
                    ⚡ Medium
                  </button>
                  <button
                    type="button"
                    className={`priority-option ${priority === "high" ? "selected-high" : ""}`}
                    onClick={() => setPriority("high")}
                  >
                    🔥 High
                  </button>
                </div>
              </div>

              {/* Due Date Picker */}
              <div className="field">
                <label htmlFor="task-due-date">Due Date (optional)</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Modal Actions */}
              <div className="actions" style={{ justifyContent: "flex-end", marginTop: 24 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={busy}>
                  {busy ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
