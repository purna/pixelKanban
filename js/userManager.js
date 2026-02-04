/**
 * User Management System
 */
class UserManager {
    constructor() {
        this.users = [];
        this.nextUserId = 1;
        this.currentUserId = null; // Track current logged in user
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
    }

    // User CRUD Operations
    createUser(userData) {
        const user = {
            id: this.nextUserId++,
            name: userData.name,
            email: userData.email || '',
            role: userData.role || 'developer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.users.push(user);
        this.saveUsers();
        
        // Set as current user
        this.currentUserId = user.id;
        
        return user;
    }

    updateUser(id, updates) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            Object.assign(user, updates, { updatedAt: new Date().toISOString() });
            this.saveUsers();
        }
        return user;
    }

    deleteUser(id) {
        // Check if user is assigned to any tasks
        const assignedTasks = this.getUserAssignedTasks(id);
        if (assignedTasks.length > 0) {
            if (!confirm(`This user is assigned to ${assignedTasks.length} task(s). Remove assignment and delete user?`)) {
                return false;
            }
            // Remove user assignment from tasks
            assignedTasks.forEach(task => {
                if (window.kanbanBoard) {
                    window.kanbanBoard.updateTask(task.id, { assignee: '' });
                }
            });
        }

        this.users = this.users.filter(u => u.id !== id);
        this.saveUsers();
        return true;
    }

    getUser(id) {
        // Handle both string and number IDs for comparison
        const idNum = typeof id === 'string' ? parseInt(id) : id;
        return this.users.find(u => u.id == idNum);
    }

    getUserByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    // User Task Assignment
    getUserAssignedTasks(userId) {
        if (!window.kanbanBoard) return [];
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        return window.kanbanBoard.tasks.filter(task => {
            const taskAssigneeNum = typeof task.assignee === 'string' ? parseInt(task.assignee) : task.assignee;
            return taskAssigneeNum === userIdNum;
        });
    }

    assignTaskToUser(taskId, userId) {
        if (window.kanbanBoard) {
            window.kanbanBoard.updateTask(taskId, { assignee: userId });
        }
    }

    unassignTask(taskId) {
        if (window.kanbanBoard) {
            window.kanbanBoard.updateTask(taskId, { assignee: '' });
        }
    }

    // Modal Management
    openUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-form');
        const title = document.getElementById('user-modal-title');

        if (user) {
            title.textContent = 'Edit User';
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role;
            form.dataset.userId = user.id;
        } else {
            title.textContent = 'Add User';
            form.reset();
            delete form.dataset.userId;
        }

        modal.classList.add('active');
    }

    closeUserModal() {
        document.getElementById('user-modal').classList.remove('active');
    }

    saveUser() {
        const form = document.getElementById('user-form');
        const userId = form.dataset.userId || form.getAttribute('data-user-id');
        
        // Get form values directly
        const userData = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value
        };

        if (userId) {
            this.updateUser(parseInt(userId), userData);
        } else {
            const newUser = this.createUser(userData);
            // Set as current user for task assignment
            this.currentUserId = newUser.id;
        }

        this.closeUserModal();
        this.showNotification(`User ${userId ? 'updated' : 'created'} successfully`, 'success');
        
        // Refresh the assignee dropdown in kanban board
        if (window.kanbanBoard) {
            window.kanbanBoard.populateAssigneeDropdown();
        }
        
        // Refresh users list in settings if open
        if (window.settingsManager) {
            window.settingsManager.renderUsersList();
        }
    }

    // Get current user
    getCurrentUser() {
        if (this.currentUserId) {
            return this.users.find(u => u.id === this.currentUserId);
        }
        return null;
    }

    // Set current user
    setCurrentUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.currentUserId = userId;
            this.showNotification(`Switched to ${user.name}`, 'info');
        }
    }

    // User List Management (for future expansion)
    renderUserList() {
        // This could be used to display a user management panel
        // For now, users are managed through the modal
    }

    // Data Persistence
    saveUsers() {
        localStorage.setItem('kanban-users', JSON.stringify(this.users));
        localStorage.setItem('kanban-next-user-id', this.nextUserId.toString());
        console.log('Users saved to localStorage:', this.users);
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('kanban-users');
        const savedNextId = localStorage.getItem('kanban-next-user-id');

        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        }

        if (savedNextId) {
            this.nextUserId = parseInt(savedNextId);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openUserModal());
        }

        // User modal
        const userModalClose = document.getElementById('user-modal-close');
        if (userModalClose) {
            userModalClose.addEventListener('click', () => this.closeUserModal());
        }

        const userCancelBtn = document.getElementById('user-cancel-btn');
        if (userCancelBtn) {
            userCancelBtn.addEventListener('click', () => this.closeUserModal());
        }

        const userSaveBtn = document.getElementById('user-save-btn');
        if (userSaveBtn) {
            userSaveBtn.addEventListener('click', () => this.saveUser());
        }

        // Close modal on overlay click
        const userModal = document.getElementById('user-modal');
        if (userModal) {
            userModal.addEventListener('click', (e) => {
                if (e.target.id === 'user-modal') {
                    this.closeUserModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUserModal();
            }
        });
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        if (window.notifications) {
            window.notifications.show(message, type);
        }
    }

    // Export/Import Users
    exportUsers() {
        return {
            users: this.users,
            nextUserId: this.nextUserId
        };
    }

    importUsers(data) {
        if (data.users) {
            this.users = data.users;
        }
        if (data.nextUserId) {
            this.nextUserId = data.nextUserId;
        }
        this.saveUsers();
    }
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});