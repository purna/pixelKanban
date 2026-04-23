/**
 * DatabaseManager.js - Save/Load Kanban boards as GitHub Issues
 *
 * Integrates with GitHubBoards.js to persist board data as GitHub Issues.
 */

class DatabaseManager {
    constructor(app) {
        this.app = app;
        this.kanbanBoard = app.kanbanBoard;
        this.boardManager = app.boardManager;
        this.userManager = app.userManager;
    }

    showNotification(message, type = 'info') {
        if (window.notifications) {
            window.notifications.show(message, type);
        }
    }

    isGitHubConnected() {
        return window.githubBoardsUI?.isConnected() || false;
    }

    getSelectedRepo() {
        return window.githubBoardsUI?.getSelectedRepo();
    }

    async saveBoardToDatabase(boardName = null) {
        const boardToSave = boardName || (this.boardManager?.currentBoardName || 'default');
        const repo = this.getSelectedRepo();
        
        // Validate GitHub connection - check both UI connection and actual token
        if (!window.githubBoardsUI?.isConnected()) {
            this.showNotification('Connect to GitHub first (click GitHub button)', 'error');
            return false;
        }
        
        // Verify token is valid by attempting an API call
        try {
            await window.githubBoardsUI.api.getCurrentUser();
        } catch (error) {
            this.showNotification('GitHub authentication invalid. Please reconnect.', 'error');
            window.githubBoards?.disconnect();
            return false;
        }
        
        if (!repo) {
            this.showNotification('Select a repository in GitHub modal', 'error');
            return false;
        }

        try {
            const tasks = this.kanbanBoard?.tasks || [];
            this.showNotification(`Saving ${tasks.length} tasks...`, 'info');
            
            let savedCount = 0;
            let errorCount = 0;
            
            for (const task of tasks) {
                try {
                    await this.saveTaskAsIssue(task, repo);
                    savedCount++;
                } catch (taskError) {
                    console.error(`Failed to save task "${task.title}":`, taskError);
                    errorCount++;
                }
            }
            
            if (errorCount > 0) {
                this.showNotification(`Saved ${savedCount} tasks with ${errorCount} errors`, 'warning');
            } else {
                this.showNotification(`Saved ${savedCount} tasks to ${repo.fullName}`, 'success');
            }
            
            // Save local board state after successful sync
            if (this.boardManager) {
                this.boardManager.saveCurrentBoard();
            }
            
            return savedCount > 0;
        } catch (error) {
            console.error('Error saving board:', error);
            this.showNotification('Error: ' + error.message, 'error');
            return false;
        }
    }

