/**
 * Google Sheets Integration
 */
class GoogleSheetsImporter {
    constructor() {
        this.apiKey = null;
        this.clientId = null;
        this.isSignedIn = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCredentials();
    }

    loadCredentials() {
        // In a real implementation, these would be loaded from environment variables
        // For demo purposes, we'll use placeholder values
        this.apiKey = 'YOUR_API_KEY_HERE';
        this.clientId = 'YOUR_CLIENT_ID_HERE';
    }

    setupEventListeners() {
        const importBtn = document.getElementById('import-sheets-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.openSheetsModal());
        }

        const sheetsModalClose = document.getElementById('sheets-modal-close');
        if (sheetsModalClose) {
            sheetsModalClose.addEventListener('click', () => this.closeSheetsModal());
        }

        const sheetsCancelBtn = document.getElementById('sheets-cancel-btn');
        if (sheetsCancelBtn) {
            sheetsCancelBtn.addEventListener('click', () => this.closeSheetsModal());
        }

        const sheetsImportBtn = document.getElementById('sheets-import-btn');
        if (sheetsImportBtn) {
            sheetsImportBtn.addEventListener('click', () => this.importFromSheets());
        }

        // Close modal on overlay click
        const sheetsModal = document.getElementById('sheets-modal');
        if (sheetsModal) {
            sheetsModal.addEventListener('click', (e) => {
                if (e.target.id === 'sheets-modal') {
                    this.closeSheetsModal();
                }
            });
        }
    }

    openSheetsModal() {
        const modal = document.getElementById('sheets-modal');
        modal.classList.add('active');
    }

    closeSheetsModal() {
        const modal = document.getElementById('sheets-modal');
        modal.classList.remove('active');
    }

    async importFromSheets() {
        const sheetsUrl = document.getElementById('sheets-url').value;
        const range = document.getElementById('sheets-range').value || 'Sheet1!A:D';

        if (!sheetsUrl) {
            this.showNotification('Please enter a Google Sheets URL', 'error');
            return;
        }

        try {
            const spreadsheetId = this.extractSpreadsheetId(sheetsUrl);
            if (!spreadsheetId) {
                throw new Error('Invalid Google Sheets URL');
            }

            this.showNotification('Importing tasks from Google Sheets...', 'info');

            // For demo purposes, we'll simulate the import
            // In a real implementation, you would make API calls to Google Sheets
            const mockTasks = await this.simulateSheetsImport(spreadsheetId, range);

            if (window.kanbanBoard) {
                window.kanbanBoard.importFromSheets(mockTasks);
            }

            this.closeSheetsModal();
            this.showNotification(`Successfully imported ${mockTasks.length} tasks`, 'success');

        } catch (error) {
            console.error('Error importing from Google Sheets:', error);
            this.showNotification('Error importing from Google Sheets: ' + error.message, 'error');
        }
    }

    extractSpreadsheetId(url) {
        // Extract spreadsheet ID from Google Sheets URL
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }

    async simulateSheetsImport(spreadsheetId, range) {
        // This is a mock implementation for demonstration
        // In a real app, you would use the Google Sheets API

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - in reality, this would come from the Google Sheets API
        const mockData = [
            {
                title: 'Implement user authentication',
                description: 'Add login and registration functionality',
                assignee: 'john.doe@example.com',
                status: 'todo'
            },
            {
                title: 'Design database schema',
                description: 'Create ER diagram and define table structures',
                assignee: 'jane.smith@example.com',
                status: 'in-progress'
            },
            {
                title: 'Write API documentation',
                description: 'Document all REST endpoints with examples',
                assignee: 'bob.wilson@example.com',
                status: 'backlog'
            },
            {
                title: 'Setup CI/CD pipeline',
                description: 'Configure automated testing and deployment',
                assignee: 'alice.brown@example.com',
                status: 'done'
            }
        ];

        // Map assignee emails to user IDs if users exist
        if (window.userManager) {
            mockData.forEach(task => {
                const user = window.userManager.users.find(u => u.email === task.assignee);
                if (user) {
                    task.assignee = user.id;
                } else {
                    task.assignee = ''; // Unassigned if user not found
                }
            });
        }

        return mockData;
    }

    // Real Google Sheets API implementation would look like this:
    async fetchSheetsData(spreadsheetId, range) {
        // This would require proper authentication and API setup
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${this.apiKey}`);
        const data = await response.json();

        if (data.values) {
            return this.parseSheetsData(data.values);
        } else {
            throw new Error('No data found in the specified range');
        }
    }

    parseSheetsData(values) {
        const tasks = [];
        const headers = values[0]; // Assume first row is headers

        // Map column letters to indices
        const titleCol = this.columnToIndex(document.getElementById('title-column').value) - 1;
        const descCol = this.columnToIndex(document.getElementById('description-column').value) - 1;
        const assigneeCol = this.columnToIndex(document.getElementById('assignee-column').value) - 1;
        const statusCol = this.columnToIndex(document.getElementById('status-column').value) - 1;

        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            const task = {
                title: row[titleCol] || '',
                description: row[descCol] || '',
                assignee: row[assigneeCol] || '',
                status: this.normalizeStatus(row[statusCol] || 'backlog')
            };

            if (task.title.trim()) {
                tasks.push(task);
            }
        }

        return tasks;
    }

    columnToIndex(column) {
        // Convert Excel column letter to 0-based index (A=0, B=1, etc.)
        let index = 0;
        for (let i = 0; i < column.length; i++) {
            index = index * 26 + (column.charCodeAt(i) - 64);
        }
        return index;
    }

    normalizeStatus(status) {
        const statusMap = {
            'backlog': 'backlog',
            'todo': 'todo',
            'to do': 'todo',
            'in progress': 'in-progress',
            'in-progress': 'in-progress',
            'done': 'done',
            'completed': 'done'
        };

        return statusMap[status.toLowerCase()] || 'backlog';
    }

    showNotification(message, type = 'info') {
        if (window.notifications) {
            window.notifications.show(message, type);
        }
    }
}

// Initialize Google Sheets importer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.googleSheetsImporter = new GoogleSheetsImporter();
});