# pixelKanban

A modern, pixel-art themed Kanban board task management application built with vanilla JavaScript, HTML, and CSS.

![Kanban Board](https://img.shields.io/badge/pixelKanban-v1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📋 **Kanban Board** - Drag and drop tasks between columns (Backlog, To Do, In Progress, Done)
- 👥 **User Management** - Assign tasks to team members with role-based access
- 🔔 **Comments** - Add comments to tasks with user attribution
- 📎 **Attachments** - Attach images, videos, documents, and links to tasks
- 🏷️ **Custom Labels** - Create and color-code labels (stored in Settings)
- 💾 **Multiple Storage Options**:
  - Local Storage (default)
  - GitHub Issues (push/pull/sync)
  - Google Sheets (save/load)
- 🔐 **Authentication** - Firebase Google Sign-in with Firestore sync (optional)
- 🎨 **Pixel Art Theme** - Unique retro gaming aesthetic
- 🏷️ **Milestones & Projects** - Link tasks to GitHub milestones and projects

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
2. Generate a Personal Access Token with these scopes:
   - `repo` (full control of repositories)
   - `read:user` (read user profile data)
   - `read:org` (read organization membership)
3. **For organization repositories**: After creating the token, click "Configure SSO" and authorize it
4. Edit `js/config.js`:
```javascript
const githubConfig = {
    accessToken: 'ghp_your_token_here',
    tokenType: 'pat',
    defaultOwner: 'your-username',
    defaultRepo: 'your-repo'
};
```

#### Google Sheets Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Sheets API** and **Google Drive API**
3. Create OAuth 2.0 credentials (Web Application)
4. Add authorized origins: `http://localhost` and `http://127.0.0.1`
5. Edit `js/config.js`:
```javascript
const googleSheetsConfig = {
    clientId: 'your-client-id.apps.googleusercontent.com'
};
```

#### Firebase Authentication (Optional)

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App to the project
3. Copy the config object
4. Enable **Google** sign-in method in Authentication → Sign-in method
5. Enable **Firestore Database** (start in test mode)
6. Edit `js/config.js`:
```javascript
const appFirebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## Usage

### Basic Task Management

1. **Add a Task**: Click "+ Add a card" at the bottom of any column
2. **Edit a Task**: Click on any task card to open the task modal
3. **Move a Task**: Drag and drop tasks between columns
4. **Delete a Task**: Open the task and click delete

### Task Features

- **Emoji Icons**: Add emoji icons to tasks for visual identification
- **Priority Levels**: Set priority (Low, Medium, High, Urgent)
- **Due Dates**: Assign due dates with color-coded urgency indicators
- **Labels**: Create custom labels with colors in Settings → Labels tab
- **Milestones**: Link tasks to GitHub milestones (requires GitHub connection)
- **Projects**: Associate tasks with GitHub Projects (requires GitHub connection)
- **Attachments**: Add images, videos, audio, documents, and links
- **Comments**: Collaborate with comments (requires users to be added)

### GitHub Integration

1. Click the **GitHub** button in the header
2. Connect with your GitHub token (or use config)
3. Select a repository
4. Use **Push** to save board as GitHub issues
5. Use **Pull** to load issues from GitHub
6. Use **Sync** for two-way synchronization

#### Importing Collaborators

In the GitHub modal:
1. Select a repository
2. Click **Import Collaborators as Users**
3. Team members will be added to the user list (duplicates are skipped)
4. You can then assign tasks to them

**Note**: GitHub ProjectsV2 requires additional permissions. If you see "Resource not accessible" warnings, your token may need the `project` scope or SSO authorization.

### Google Sheets Integration

1. Click the **Sheets** button in the header
2. Sign in with Google
3. Enter a Google Sheets URL or create a new one
4. Use **Save to Sheet** or **Load from Sheet**

### Firebase Authentication

1. Click the **Sign in with Google** button in Settings → Boards tab
2. Sign in with your Google account
3. Your user profile is synced to Firestore (if configured)
4. Users are matched by Firebase UID (with email fallback for existing users)

### Label Management

1. Go to **Settings** → **Labels** tab
2. Create custom labels with names and colors
3. Labels appear in the task editor with their configured colors
4. Labels are stored locally in browser storage

**Note**: Labels are stored in browser localStorage, which is domain-specific. To transfer labels between localhost and a live site, use:
- **Export/Import JSON** (Settings → Boards tab) - includes labels
- Or manually copy via browser console

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
│   ├── firebaseConfig.js  # Firebase initialization (App, Auth, Firestore)
│   ├── kanban.js          # Core Kanban board logic
│   ├── userManager.js     # User management with Firebase sync
│   ├── boardManager.js    # Board save/load
│   ├── databaseManager.js # Local database
│   ├── githubBoards.js    # GitHub integration (Issues, Projects, Milestones)
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

## Troubleshooting

### "GraphQL request failed: Resource not accessible"
- Your GitHub token lacks ProjectsV2 permissions
- The app continues to work without Projects feature
- To fix: Add `project` scope to token or authorize for SSO

### "Firebase not configured"
- Ensure `js/config.js` loads BEFORE `js/firebaseConfig.js` in `index.html`
- Fill in all Firebase config values (not just placeholders)

### Labels show [object Object]
- This was a data corruption issue, now fixed
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- The app now migrates corrupted data automatically

### Milestones show [object Object]
- Fixed in latest version
- Milestones now display proper names from GitHub repo
- Hard refresh to apply the fix

## Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Font Awesome 6.5
- Google Fonts (Inter, Press Start 2P)
- Firebase (optional: Auth, Firestore)
- GitHub API (REST & GraphQL)
- Google Sheets API

## License

MIT License - see LICENSE file for details.

## Credits

- Pixelagent 2026 - All rights reserved
- Font Awesome for icons
- Google Fonts for typography
