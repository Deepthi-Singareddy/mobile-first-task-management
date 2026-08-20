import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import API from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';

const DashboardPage = () => {
  // Task state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1, limit: 10 });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await API.get(`/tasks?${params.toString()}`);
      setTasks(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Create task
  const handleCreateTask = async (formData) => {
    setSubmitting(true);
    try {
      await API.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Task created successfully!');
      setModalOpen(false);
      setPage(1);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update task
  const handleUpdateTask = async (formData, taskId) => {
    setSubmitting(true);
    try {
      await API.put(`/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Task updated successfully!');
      setModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Status change
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      await API.put(`/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}`);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    setDeleteConfirm(taskId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await API.delete(`/tasks/${deleteConfirm}`);
      showToast('Task deleted successfully');
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', startDate: '', endDate: '' });
    setSearchInput('');
    setPage(1);
  };

  const hasActiveFilters = filters.status || filters.priority || filters.startDate || filters.endDate || filters.search;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">
            <ClipboardList size={28} />
            My Tasks
          </h1>
          <span className="task-count">{meta.total} {meta.total === 1 ? 'task' : 'tasks'}</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="dashboard-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          {searchInput && (
            <button className="search-clear" onClick={() => setSearchInput('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`btn btn-outline btn-filter ${showFilters ? 'btn-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-dot"></span>}
        </button>
        <button className="btn btn-ghost btn-icon" onClick={fetchTasks} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, priority: e.target.value }));
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                  setPage(1);
                }}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                  setPage(1);
                }}
                className="filter-input"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="task-list">
        {loading ? (
          <div className="state-container">
            <Loader2 className="spinner" size={40} />
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="state-container state-error">
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={fetchTasks}>
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="state-container state-empty">
            <Inbox size={56} className="empty-icon" />
            <h3>{hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Create your first task to get started!'}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear Filters
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingTask(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} />
                Create Task
              </button>
            )}
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && meta.lastPage > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
            <span className="pagination-text">Previous</span>
          </button>
          <div className="pagination-info">
            <span>
              Page {meta.page} of {meta.lastPage}
            </span>
          </div>
          <button
            className="btn btn-outline btn-sm"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <span className="pagination-text">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        loading={submitting}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
