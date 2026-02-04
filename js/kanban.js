/**
 * Kanban Board Management
 */
class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.nextTaskId = 1;
        this.columns = ['backlog', 'todo', 'in-progress', 'done'];
        this.columnNames = ['Backlog', 'To Do', 'In Progress', 'Done'];
        this.panelConfig = {
            count: 4,
            names: ['Backlog', 'To Do', 'In Progress', 'Done']
        };
        this.init();
    }

    init() {
        this.loadTasks();
        this.renderBoard();
        this.setupEventListeners();
        this.setupEmailModalListeners();
        this.setupDragAndDrop();
        this.setupMessagesSidebarListeners();
    }

    // Task Management
    createTask(data) {
        const task = {
            id: this.nextTaskId++,
            title: data.title,
            description: data.description || '',
            assignee: data.assignee || '',
            userId: data.userId || null,
            priority: data.priority || 'medium',
            status: data.status || 'backlog',
            dueDate: data.dueDate || '',
            backgroundColor: data.backgroundColor || '#2d2d2d',
            attachments: data.attachments || [], // Array of {type, url, name}
            comments: data.comments || [], // Array of {id, userId, text, createdAt}
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates, { updatedAt: new Date().toISOString() });
            this.saveTasks();
            this.renderBoard();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderBoard();
    }

    moveTask(taskId, newStatus) {
        this.updateTask(taskId, { status: newStatus });
    }

    // Rendering
    renderBoard() {
        // Load panel configuration
        this.loadPanelConfig();
        
        // Render columns based on configuration
        this.columns.forEach((status, index) => {
            const column = document.getElementById(`${status}-tasks`);
            if (column) {
                column.innerHTML = '';
                const columnTasks = this.tasks.filter(task => task.status === status);
                columnTasks.forEach(task => this.renderTask(task, column));
            }
        });
        
        // Update column headers with names
        this.columns.forEach((status, index) => {
            const columnElement = document.getElementById(`${status}-tasks`);
            if (columnElement && columnElement.closest && columnElement.closest('.kanban-column')) {
                const header = columnElement.closest('.kanban-column').querySelector('.column-header h3');
                if (header && this.panelConfig.names[index]) {
                    header.textContent = this.panelConfig.names[index];
                }
            }
        });
        
        // Refresh drag and drop listeners
        this.refreshDragAndDrop();
        this.updateTaskCounts();
    }

    // Load panel configuration
    loadPanelConfig() {
        const savedConfig = localStorage.getItem('kanban-panel-config');
        if (savedConfig) {
            this.panelConfig = JSON.parse(savedConfig);
        }
    }

    // Update task counts
    updateTaskCounts() {
        this.columns.forEach(status => {
            const countElement = document.getElementById(`${status}-count`);
            if (countElement) {
                const count = this.tasks.filter(task => task.status === status).length;
                countElement.textContent = count;
            }
        });
    }

    renderTask(task, container) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        // Apply background color
        if (task.backgroundColor && task.backgroundColor !== '#2d2d2d') {
            taskElement.style.backgroundColor = task.backgroundColor;
        }

        const assigneeName = task.assignee ? this.getUserName(task.assignee) : 'Unassigned';
        const assigneeEmail = task.assignee ? this.getUserEmail(task.assignee) : '';
        const dueDate = task.dueDate ? this.formatTaskDate(task.dueDate) : '';
        const createdDate = this.formatTaskDate(task.createdAt);
        
        // Determine due date color based on urgency
        let dueDateClass = '';
        if (task.dueDate) {
            const due = new Date(task.dueDate);
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            if (due < now) {
                dueDateClass = 'past-due';
            } else if (due <= oneWeekFromNow) {
                dueDateClass = 'due-soon';
            } else {
                dueDateClass = 'due-later';
            }
        }

        // Render attachments as a list
        let attachmentsHTML = '';
        if (task.attachments && task.attachments.length > 0) {
            attachmentsHTML = '<div class="task-attachments">';
            task.attachments.forEach(att => {
                const icon = this.getAttachmentIcon(att.type);
                const isImage = att.type === 'image';
                const preview = isImage ? `<img src="${att.url}" alt="${att.name}" onerror="this.style.display='none'">` : '';
                
                attachmentsHTML += `
                    <div class="attachment-item" onclick="kanbanBoard.openGallery('${task.id}')">
                        <div class="attachment-icon">${preview || '<i class="fas ' + icon + '"></i>'}</div>
                        <div class="attachment-name">${att.name || att.url}</div>
                    </div>
                `;
            });
            attachmentsHTML += '</div>';
        }

        taskElement.innerHTML = `
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-description">${this.escapeHtml(task.description)}</div>
            ${attachmentsHTML}
            <div class="task-meta">
                <div class="task-assignee" ${assigneeEmail ? 'style="cursor: pointer;" data-email="' + assigneeEmail + '"' : ''}>${assigneeName}</div>
                <div class="task-priority ${task.priority}">${task.priority}</div>
            </div>
            ${dueDate ? `<div class="task-due-date ${dueDateClass}">Due: ${dueDate}</div>` : ''}
            <div class="task-created-date">Created: ${createdDate}</div>
            <div class="task-actions">
                <button class="task-action-btn edit" data-action="edit" title="Edit Task">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="task-action-btn delete" data-action="delete" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add click handler for assignee email
        const assigneeEl = taskElement.querySelector('.task-assignee[data-email]');
        if (assigneeEl) {
            assigneeEl.addEventListener('click', () => {
                this.openEmailModal(assigneeEmail, task.title);
            });
        }

        // Add event listeners for actions
        taskElement.querySelectorAll('.task-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'edit') {
                    this.openTaskModal(task);
                } else if (action === 'delete') {
                    this.deleteTaskWithConfirmation(task.id);
                }
            });
        });

        // Add double-click to edit
        taskElement.addEventListener('dblclick', () => this.openTaskModal(task));

        container.appendChild(taskElement);
    }

    // Check if URL is a video
    isVideoUrl(url) {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || 
               url.includes('youtube.com') || 
               url.includes('youtu.be') ||
               url.includes('vimeo.com');
    }

    // Open gallery modal
    openGallery(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (!task || !task.attachments || task.attachments.length === 0) return;
        
        const modal = document.getElementById('gallery-modal');
        const content = document.getElementById('gallery-content');
        const title = document.getElementById('gallery-modal-title');
        
        title.textContent = `Attachments: ${task.title}`;
        
        let html = '<div class="gallery-grid">';
        task.attachments.forEach(url => {
            const isVideo = this.isVideoUrl(url);
            
            if (isVideo) {
                html += `<div class="gallery-item">
                    <div class="gallery-video">
                        <a href="${url}" target="_blank">
                            <i class="fas fa-video"></i>
                            <span>${this.escapeHtml(url)}</span>
                        </a>
                    </div>
                </div>`;
            } else {
                html += `<div class="gallery-item">
                    <a href="${url}" target="_blank">
                        <img src="${url}" alt="Attachment" onerror="this.outerHTML='<div class=\"gallery-error\"><i class=\"fas fa-image\"></i></div>';">
                    </a>
                </div>`;
            }
        });
        html += '</div>';
        
        content.innerHTML = html;
        modal.classList.add('active');
    }

    closeGalleryModal() {
        document.getElementById('gallery-modal').classList.remove('active');
    }

    // Get user email by ID
    getUserEmail(userId) {
        if (window.userManager && window.userManager.users) {
            const user = window.userManager.users.find(u => u.id == userId);
            return user ? user.email || '' : '';
        }
        return '';
    }

    // Open email modal
    openEmailModal(email, taskTitle) {
        if (!email) return;
        
        const modal = document.getElementById('email-modal');
        document.getElementById('email-to').value = email;
        document.getElementById('email-subject').value = `Regarding task: ${taskTitle}`;
        document.getElementById('email-body').value = '';
        
        // Update send button to open email client
        const sendBtn = document.getElementById('email-send-btn');
        const subject = encodeURIComponent(`Regarding task: ${taskTitle}`);
        const body = encodeURIComponent('');
        sendBtn.href = `mailto:${email}?subject=${subject}&body=${body}`;
        
        modal.classList.add('active');
    }

    closeEmailModal() {
        document.getElementById('email-modal').classList.remove('active');
    }

    // Helper method to format dates based on settings
    formatTaskDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        
        // Get date format from settingsManager if available
        let dateFormat = 'uk';
        if (window.settingsManager) {
            dateFormat = window.settingsManager.dateFormat || 'uk';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        if (dateFormat === 'us') {
            return `${month}/${day}/${year}`;
        } else {
            return `${day}/${month}/${year}`;
        }
    }

    // Helper method to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Delete task with confirmation
    deleteTaskWithConfirmation(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                this.deleteTask(taskId);
            }
        }
    }

    // Modal Management
    openTaskModal(task = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = document.getElementById('task-modal-title');

        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-assignee').value = task.assignee;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-bg-color').value = task.backgroundColor || '#2d2d2d';
            this.renderAttachmentsList(task.attachments || []);
            this.renderCommentsList(task.comments || []);
            form.dataset.taskId = task.id;
            this.currentTaskId = task.id;
        } else {
            title.textContent = 'Add Task';
            form.reset();
            document.getElementById('task-bg-color').value = '#2d2d2d';
            this.renderAttachmentsList([]);
            this.renderCommentsList([]);
            delete form.dataset.taskId;
            this.currentTaskId = null;
        }

        this.populateAssigneeDropdown();
        this.setupAttachmentListeners();
        this.setupCommentListeners();
        this.setupColorPickerListeners();
        modal.classList.add('active');
    }

    // Setup color picker listeners
    setupColorPickerListeners() {
        const colorInput = document.getElementById('task-bg-color');
        const colorSelect = document.getElementById('task-bg-color-preset');

        if (colorInput) {
            colorInput.oninput = () => {
                colorSelect.value = '';
            };
        }

        if (colorSelect) {
            colorSelect.onchange = () => {
                if (colorSelect.value) {
                    colorInput.value = colorSelect.value;
                }
            };
        }
    }

    // Render attachments list in modal
    renderAttachmentsList(attachments) {
        const container = document.getElementById('attachments-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (attachments.length === 0) {
            container.innerHTML = '<p class="empty-message">No attachments yet. Click a button below to add.</p>';
            return;
        }
        
        attachments.forEach((att, index) => {
            const item = document.createElement('div');
            item.className = 'attachment-item';
            
            const icon = this.getAttachmentIcon(att.type);
            const preview = att.type === 'image' ? `<img src="${att.url}" alt="${att.name || 'Image'}" onerror="this.style.display='none'">` : '';
            
            item.innerHTML = `
                <div class="attachment-preview">${preview || '<i class="fas ' + icon + '"></i>'}</div>
                <div class="attachment-info">
                    <span class="attachment-name">${att.name || att.url}</span>
                    <span class="attachment-type">${att.type}</span>
                </div>
                <button type="button" class="btn btn-sm remove-attachment" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            
            container.appendChild(item);
        });
        
        // Add remove handlers
        container.querySelectorAll('.remove-attachment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.closest('.remove-attachment').dataset.index);
                this.removeAttachment(idx);
            });
        });
    }

    // Get icon for attachment type
    getAttachmentIcon(type) {
        const icons = {
            image: 'fa-image',
            video: 'fa-video',
            audio: 'fa-music',
            document: 'fa-file',
            link: 'fa-link'
        };
        return icons[type] || 'fa-file';
    }

    // Setup attachment add button listeners
    setupAttachmentListeners() {
        const types = ['image', 'video', 'audio', 'doc', 'link'];
        
        types.forEach(type => {
            const btn = document.getElementById(`add-${type}-btn`);
            
            if (btn) {
                btn.onclick = () => {
                    // Hide all input groups first
                    types.forEach(t => {
                        const group = document.getElementById(`new-${t}-group`);
                        if (group) group.style.display = 'none';
                    });
                    
                    // Show this input group
                    const group = document.getElementById(`new-${type}-group`);
                    if (group) {
                        group.style.display = 'flex';
                        const input = group.querySelector('input[type="url"]');
                        if (input) {
                            input.focus();
                            input.onkeydown = (e) => {
                                if (e.key === 'Escape') {
                                    group.style.display = 'none';
                                    input.value = '';
                                }
                            };
                        }
                    }
                };
            }
        });
        
        // Add button listeners for each attachment type
        document.querySelectorAll('.add-attachment-btn').forEach(btn => {
            btn.onclick = (e) => {
                const type = e.target.dataset.type;
                const inputId = e.target.dataset.input;
                const input = document.getElementById(inputId);
                
                if (input && input.value.trim()) {
                    this.addAttachment(type, input.value.trim());
                    input.value = '';
                    
                    // Hide the input group
                    const group = document.getElementById(`new-${type}-group`);
                    if (group) group.style.display = 'none';
                }
            };
        });
    }

    // Add attachment
    addAttachment(type, url) {
        let attachments = this.currentAttachments || [];
        
        // Map doc to document
        const attType = type === 'doc' ? 'document' : type;
        
        attachments.push({
            type: attType,
            url: url,
            name: url.split('/').pop().split('?')[0] || 'Untitled'
        });
        
        this.currentAttachments = attachments;
        this.renderAttachmentsList(attachments);
    }

    // Remove attachment
    removeAttachment(index) {
        let attachments = this.currentAttachments || [];
        attachments.splice(index, 1);
        this.currentAttachments = attachments;
        this.renderAttachmentsList(attachments);
    }

    // Render comments list in modal
    renderCommentsList(comments) {
        const container = document.getElementById('comments-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        // Get task assignee name (default)
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        const taskAssignee = task && task.assignee ? this.getUserName(task.assignee) : 'Unassigned';
        
        comments.forEach(comment => {
            const userName = this.getUserName(comment.userId);
            const userInitial = userName.charAt(0).toUpperCase();
            const commentDate = this.formatFullDate(comment.createdAt);
            
            // Use comment's assigneeId if set, otherwise fall back to task assignee
            const commentAssignee = (comment.assigneeId !== undefined && comment.assigneeId !== null) 
                ? this.getUserName(comment.assigneeId) 
                : taskAssignee;
            
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.dataset.commentId = comment.id;
            
            item.innerHTML = `
                <div class="comment-avatar">${userInitial}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(userName)}</span>
                        <span class="comment-date">${commentDate}</span>
                    </div>
                    <div class="comment-assignee">
                        <i class="fas fa-user"></i> Task assigned to: ${this.escapeHtml(commentAssignee)}
                    </div>
                    <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                    <div class="comment-actions">
                        <button type="button" class="btn btn-sm edit-comment-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button" class="btn btn-sm delete-comment-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        // Add event listeners for edit and delete buttons
        container.querySelectorAll('.edit-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const commentId = parseInt(e.target.closest('.edit-comment-btn').dataset.commentId);
                this.openCommentEditModal(commentId);
            });
        });
        
        container.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const commentId = parseInt(e.target.closest('.delete-comment-btn').dataset.commentId);
                this.deleteComment(commentId);
            });
        });
    }

    // Format full date with time
    formatFullDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        
        // Get date format from settingsManager if available
        let dateFormat = 'uk';
        if (window.settingsManager) {
            dateFormat = window.settingsManager.dateFormat || 'uk';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        if (dateFormat === 'us') {
            return `${month}/${day}/${year} ${hours}:${minutes}`;
        } else {
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
    }

    // Setup comment event listeners
    setupCommentListeners() {
        const addBtn = document.getElementById('add-comment-btn');
        const commentText = document.getElementById('new-comment-text');
        
        if (addBtn) {
            addBtn.onclick = () => {
                if (commentText && commentText.value.trim()) {
                    this.addComment(commentText.value.trim());
                    commentText.value = '';
                }
            };
        }
        
        if (commentText) {
            commentText.onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (commentText.value.trim()) {
                        this.addComment(commentText.value.trim());
                        commentText.value = '';
                    }
                }
            };
        }
        
        // Comment edit modal listeners
        this.setupCommentEditModalListeners();
    }

    // Setup comment edit modal listeners
    setupCommentEditModalListeners() {
        const modal = document.getElementById('comment-edit-modal');
        if (!modal) return;
        
        const closeBtn = document.getElementById('comment-edit-modal-close');
        const cancelBtn = document.getElementById('comment-edit-cancel-btn');
        const saveBtn = document.getElementById('comment-edit-save-btn');
        
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => modal.classList.remove('active');
        }
        
        if (saveBtn) {
            saveBtn.onclick = () => this.saveCommentEdit();
        }
        
        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
        
        // Close on Escape
        document.onkeydown = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        };
    }

    // Open comment edit modal
    openCommentEditModal(commentId) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task || !task.comments) return;
        
        const comment = task.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const modal = document.getElementById('comment-edit-modal');
        const editText = document.getElementById('comment-edit-text');
        const assigneeSelect = document.getElementById('comment-edit-assignee');
        
        // Populate assignee dropdown
        assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
        if (window.userManager && window.userManager.users) {
            window.userManager.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || user.email || 'Unnamed User';
                assigneeSelect.appendChild(option);
            });
        }
        
        editText.value = comment.text;
        assigneeSelect.value = comment.assigneeId || '';
        
        modal.classList.add('active');
        this.currentCommentId = commentId;
        editText.focus();
    }

    // Save comment edit
    saveCommentEdit() {
        const editText = document.getElementById('comment-edit-text');
        const assigneeSelect = document.getElementById('comment-edit-assignee');
        if (!editText || !this.currentCommentId) return;
        
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task || !task.comments) return;
        
        const comment = task.comments.find(c => c.id === this.currentCommentId);
        if (comment) {
            comment.text = editText.value.trim();
            comment.assigneeId = assigneeSelect.value || null;
            comment.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderCommentsList(task.comments);
            this.showNotification('Comment updated', 'success');
        }
        
        document.getElementById('comment-edit-modal').classList.remove('active');
        this.currentCommentId = null;
    }

    // Add comment
    addComment(text) {
        if (!this.currentTaskId) return;
        
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;
        
        if (!task.comments) task.comments = [];
        
        const comment = {
            id: Date.now(),
            userId: window.userManager ? window.userManager.currentUserId : null,
            assigneeId: task.assignee || null,  // Default to task assignee
            text: text,
            createdAt: new Date().toISOString()
        };
        
        task.comments.push(comment);
        this.saveTasks();
        this.renderCommentsList(task.comments);
        this.showNotification('Comment added', 'success');
    }

    // Delete comment
    deleteComment(commentId) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task || !task.comments) return;
        
        if (!confirm('Are you sure you want to delete this comment?')) return;
        
        task.comments = task.comments.filter(c => c.id !== commentId);
        this.saveTasks();
        this.renderCommentsList(task.comments);
        this.showNotification('Comment deleted', 'success');
    }

    // Close task modal
    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        this.currentTaskId = null;
        this.currentAttachments = [];
    }

    // Messages Sidebar
    openMessagesSidebar() {
        const sidebar = document.getElementById('messages-sidebar');
        const overlay = document.getElementById('messages-overlay');
        if (sidebar) {
            sidebar.classList.add('active');
            this.populateMessagesUserSelect();
        }
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    closeMessagesSidebar() {
        const sidebar = document.getElementById('messages-sidebar');
        const overlay = document.getElementById('messages-overlay');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    populateMessagesUserSelect() {
        const select = document.getElementById('messages-user-select');
        if (!select) return;

        // Wait for userManager to be ready
        if (!window.userManager) {
            select.innerHTML = '<option value="">Loading users...</option>';
            return;
        }

        select.innerHTML = '<option value="">Select a user...</option>';

        if (window.userManager.users && window.userManager.users.length > 0) {
            window.userManager.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || user.email || 'Unnamed User';
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No users available</option>';
        }

        select.onchange = () => {
            this.renderMessagesList(select.value);
        };
    }

    renderMessagesList(userId) {
        const container = document.getElementById('messages-list');
        if (!container) return;

        if (!userId) {
            container.innerHTML = '<p class="message-empty">Select a user to view their comments</p>';
            return;
        }

        // Handle both string and number IDs
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        
        // Wait for userManager to be ready
        if (!window.userManager) {
            container.innerHTML = '<p class="message-empty">Loading users...</p>';
            return;
        }

        const user = window.userManager.getUser(userIdNum);
        if (!user) {
            container.innerHTML = '<p class="message-empty">User not found</p>';
            return;
        }

        // Find all comments made by this user
        const messages = [];
        if (this.tasks) {
            this.tasks.forEach(task => {
                if (task.comments && task.comments.length > 0) {
                    task.comments.forEach(comment => {
                        const commentUserId = typeof comment.userId === 'string' ? parseInt(comment.userId) : comment.userId;
                        if (commentUserId === userIdNum) {
                            messages.push({
                                comment: comment,
                                task: task
                            });
                        }
                    });
                }
            });
        }

        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = `<p class="message-empty">No comments found for ${user.name || user.email}</p>`;
            return;
        }

        // Sort by date (newest first)
        messages.sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt));

        // Get panel configuration
        const panelConfig = this.panelConfig || { names: ['Backlog', 'To Do', 'In Progress', 'Done'] };
        const columns = this.columns || ['backlog', 'todo', 'in-progress', 'done'];

        // Group by panel/status using an array to preserve order
        const groups = [];
        const groupMap = {};
        
        messages.forEach(({comment, task}) => {
            // Get panel index and name
            const panelIndex = columns.indexOf(task.status);
            const panelName = panelIndex >= 0 && panelIndex < panelConfig.names.length 
                ? panelConfig.names[panelIndex] 
                : task.status;
            
            if (!groupMap[panelName]) {
                groupMap[panelName] = {
                    name: panelName,
                    index: panelIndex >= 0 ? panelIndex : 999,
                    items: []
                };
                groups.push(groupMap[panelName]);
            }
            groupMap[panelName].items.push({comment, task});
        });

        // Sort groups by panel index to match kanban board order
        groups.sort((a, b) => a.index - b.index);

        // Render groups in order
        groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'message-group';
            groupDiv.innerHTML = `<div class="message-group-title">${group.name}</div>`;

            group.items.forEach(({comment, task}) => {
                const userName = this.getUserName(comment.userId);
                const userInitial = userName.charAt(0).toUpperCase();
                const commentDate = this.formatFullDate(comment.createdAt);

                const item = document.createElement('div');
                item.className = 'message-item';
                item.dataset.taskId = task.id;

                item.innerHTML = `
                    <div class="message-avatar">${userInitial}</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${this.escapeHtml(userName)}</span>
                            <span class="message-date">${commentDate}</span>
                        </div>
                        <div class="message-task">
                            <i class="fas fa-clipboard-list"></i> ${this.escapeHtml(task.title)}
                        </div>
                        <div class="message-text">${this.escapeHtml(comment.text)}</div>
                    </div>
                `;

                item.onclick = () => {
                    this.goToTask(task.id);
                };

                groupDiv.appendChild(item);
            });

            container.appendChild(groupDiv);
        });
    }

    // Go to task (close messages sidebar and open task modal)
    goToTask(taskId) {
        this.closeMessagesSidebar();
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    // Setup messages sidebar listeners
    setupMessagesSidebarListeners() {
        const messagesBtn = document.getElementById('messages-btn');
        const closeBtn = document.getElementById('messages-sidebar-close');
        const overlay = document.getElementById('messages-overlay');

        if (messagesBtn) {
            messagesBtn.onclick = () => this.openMessagesSidebar();
        }

        if (closeBtn) {
            closeBtn.onclick = () => this.closeMessagesSidebar();
        }

        if (overlay) {
            overlay.onclick = () => this.closeMessagesSidebar();
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMessagesSidebar();
            }
        });
    }

    // Save task with attachments and comments
    saveTask() {
        const form = document.getElementById('task-form');
        const taskId = form.dataset.taskId;
        
        // Get form values directly
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignee: document.getElementById('task-assignee').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            backgroundColor: document.getElementById('task-bg-color').value,
            attachments: this.currentAttachments || []
        };

        if (taskId) {
            // Editing existing task - preserve comments (they may have been edited)
            const existingTask = this.tasks.find(t => t.id === parseInt(taskId));
            if (existingTask) {
                // Update the task with form values, preserving comments
                taskData.comments = existingTask.comments;
                this.updateTask(parseInt(taskId), taskData);
                // Extra save to ensure comments are persisted
                this.saveTasks();
            }
            this.showNotification('Task updated successfully', 'success');
        } else {
            // Creating new task
            // Get status from the button that opened the modal
            const addButton = document.querySelector('.add-task-btn:focus') ||
                document.querySelector('.add-task-btn[data-status]');
            if (addButton) {
                taskData.status = addButton.dataset.status;
            } else {
                taskData.status = 'backlog';
            }
            // Add userId reference if user is logged in
            if (window.userManager && window.userManager.currentUserId) {
                taskData.userId = window.userManager.currentUserId;
            }
            this.createTask(taskData);
            this.showNotification('Task created successfully', 'success');
        }

        this.currentAttachments = [];
        this.currentTaskId = null;
        this.closeTaskModal();
        this.renderBoard();
    }

    // User Management Integration
    populateAssigneeDropdown() {
        const select = document.getElementById('task-assignee');
        const currentValue = select.value;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Unassigned</option>';

        // Add users from userManager
        if (window.userManager && window.userManager.users) {
            window.userManager.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name || user.email || 'Unnamed User';
                select.appendChild(option);
            });
        }

        select.value = currentValue;
    }

    getUserName(userId) {
        if (!userId) return 'Unassigned';
        
        // Handle both string and number IDs - localStorage stores as strings
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        
        if (window.userManager && window.userManager.users) {
            // Use loose equality to handle string/number mismatch
            const user = window.userManager.users.find(u => u.id == userIdNum);
            if (user) {
                return user.name || user.email || 'Unnamed User';
            }
        }
        // If userId is a number but no user found, return the ID as string
        if (userId && !isNaN(userIdNum)) {
            return `User ${userIdNum}`;
        }
        return 'Unassigned';
    }

    // Drag and Drop - Fixed version
    setupDragAndDrop() {
        // Set up drag events for all task cards
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));

        // Set up drop zones for all columns
        const columns = document.querySelectorAll('.column-content');
        columns.forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('dragleave', this.handleDragLeave.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
        });

        // Re-add drag listeners to task cards
        this.updateTaskCardListeners();
    }

    // Update task card drag listeners
    updateTaskCardListeners() {
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
            card.addEventListener('dragover', this.handleTaskDragOver.bind(this));
        });
    }

    handleDragStart(e) {
        // Only handle if it's a task card
        if (!e.target.classList.contains('task-card')) return;
        
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        if (!e.target.classList.contains('task-card')) return;
        e.target.classList.remove('dragging');

        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const column = e.currentTarget;
        if (column.classList.contains('column-content')) {
            column.classList.add('drag-over');
        }
    }

    handleTaskDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragLeave(e) {
        const column = e.currentTarget;
        if (column.classList.contains('column-content')) {
            // Only remove if we're actually leaving the column
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();

        const column = e.currentTarget;
        column.classList.remove('drag-over');

        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
        if (!taskId) return;

        // Determine new status from column ID
        let newStatus;
        if (column.classList.contains('column-content')) {
            newStatus = column.id.replace('-tasks', '');
        } else {
            return;
        }

        // Move task to new status
        if (taskId && newStatus) {
            this.moveTask(taskId, newStatus);
        }
    }

    // Re-render after drag and drop
    refreshDragAndDrop() {
        this.updateTaskCardListeners();
    }

    // Event Listeners
    setupEventListeners() {
        // Add task buttons - now use inline creation
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.dataset.status;
                this.openInlineTaskCreator(status);
            });
        });

        // Task modal
        document.getElementById('task-modal-close').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('task-cancel-btn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('task-save-btn').addEventListener('click', () => this.saveTask());

        // Close modal on overlay click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTaskModal();
                this.closeEmailModal();
            }
        });
    }

    // Email Modal Event Listeners
    setupEmailModalListeners() {
        const emailModal = document.getElementById('email-modal');
        if (emailModal) {
            emailModal.addEventListener('click', (e) => {
                if (e.target.id === 'email-modal') {
                    this.closeEmailModal();
                }
            });
        }
        
        const emailClose = document.getElementById('email-modal-close');
        if (emailClose) {
            emailClose.addEventListener('click', () => this.closeEmailModal());
        }
        
        const emailCancel = document.getElementById('email-cancel-btn');
        if (emailCancel) {
            emailCancel.addEventListener('click', () => this.closeEmailModal());
        }
        
        // Gallery modal listeners
        const galleryModal = document.getElementById('gallery-modal');
        if (galleryModal) {
            galleryModal.addEventListener('click', (e) => {
                if (e.target.id === 'gallery-modal') {
                    this.closeGalleryModal();
                }
            });
        }
        
        const galleryClose = document.getElementById('gallery-modal-close');
        if (galleryClose) {
            galleryClose.addEventListener('click', () => this.closeGalleryModal());
        }
    }

    // Data Persistence
    saveTasks() {
        localStorage.setItem('kanban-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('kanban-next-id', this.nextTaskId.toString());
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('kanban-tasks');
        const savedNextId = localStorage.getItem('kanban-next-id');

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }

        if (savedNextId) {
            this.nextTaskId = parseInt(savedNextId);
        }
    }

    // Import from Google Sheets
    importFromSheets(tasks) {
        tasks.forEach(taskData => {
            this.createTask(taskData);
        });
        this.renderBoard();
        this.showNotification(`Imported ${tasks.length} tasks from Google Sheets`, 'success');
    }

    // Inline Task Creation
    openInlineTaskCreator(status) {
        // Close any existing inline creator
        this.closeInlineCreator();

        const column = document.getElementById(`${status}-tasks`);
        if (!column) return;

        // Create inline creator element
        const creator = document.createElement('div');
        creator.className = 'inline-task-creator';
        creator.innerHTML = `
            <div class="inline-creator-content">
                <input type="text" class="inline-title-input" placeholder="Enter task title..." maxlength="100">
                <textarea class="inline-description-input" placeholder="Add description (optional)..." rows="2"></textarea>
                <div class="inline-creator-actions">
                    <button class="btn btn-sm secondary inline-cancel-btn">Cancel</button>
                    <button class="btn btn-sm primary inline-add-btn" disabled>Add Task</button>
                </div>
            </div>
        `;

        // Insert at the top of the column
        column.insertBefore(creator, column.firstChild);

        // Focus on title input
        const titleInput = creator.querySelector('.inline-title-input');
        titleInput.focus();

        // Setup event listeners
        this.setupInlineCreatorEvents(creator, status);
    }

    setupInlineCreatorEvents(creator, status) {
        const titleInput = creator.querySelector('.inline-title-input');
        const descriptionInput = creator.querySelector('.inline-description-input');
        const addBtn = creator.querySelector('.inline-add-btn');
        const cancelBtn = creator.querySelector('.inline-cancel-btn');

        // Enable/disable add button based on title input
        titleInput.addEventListener('input', () => {
            addBtn.disabled = !titleInput.value.trim();
        });

        // Handle add button click
        addBtn.addEventListener('click', () => {
            const title = titleInput.value.trim();
            const description = descriptionInput.value.trim();

            if (title) {
                this.createTask({
                    title: title,
                    description: description,
                    status: status
                });
                this.closeInlineCreator();
                this.renderBoard();
            }
        });

        // Handle cancel button
        cancelBtn.addEventListener('click', () => {
            this.closeInlineCreator();
        });

        // Handle Enter key in title input
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (titleInput.value.trim()) {
                    addBtn.click();
                }
            } else if (e.key === 'Escape') {
                this.closeInlineCreator();
            }
        });

        // Handle Enter key in description (Shift+Enter for new line)
        descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (titleInput.value.trim()) {
                    addBtn.click();
                }
            } else if (e.key === 'Escape') {
                this.closeInlineCreator();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!creator.contains(e.target) && !e.target.classList.contains('add-task-btn')) {
                this.closeInlineCreator();
            }
        }, { once: true });
    }

    closeInlineCreator() {
        const creator = document.querySelector('.inline-task-creator');
        if (creator) {
            creator.remove();
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        if (window.notifications) {
            window.notifications.show(message, type);
        }
    }
}

// Initialize the board when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kanbanBoard = new KanbanBoard();
});