    async saveTaskAsIssue(task, repo) {
        const { api } = window.githubBoardsUI;
        if (!api?.isAuthenticated()) {
            throw new Error('GitHub API not authenticated. Please reconnect.');
        }

        // Build metadata for kanban column mapping
        const metadata = `<!-- kanban-metadata \ncolumn: ${task.columnId}\ntaskId: ${task.id}\n-->`;
        const body = `${task.description || ''}\n\n${metadata}`.trim();

        // Build labels - include column label plus any task-specific labels
        const labels = [this.getColumnLabel(task.columnId)];
        if (task.labels && Array.isArray(task.labels)) {
            labels.push(...task.labels);
        }

        const issueData = {
            title: task.title,
            body: body,
            labels: [...new Set(labels)]
        };

        // Update existing issue or create new one
        if (task.githubIssueId) {
            try {
                await api.request(`/repos/${repo.owner.login}/${repo.name}/issues/${task.githubIssueId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(issueData)
                });
                return;
            } catch (e) {
                // Issue might have been deleted, fall through to create
                console.warn(`Failed to update issue #${task.githubIssueId}, creating new:`, e.message);
                task.githubIssueId = null;
            }
        }

        const response = await api.request(`/repos/${repo.owner.login}/${repo.name}/issues`, {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
        task.githubIssueId = response.number;
    }

    getColumnLabel(columnId) {
        // Map column ID to panel name from kanbanBoard configuration
        const columns = this.kanbanBoard?.columns || ['backlog', 'todo', 'in-progress', 'done'];
        const names = this.kanbanBoard?.panelConfig?.names || ['Backlog', 'To Do', 'In Progress', 'Done'];
        const index = columns.indexOf(columnId);
        const columnName = (index >= 0 && names[index]) ? names[index] : columnId;
        return `kanban:${columnName}`.toLowerCase();
    }

    async loadBoardFromDatabase() {
        const repo = this.getSelectedRepo();
        
        if (!window.githubBoardsUI?.isConnected()) {
            this.showNotification('Connect to GitHub first', 'error');
            return false;
        }
        
        if (!repo) {
            this.showNotification('Select a repository', 'error');
            return false;
        }

        try {
            this.showNotification('Loading from GitHub Issues...', 'info');
            
            const issues = await window.githubBoardsUI.api.request(
                `/repos/${repo.owner.login}/${repo.name}/issues?state=all&per_page=100`
            );
            
            const tasks = issues.map(issue => this.issueToTask(issue));
            
            if (this.kanbanBoard) {
                this.kanbanBoard.tasks = tasks;
                this.kanbanBoard.nextTaskId = Math.max(...tasks.map(t => t.id || 0), 0) + 1;
                this.kanbanBoard.saveTasks();
                this.kanbanBoard.renderBoard();
            }
            
            this.showNotification(`Loaded ${tasks.length} issues`, 'success');
            return true;
        } catch (error) {
            console.error('Error loading board:', error);
            this.showNotification('Error: ' + error.message, 'error');
            return false;
        }
    }

    issueToTask(issue) {
        let columnId = 'backlog';
        let taskId = issue.number;
        
        if (issue.body) {
            const match = issue.body.match(/<!-- kanban-metadata \ncolumn: (\w+)\ntaskId: (\d+)\n-->/);
            if (match) {
                columnId = match[1];
                taskId = parseInt(match[2]);
            }
        }
        
        const assignee = issue.assignee ? issue.assignee.login : null;

        return {
            id: taskId,
            title: issue.title,
            description: issue.body?.replace(/<!--[\s\S]*?-->/, '').trim() || '',
            columnId: columnId,
            assignee: assignee,
            priority: issue.labels?.find(l => l.name?.startsWith('priority:'))?.name || 'none',
            labels: issue.labels?.map(l => l.name) || [],
            githubIssueId: issue.number
        };
    }

    loadBoardsFromLocalStorage() {
        const boards = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kanbanBoard_')) {
                try {
                    const boardData = JSON.parse(localStorage.getItem(key));
                    boards.push({
                        name: boardData.name,
                        savedAt: boardData.savedAt,
                        taskCount: boardData.tasks?.length || 0
                    });
                } catch(e) {}
            }
        }
        return boards;
    }
}

/**
 * DatabaseUI - Header button + modal for saving to GitHub
 */
class DatabaseUI {
    constructor(app) {
        this.app = app;
        this.databaseManager = new DatabaseManager(app);
        this.init();
    }

    init() {
        this.addDatabaseButtonToHeader();
        this.addDatabaseModalToPage();
    }

    addDatabaseButtonToHeader() {
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) return;

        const dbButton = document.createElement('button');
        dbButton.id = 'database-btn';
        dbButton.className = 'btn';
        dbButton.title = 'Save/Load from GitHub Issues';
        dbButton.innerHTML = '<i class="fas fa-save"></i>';
        dbButton.addEventListener('click', () => this.openDatabaseModal());
        headerControls.appendChild(dbButton);
    }

