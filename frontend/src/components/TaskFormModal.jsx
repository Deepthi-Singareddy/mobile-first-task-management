import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
  Paperclip,
} from 'lucide-react';

const TaskFormModal = ({ isOpen, onClose, onSubmit, task = null, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '',
    location: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const isEditing = !!task;

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'PENDING',
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        location: task.location || '',
      });
      setFile(null);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: '',
        location: '',
      });
      setFile(null);
    }
    setErrors({});
  }, [task, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be under 200 characters';
    }
    if (formData.description.length > 2000) {
      newErrors.description = 'Description must be under 2000 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: 'File size must be under 10MB' }));
        return;
      }
      setFile(selectedFile);
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: 'File size must be under 10MB' }));
        return;
      }
      setFile(droppedFile);
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('status', formData.status);
    data.append('priority', formData.priority);
    if (formData.dueDate) data.append('dueDate', formData.dueDate);
    if (formData.location.trim()) data.append('location', formData.location.trim());
    if (file) data.append('file', file);

    onSubmit(data, task?._id);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" ref={modalRef} onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
              placeholder="Enter task title"
              autoFocus
            />
            {errors.title && (
              <span className="form-error">
                <AlertCircle size={14} />
                {errors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-input form-textarea ${errors.description ? 'form-input-error' : ''}`}
              placeholder="Enter task description"
              rows={3}
            />
            {errors.description && (
              <span className="form-error">
                <AlertCircle size={14} />
                {errors.description}
              </span>
            )}
          </div>

          {/* Status & Priority Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input form-select"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priority" className="form-label">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-input form-select"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Due Date & Location Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="location" className="form-label">Location (City)</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., New York"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">Attachment</label>
            <div
              className={`file-drop-zone ${dragOver ? 'file-drop-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="file-input-hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              {file ? (
                <div className="file-selected">
                  <FileText size={20} />
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="file-remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <Upload size={24} />
                  <p>Drag & drop a file here, or click to browse</p>
                  <span className="file-hint">Supports: Images, PDF, DOC, TXT (Max 10MB)</span>
                </div>
              )}
            </div>
            {isEditing && task?.fileUrl && !file && (
              <div className="existing-file">
                <Paperclip size={14} />
                <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">
                  Current attachment
                </a>
              </div>
            )}
            {errors.file && (
              <span className="form-error">
                <AlertCircle size={14} />
                {errors.file}
              </span>
            )}
          </div>

          {/* Submit */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
