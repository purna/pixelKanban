# pixelKanban - How to Set Up and Use with Your GitHub Repo

## Quick Start

### Option 1: Run Locally (No Server Needed)

1. Clone or download this repository
2. Open `index.html` in your browser
3. Start creating tasks!

### Option 2: Deploy to GitHub Pages (Recommended)

1. Fork or push this repository to your GitHub account
2. Go to your repository on GitHub
3. Click **Actions** tab → **Deploy to GitHub Pages**
4. Click **Run workflow**
5. Configure (optional):
   - Branch: `gh-pages` (default)
   - Commit message: custom message (optional)
6. After workflow completes, enable GitHub Pages:
   - Go to **Settings** → **Pages**
   - Source: select `gh-pages` branch → **Save**
7. Your site will be available at: `https://<username>.github.io/<repo-name>/`

**Automatic deployment:** Every push to `main`/`master` triggers automatic deployment via `.github/workflows/deploy-kanban.yml`.

---

## Setting Up GitHub Integration

### 1. Create a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name (e.g., "pixelKanban")
4. Select these scopes:
   - ✅ `repo` (full control of repositories)
   - ✅ `read:user` (read user profile data)
   - ✅ `read:org` (read organization membership)
5. Scroll down and click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)

**For organization repositories:**
- After creating the token, click **"Configure SSO"** next to the token
- Authorize it for your organization

### 2. Add Token to pixelKanban

Open `js/config.js` and add your token:

```javascript
const githubConfig = {
    accessToken: 'ghp_YOUR_TOKEN_HERE',  // Paste your token here
    tokenType: 'pat',
    defaultOwner: 'your-github-username',
    defaultRepo: 'your-repo-name'
};
```

### 3. Connect to Your Repository

1. Open `index.html` in your browser
2. Click the **"GitHub"** button in the header
3. The app will auto-connect using your token
4. Select your repository from the dropdown
5. You're now connected!

---

## Using the Kanban Board

### Creating Tasks

1. Click **"+ Add a card"** at the bottom of any column (Backlog, To Do, In Progress, Done)
2. Fill in the task details:
   - **Title** (required)
   - **Description**
   - **Assignee** (person responsible)
   - **Priority** (Low, Medium, High, Urgent)
   - **Due date**
   - **Milestone** (from your GitHub repo)
   - **Labels** (create custom ones in Settings)
   - **Emoji** (add visual indicators)
3. Click **"Save Task"**

### Moving Tasks

- **Drag and drop** tasks between columns
- Or click a task → change status in the modal

### Editing Tasks

1. Click on any task card to open it
2. Make your changes
3. Click **"Save Task"**

### Adding Comments

1. Open a task
2. Scroll to the **"Comments"** section
3. Type your comment
4. Click **"Add Comment"**

### Attaching Files

1. Open a task
2. Scroll to **"Attachments"**
3. Click **"Add Attachment"**
4. Paste a URL or upload a file
5. Supports: images, videos, audio, documents, links

---

## Using Labels

### Creating Custom Labels

1. Click **"Settings"** in the header
2. Go to **"Labels"** tab
3. Click **"+ Add Label"**
4. Enter:
   - **Name** (e.g., "bug", "enhancement")
   - **Color** (hex code)
   - **Description** (optional)
5. Click **"Save"**

### Using Labels in Tasks

1. Open or create a task
2. Click the **label dropdown** (multi-select)
3. Choose your labels
4. The labels show up as colored badges on the task card

**Note:** Labels are stored in your browser's localStorage. To transfer labels between localhost and a live site, use:
- **Settings → Boards → Export JSON** (saves labels too)
- **Settings → Boards → Import JSON** on the other site

---

## Working with GitHub

### Pushing Tasks to GitHub (Create Issues)

1. Connect to GitHub (see setup above)
2. Click **"Push"** in the GitHub modal
3. Your tasks will be created as GitHub Issues
4. Tasks keep their labels, assignees, and milestones

### Pulling Issues from GitHub

1. Connect to GitHub
2. Click **"Pull"** in the GitHub modal
3. GitHub Issues will be imported as tasks
4. Existing tasks are preserved

### Two-Way Sync

1. Connect to GitHub
2. Click **"Sync"** for automatic two-way synchronization
3. Changes in pixelKanban → GitHub Issues
4. Changes in GitHub Issues → pixelKanban

