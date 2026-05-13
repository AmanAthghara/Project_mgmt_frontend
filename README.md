# ProjectFlow — Frontend

React + Vite frontend for the ProjectFlow project management system. Connects to the Node/Express backend via a local proxy during development.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Dev server and bundler |
| React Router v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| React Hot Toast | Toast notifications |
| date-fns | Date formatting |

No UI library — all components are hand-built using CSS variables defined in `src/index.css`.

---

## Quick Start

### Prerequisites
- Node.js 18+
- The backend API running on `http://localhost:5000`

### Install and run

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. All `/api/*` requests are automatically proxied to the backend at `:5000` — no CORS issues during development.

### Other scripts

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```

---

## Environment

The `.env` file contains one variable:

```dotenv
VITE_API_BASE_URL=/api
```

During development, Vite proxies `/api` to `http://localhost:5000` (configured in `vite.config.js`). For production deployment, point the proxy target or reverse-nginx config to wherever your backend lives — you don't need to change any code.

---

## Folder Structure

```
src/
├── api/
│   ├── client.js          # Axios instance — request/response interceptors, JWT attach, console logging
│   └── index.js           # All API functions: authApi, projectsApi, tasksApi, requestsApi
│
├── components/
│   ├── layout/
│   │   └── index.jsx      # Sidebar, TopHeader, AppShell (wraps every protected page)
│   └── ui/
│       └── index.jsx      # Button, Input, Textarea, Select, Badge, Spinner, PageLoader,
│                          # Modal, Avatar, Card, EmptyState, StatCard, ConfirmModal
│
├── context/
│   └── AuthContext.jsx    # Global auth state — user, tokens, login(), logout(), updateUser()
│
├── hooks/
│   └── index.js           # useAsync, useDebounce, useModal
│
├── pages/
│   ├── auth/
│   │   └── index.jsx      # RegisterPage, VerifyOtpPage, LoginPage,
│   │                      # ForgotPasswordPage, ResetPasswordPage
│   ├── projects/
│   │   ├── ExplorePage.jsx       # Browse and search public projects
│   │   ├── MyProjectsPage.jsx    # Projects you are a member of, create new project
│   │   └── ProjectDetailPage.jsx # Tabbed view: Tasks / Members / Requests / Settings
│   ├── tasks/
│   │   └── MyTasksPage.jsx       # Personal task list across all projects
│   ├── Dashboard.jsx      # Overview stats, recent projects, pending tasks
│   ├── RequestsPage.jsx   # Invites received + outgoing join requests
│   └── SettingsPage.jsx   # Edit profile, change password
│
├── utils/
│   └── index.js           # getErrorMessage, timeAgo, formatDate, isOverdue,
│                          # PRIORITY_CONFIG, STATUS_CONFIG, REQUEST_STATUS_CONFIG,
│                          # getInitials, getAvatarColor
│
├── App.jsx                # Router, PrivateRoute, PublicOnlyRoute, RouteLogger
├── index.css              # Design tokens (CSS variables), reset, animations
└── main.jsx               # React root, BrowserRouter, Toaster
```

---

## Pages and Routes

| Route | Component | Access |
|---|---|---|
| `/register` | `RegisterPage` | Public only |
| `/verify-otp` | `VerifyOtpPage` | Public only |
| `/login` | `LoginPage` | Public only |
| `/forgot-password` | `ForgotPasswordPage` | Public only |
| `/reset-password?token=` | `ResetPasswordPage` | Open |
| `/dashboard` | `DashboardPage` | Protected |
| `/projects` | `ExplorePage` | Protected |
| `/projects/mine` | `MyProjectsPage` | Protected |
| `/projects/:projectId` | `ProjectDetailPage` | Protected |
| `/tasks/me` | `MyTasksPage` | Protected |
| `/requests` | `RequestsPage` | Protected |
| `/settings` | `SettingsPage` | Protected |

**PublicOnlyRoute** — redirects logged-in users away from auth pages to `/dashboard`.  
**PrivateRoute** — redirects unauthenticated users to `/login`, shows a spinner while the stored token is being verified on first load.

---

## Auth Flow

Tokens are stored in `localStorage`:

| Key | Value |
|---|---|
| `access_token` | JWT — sent as `Authorization: Bearer <token>` on every request |
| `refresh_token` | Stored but not auto-refreshed (extend if needed) |
| `user` | Serialised user object for instant UI population on reload |

