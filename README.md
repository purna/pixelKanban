# pixelKanban

A modern, pixel-art themed Kanban board task management application built with vanilla JavaScript, HTML, and CSS.

![Kanban Board](https://img.shields.io/badge/pixelKanban-v1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📋 **Kanban Board** - Drag and drop tasks between columns (Backlog, To Do, In Progress, Done)
- 👥 **User Management** - Assign tasks to team members
- 🔔 **Comments** - Add comments to tasks
- 📎 **Attachments** - Attach images, videos, and documents to tasks
- 💾 **Multiple Storage Options**:
  - Local Storage (default)
  - GitHub Issues (push/pull/sync)
  - Google Sheets (save/load)
- 🔐 **Authentication** - Firebase Google Sign-in (optional)
- 🎨 **Pixel Art Theme** - Unique retro gaming aesthetic

## Getting Started

### Quick Start

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start creating tasks!

No server required - runs entirely in the browser.

### Configuration

For full functionality, configure the integrations in `js/config.js`:

#### GitHub Integration

1. Go to https://github.com/settings/tokens
2. Generate a Personal Access Token with `repo` scope
3. Edit `js/config.js`:
```javascript
const githubConfig = {
    accessToken: 'ghp_your_token_here',
    tokenType: 'pat',
    defaultOwner: 'your-username',
    defaultRepo: 'your-repo'
};
```

#### Google Sheets Integration

1. Go to Google Cloud Console
2. Enable Google Sheets API and Google Drive API
3. Create OAuth 2.0 credentials
4. Edit `js/config.js`:
```javascript
const googleSheetsConfig = {
    clientId: 'your-client-id.apps.googleusercontent.com'
};
```

#### Firebase Authentication (Optional)

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Sign-in in Authentication
3. Copy your config and edit `js/config.js`:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    // ... other config
};
```

## Usage

### Basic Task Management

1. **Add a Task**: Click "+ Add a card" at the bottom of any column
2. **Edit a Task**: Click on any task card to open the task modal
3. **Move a Task**: Drag and drop tasks between columns
4. **Delete a Task**: Open the task and click delete

### GitHub Integration

1. Click the **GitHub** button in the header
2. Connect with your GitHub token (or use config)
3. Select a repository
4. Use **Push** to save board as GitHub issues
5. Use **Pull** to load issues from GitHub
6. Use **Sync** for two-way synchronization

### Google Sheets Integration

1. Click the **Sheets** button in the header
2. Sign in with Google
3. Enter a Google Sheets URL or create a new one
4. Use **Save to Sheet** or **Load from Sheet**

### Importing Collaborators

In the GitHub modal:
1. Select a repository
2. Click **Import Collaborators as Users**
3. Team members will be added to the user list
4. You can then assign tasks to them

## Project Structure

```
pixelKanban/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css         # Main styles
│   ├── modal.css          # Modal styles
│   └── settings.css       # Settings panel styles
├── js/
│   ├── config.js          # Configuration (API keys, settings)
│   ├── firebaseConfig.js  # Firebase initialization
│   ├── kanban.js          # Core Kanban board logic
│   ├── userManager.js     # User management
│   ├── boardManager.js    # Board save/load
│   ├── databaseManager.js # Local database
│   ├── githubBoards.js    # GitHub integration
│   ├── googleSheets.js    # Google Sheets integration
│   └── ...
└── fonts/
    └── ...
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

Deploy your pixelKanban site to GitHub Pages using either the automated workflow or the deployment script.

### GitHub Pages via Actions (Recommended)

**Manual Deployment:**
1. Go to *Actions* tab → *Deploy to GitHub Pages* → *Run workflow*
2. Choose target branch (default: `gh-pages`)
3. Optionally provide custom commit message
4. After workflow completes, enable GitHub Pages:
   - Repository *Settings* → *Pages*
   - Source: select the deployed branch (e.g., `gh-pages`) / `root`
   - Save
5. Your site will be available at: `https://<username>.github.io/<repo-name>/`

**Auto-Deploy:**
- Automatic deployment on every push to `main`/`master`
- Configured in `.github/workflows/deploy-kanban.yml`
- Deploys to `gh-pages` branch wired to your repository's GitHub Issues

**Workflow Examples:**
```yaml
# Manual trigger with custom branch and message
workflow_dispatch:
  inputs:
    branch:
      description: 'Deploy to branch'
      default: 'gh-pages'
    message:
      description: 'Commit message'
      default: 'Deploy pixelKanban'
```

### Local Script Deployment

Use the included `deploy.sh` script for local deployments:
```bash
./deploy.sh                    # Deploy to gh-pages (with push)
./deploy.sh pages              # Deploy to 'pages' branch  
./deploy.sh gh-pages --no-push # Build without pushing
```

The script handles stashing changes, branch switching, file cleanup, and push.

### Site Repository Deployment

To deploy to a dedicated site repository (e.g., `username.github.io`):
1. Create a new repository named `<username>.github.io`
2. Push the built site files to the `main` branch
3. Enable GitHub Pages in repository settings with `main` branch as source
4. Your site will be available at: `https://<username>.github.io/`

## Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Font Awesome 6.5
- Google Fonts (Inter, Press Start 2P)
- Firebase (optional)
- GitHub API
- Google Sheets API

## License

MIT License - see LICENSE file for details.

## Credits

- Pixelagent 2026 - All rights reserved
- Font Awesome for icons
- Google Fonts for typography
