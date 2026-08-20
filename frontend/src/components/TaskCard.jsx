import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Paperclip,
  Calendar,
  Edit3,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import WeatherBadge from './WeatherBadge';
import API from '../services/api';

const statusConfig = {
  PENDING: { label: 'Pending', className: 'status-pending', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', className: 'status-progress', icon: AlertTriangle },
  DONE: { label: 'Done', className: 'status-done', icon: CheckCircle2 },
};

const priorityConfig = {
  LOW: { label: 'Low', className: 'priority-low' },
  MEDIUM: { label: 'Medium', className: 'priority-medium' },
  HIGH: { label: 'High', className: 'priority-high' },
};

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const status = statusConfig[task.status] || statusConfig.PENDING;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const StatusIcon = status.icon;

  // Fetch weather when card is expanded and task has a location
  useEffect(() => {
    if (expanded && task.location && !weather) {
      setWeatherLoading(true);
      API.get(`/tasks/weather/${encodeURIComponent(task.location)}`)
        .then((res) => setWeather(res.data.weather))
        .catch(() => setWeather(null))
        .finally(() => setWeatherLoading(false));
    }
  }, [expanded, task.location, weather]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className={`task-card ${isOverdue ? 'task-card-overdue' : ''}`}>
      <div className="task-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="task-card-title-row">
          <h3 className="task-card-title">{task.title}</h3>
          <div className="task-card-badges">
            <span className={`status-pill ${status.className}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
            <span className={`priority-pill ${priority.className}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {task.description && (
          <p className="task-card-description">{task.description}</p>
        )}

        <div className="task-card-meta">
          {task.dueDate && (
            <span className={`task-meta-item ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={14} />
              {formatDate(task.dueDate)}
              {isOverdue && <span className="overdue-label">Overdue</span>}
            </span>
          )}
          {task.location && (
            <span className="task-meta-item">
              <MapPin size={14} />
              {task.location}
            </span>
          )}
          {task.fileUrl && (
            <span className="task-meta-item task-meta-file">
              <Paperclip size={14} />
              Attachment
            </span>
          )}
        </div>

        <button className="task-card-expand" aria-label="Expand">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="task-card-body">
          {/* Weather Section */}
          {task.location && (
            <div className="task-card-weather">
              {weatherLoading ? (
                <div className="weather-loading">
                  <Loader2 className="spinner" size={16} />
                  <span>Loading weather...</span>
                </div>
              ) : weather ? (
                <WeatherBadge weather={weather} />
              ) : (
                <p className="weather-unavailable">Weather data unavailable for {task.location}</p>
              )}
            </div>
          )}

          {/* Attachment Section */}
          {task.fileUrl && (
            <div className="task-card-attachment">
              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                <Paperclip size={16} />
                <span>View Attachment</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Status Quick Change */}
          <div className="task-card-status-change">
            <label className="status-change-label">Change Status:</label>
            <div className="status-change-buttons">
              {['PENDING', 'IN_PROGRESS', 'DONE'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${task.status === s ? 'btn-active' : 'btn-outline'} ${statusConfig[s].className}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.status !== s) onStatusChange(task._id, s);
                  }}
                  disabled={task.status === s}
                >
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="task-card-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Edit3 size={14} />
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