    addDatabaseModalToPage() {
        if (document.getElementById('database-modal')) return;

        const modalHTML = `
            <div class="modal-overlay" id="database-modal">
                <div class="modal" style="max-width: 380px;">
                    <header>
                        <div class="modal-title">
                            <i class="fas fa-cloud-upload-alt"></i> Save to GitHub
                        </div>
                        <button class="modal-close" id="database-modal-close">&times;</button>
                    </header>
                    <div class="modal-content">
                        <p style="margin-bottom: 16px; font-size: 0.9em; color: var(--text-secondary);">
                            Each task becomes a GitHub Issue with a <code>kanban:column</code> label.
                        </p>
                        <div class="database-actions" style="display: flex; flex-direction: column; gap: 8px;">
                            <button id="db-save-btn" class="btn primary">
                                <i class="fas fa-save"></i> Save Board to Issues
                            </button>
                            <button id="db-load-btn" class="btn">
                                <i class="fas fa-download"></i> Load from Issues
                            </button>
                            <button id="db-github-btn" class="btn">
                                <i class="fab fa-github"></i> Configure GitHub
                            </button>
                        </div>
                        <div id="db-status" style="margin-top: 12px; font-size: 0.85em;"></div>
                    </div>
                    <footer>
                        <div class="modal-actions">
                            <button class="btn" id="db-close-btn">Close</button>
                        </div>
                    </footer>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupEventListeners();
    }

    /**
     * Get the GitHubBoardsUI instance from global scope
     * Ensures we always use the current instance
     */
    getGitHubUI() {
        return window.githubBoardsUI;
    }

    setupEventListeners() {
        document.getElementById('database-modal-close')?.addEventListener('click', () => this.closeModal());
        document.getElementById('db-close-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('database-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'database-modal') this.closeModal();
        });

        document.getElementById('db-save-btn')?.addEventListener('click', async () => {
            const githubUI = this.getGitHubUI();
            if (!githubUI?.isConnected()) {
                this.showStatus('Connect GitHub first', 'error');
                githubUI?.openModal();
                return;
            }
            await this.databaseManager.saveBoardToDatabase();
        });

        document.getElementById('db-load-btn')?.addEventListener('click', async () => {
            const githubUI = this.getGitHubUI();
            if (!githubUI?.isConnected()) {
                this.showStatus('Connect GitHub first', 'error');
                githubUI?.openModal();
                return;
            }
            await this.databaseManager.loadBoardFromDatabase();
        });

        document.getElementById('db-github-btn')?.addEventListener('click', () => {
            this.getGitHubUI()?.openModal();
        });

        // Update status when repo changes or connection changes
        window.addEventListener('github-repo-selected', () => {
            if (document.getElementById('database-modal')?.classList.contains('active')) {
                this.updateStatus();
            }
        });

        // Also listen for generic auth change (if we add that event later)
        this.updateStatus();
    }

    openDatabaseModal() {
        document.getElementById('database-modal')?.classList.add('active');
        this.updateStatus();
    }

    closeModal() {
        document.getElementById('database-modal')?.classList.remove('active');
    }

    showStatus(msg, type = 'info') {
        const el = document.getElementById('db-status');
        if (el) {
            el.innerHTML = `<span style="color: var(--${type}-color);">${msg}</span>`;
            setTimeout(() => el.innerHTML = '', 3000);
        }
    }

    updateStatus() {
        const el = document.getElementById('db-status');
        if (!el) return;
        
        const githubUI = this.getGitHubUI();
        
        if (githubUI?.isConnected()) {
            const repo = githubUI.getSelectedRepo();
            const user = githubUI.api?.user;
            const repoName = repo?.fullName || repo?.name || 'not selected';
            el.innerHTML = `<i class="fas fa-check-circle"></i> Connected as <strong>@${user?.login || 'unknown'}</strong> to <code>${repoName}</code>`;
        } else {
            el.innerHTML = `<i class="fas fa-unlink"></i> Not connected to GitHub`;
        }
    }
}

// Initialize DB UI
document.addEventListener('DOMContentLoaded', () => {
    const init = () => {
        if (window.kanbanBoard && window.boardManager) {
            window.databaseUI = new DatabaseUI({
                kanbanBoard: window.kanbanBoard,
                boardManager: window.boardManager,
                userManager: window.userManager
            });
        } else {
            setTimeout(init, 100);
        }
    };
    init();
});