### Importing Collaborators as Users

1. Connect to GitHub and select a repository
2. Click **"Import Collaborators as Users"**
3. Repository collaborators will be added to your user list
4. You can then assign tasks to them
5. **Duplicate detection:** The app skips users already imported

---

## Using Milestones

### Viewing Milestones

1. Connect to GitHub and select a repository
2. Milestones from your GitHub repo will load automatically
3. When creating/editing a task, select a milestone from the dropdown

### Creating Milestones in GitHub

1. Go to your GitHub repository
2. Click **"Issues"** → **"Milestones"**
3. Click **"New Milestone"**
4. Create your milestone
5. Refresh pixelKanban to see it in the dropdown

---

## Optional: Firebase Authentication

If you want user login with Google:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it → Create project

### 2. Add Web App

1. Click the `</>` (Web) icon
2. Register app
3. Copy the config object

### 3. Configure pixelKanban

Add to `js/config.js`:

```javascript
const appFirebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Enable Google Sign-In

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google**

### 5. Enable Firestore (Optional)

1. In Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"**

Now users can sign in with Google, and their data syncs to Firestore!

---

## Optional: Google Sheets Integration

### 1. Set Up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable **Google Sheets API** and **Google Drive API**
4. Create **OAuth 2.0 Client ID** (Web Application)
5. Add authorized origins: `http://localhost` and `http://127.0.0.1`
6. Copy the **Client ID**

### 2. Configure pixelKanban

Add to `js/config.js`:

```javascript
const googleSheetsConfig = {
    clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
};
```

### 3. Using Google Sheets

1. Click **"Sheets"** in the header
2. Sign in with Google
3. Click **"Create Sheet"** (creates a new Google Sheet)
4. Click **"Save to Sheet"** (saves tasks)
5. Click **"Load from Sheet"** (loads tasks)

---

## Tips & Tricks

### Keyboard Shortcuts

- **Escape**: Close modals (task editor, settings, etc.)

### Data Storage

- Tasks are saved in browser **localStorage** (auto-saves)
- Data persists between sessions on the same browser
- Use **Export JSON** to backup/transfer data

### Multiple Boards

1. Click **"Settings"** → **"Boards"** tab
2. Enter a board name
3. Click **"Create Board"**
4. Switch between boards using the dropdown

### Auto-Save

- Enable **"Auto-Save"** in Settings → Boards tab
- Board saves automatically every 30 seconds

---

## Troubleshooting

### "GraphQL request failed: Resource not accessible"

**What it means:** Your token lacks ProjectsV2 permissions.

**Solution:** The app works fine without Projects. To fix:
1. Add `project` scope to your GitHub token
2. Or just ignore it — Projects feature is optional

### "Firebase not configured"

**Solution:**
- Ensure `js/config.js` loads BEFORE `js/firebaseConfig.js` in `index.html`
- Fill in actual values (not placeholders like "YOUR_API_KEY")

### Labels or Milestones show `[object Object]`

**Solution:**
1. Hard refresh the page: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. The app now auto-fixes corrupted data

### Can't see my GitHub repository

**Solution:**
1. Check token has `repo` scope
2. For organization repos, authorize token for SSO
3. Make sure you're an owner/collaborator of the repo

---

## Project Structure (Quick Reference)

```
pixelKanban/
├── index.html              # Open this in your browser
├── js/
│   ├── config.js          # Add your API keys here
│   ├── kanban.js          # Core board logic
│   ├── githubBoards.js    # GitHub integration
│   ├── userManager.js     # User management
│   └── ...
├── css/
│   └── styles.css        # App styling
└── ...
```

---

## Summary: Quick Setup Checklist

### For Local Use:
- [ ] Open `index.html` in browser
- [ ] (Optional) Create GitHub token for integration
- [ ] (Optional) Add token to `js/config.js`
- [ ] Start creating tasks!

### For GitHub Pages Deployment:
- [ ] Fork/push repo to your GitHub account
- [ ] Go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**
- [ ] After completion: **Settings** → **Pages** → Source: `gh-pages`
- [ ] Your site: `https://<username>.github.io/<repo-name>/`
- [ ] (Optional) Add GitHub token to `js/config.js` for integration