On app load, `AuthContext` calls `GET /api/auth/me` to verify the stored token is still valid. If the backend returns 401 at any point, the Axios response interceptor clears localStorage and redirects to `/login` automatically.

### Two-step registration

```
/register   →  fills form, hits POST /api/auth/register  →  OTP sent to email
/verify-otp →  enters OTP, hits POST /api/auth/verify-otp →  account created, tokens returned, redirect to /dashboard
```

---

## Project Detail Page — Tabs

`/projects/:projectId` has four tabs that all share the same loaded data:

| Tab | Who sees it | What it does |
|---|---|---|
| **Tasks** | All members | Lists all project tasks with filters. Members can mark their assigned tasks complete. Admins can create, edit, assign, and delete tasks. |
| **Members** | All members | Lists all members with roles. Admins can invite users by search, promote members to admin, and remove members. |
| **Requests** | Admin only | Shows pending join requests and admin invites. Admin can accept or reject each one. |
| **Settings** | Admin only | Edit project name, description, visibility. Delete project. |

---

## Join Request Flow

There are two directions:

**Admin invites a user:**
1. Admin opens Members tab → clicks "Invite Member"
2. Searches by name or email → clicks Invite
3. Backend creates an `admin_invite` request
4. Invited user sees it on their `/requests` page with **Accept / Decline** buttons
5. Clicking Accept calls `PUT /api/join-requests/:id/respond` → user is added to project

**Member requests to join a public project:**
1. User finds project on `/projects` (Explore) → clicks "Request to Join"
2. Backend creates a `member_request`
3. Project admin sees it on the Requests tab → clicks Accept or Reject
4. If accepted, user is added to project members

---

## Console Logging

Every API call is grouped and colour-coded in the browser console for easy debugging:

```
📤 API REQUEST: POST /auth/login        ← blue
📥 API RESPONSE: 200 POST /auth/login   ← green
❌ API ERROR: 401 GET /auth/me          ← red
```

Coloured module prefixes are also logged throughout the pages and context:

```
[AUTH CTX]      purple   — auth context actions
[REQUESTS PAGE] yellow   — requests page loads and actions
[EXPLORE]       blue     — public project search
[TASKS TAB]     green    — task creation and updates
[SIDEBAR]       red      — logout
[ROUTER]        purple   — every navigation change
```

Passwords, OTPs, and tokens are never logged — the Axios interceptor strips them from the body before printing.

---

## Design System

All colours and spacing are CSS variables defined in `src/index.css`. The dark theme is the only theme.

| Variable | Usage |
|---|---|
| `--bg` | Page background |
| `--bg-card` | Card and sidebar background |
| `--bg-elevated` | Inputs, dropdowns, secondary surfaces |
| `--accent` | Primary blue — buttons, links, active nav |
| `--success` | Green — completed tasks, public badge |
| `--warning` | Amber — high priority, admin badge |
| `--danger` | Red — errors, delete actions, overdue |
| `--purple` | Purple — invite badges, auth logs |
| `--text-primary` | Main text |
| `--text-secondary` | Labels, descriptions |
| `--text-muted` | Timestamps, hints, placeholders |

Fonts: **DM Serif Display** for headings, **DM Sans** for body text (loaded from Google Fonts in `index.html`).

---

## Adding a New Page

1. Create `src/pages/YourPage.jsx`
2. Import and add a route in `src/App.jsx`:
```jsx
import YourPage from './pages/YourPage'

// inside <Routes>:
<Route path="/your-path" element={<PrivateRoute><YourPage /></PrivateRoute>} />
```
3. Add a nav link in `src/components/layout/index.jsx` inside the `NAV` array:
```js
{ to: '/your-path', icon: '◆', label: 'Your Page' },
```
4. Use the standard shell in your page:
```jsx
import { AppShell, TopHeader } from '../components/layout'

const YourPage = () => (
  <AppShell>
    <TopHeader title="Your Page" actions={<Button>Action</Button>} />
    <div style={{ padding: '28px' }}>
      {/* content */}
    </div>
  </AppShell>
)
```

---

## Adding a New API Call

Add the function inside the appropriate object in `src/api/index.js`:

```js
export const projectsApi = {
  // ... existing functions

  myNewCall: (id, data) => {
    console.log('%c[PROJECTS] myNewCall', 'color:#4f8ef7', { id, data })
    return api.post(`/projects/${id}/something`, data)
  },
}
```

The Axios interceptor handles JWT attachment and response logging automatically.
