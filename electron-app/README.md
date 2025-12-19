# DevJournal - Electron App

A native macOS desktop application for development journaling, built with Electron, React, TypeScript, and Supabase.

## 📁 Project Structure Explained

This README explains every file in this project in simple terms, assuming you have no TypeScript or Electron experience.

### 🎯 What is Electron?

Electron lets you build **desktop apps** (like the apps you download and install on your Mac) using **web technologies** (HTML, CSS, JavaScript). It's what powers apps like VS Code, Slack, and Discord.

Think of it like this: Your app has **two parts**:
- **Main Process** (Backend) - Controls the app window, file system, native features
- **Renderer Process** (Frontend) - The UI that users see and interact with (built with React)

---

## 📂 Root Configuration Files

### `package.json`
**What it is:** The "instruction manual" for your app
**What it does:**
- Lists all the code libraries (dependencies) your app needs
- Defines commands you can run (like `pnpm dev` or `pnpm build`)
- Stores app metadata (name, version, description)

**Key sections:**
- `scripts` - Commands you can run (dev, build, etc.)
- `dependencies` - Libraries needed to run the app (React, Supabase, Express)
- `devDependencies` - Libraries only needed during development (TypeScript, Electron Builder)

### `tsconfig.json`
**What it is:** Configuration for TypeScript (for the React frontend)
**What it does:** Tells TypeScript how to convert your `.tsx` files into JavaScript that browsers understand

**Why TypeScript?** It's JavaScript with type checking - catches errors before you run the code.

### `tsconfig.main.json`
**What it is:** Configuration for TypeScript (for the Electron backend)
**What it does:** Tells TypeScript how to convert your main process files into JavaScript that Node.js understands

**Why separate?** The frontend (browser) and backend (Node.js) work differently and need different settings.

### `vite.config.ts`
**What it is:** Configuration for Vite (the build tool for the React app)
**What it does:**
- Bundles your React code into optimized files
- Runs a development server with hot-reload (changes appear instantly)
- Loads environment variables from `.env` file

**Key settings:**
- `root: 'src/renderer'` - Where the React app lives
- `envDir` - Where to find the `.env` file with secrets
- `plugins: [react()]` - Enables React support

### `electron-builder.yml`
**What it is:** Configuration for packaging your app
**What it does:** Tells electron-builder how to create the `.app` file and installers

**Settings explained:**
- `appId` - Unique identifier for your app (like com.devjournal.app)
- `productName` - Name shown to users (DevJournal)
- `protocols` - Registers the `devjournal://` URL scheme so macOS knows to open your app when these links are clicked
- `mac.target` - Creates both a `.dmg` installer and `.zip` file
- `files` - Which files to include in the final app (including `.env` for Supabase credentials)

### `.env`
**What it is:** Secret configuration file (NOT committed to Git)
**What it does:** Stores sensitive information like API keys

**Contains:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase public API key

**Why VITE_ prefix?** Vite only exposes variables starting with `VITE_` to the frontend for security.

### `.env.example`
**What it is:** Template for `.env`
**What it does:** Shows others what environment variables they need without exposing your actual secrets

### `.gitignore`
**What it is:** List of files Git should ignore
**What it does:** Prevents sensitive files (`.env`, `node_modules`, build output) from being committed to version control

### `.pnpmrc`
**What it is:** Configuration for pnpm (package manager)
**What it does:** Tells pnpm to allow running install scripts (needed for Electron)

---

## 📂 `src/main/` - The Backend (Electron Main Process)

These files run in **Node.js** and control the native desktop app features.

### `main.ts`
**What it is:** The entry point of your desktop app
**What it does:** Creates and controls the app window

**Key responsibilities:**
1. **Creates the window** - Sets size, title bar, etc.
2. **Loads content** - In development: loads from Vite server (`http://localhost:5173`). In production: loads built files
3. **Handles window lifecycle** - What happens when window closes, minimizes, etc.
4. **Sets up IPC handlers** - Allows the frontend to communicate with the backend
5. **Starts the auth server** - Launches the local HTTP server for authentication (development only)
6. **Handles deep links** - Processes `devjournal://` URLs and extracts authentication tokens (production only)

**Important parts:**
```typescript
// Create a browser window
mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, '../preload/preload.js'),
    contextIsolation: true,  // Security: separates app code from web content
    nodeIntegration: false,  // Security: prevents web content from accessing Node.js
  },
});

// Deep Link Handler - production mode authentication
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (url.startsWith('devjournal://')) {
    // Extract tokens from URL and send to renderer
    mainWindow.webContents.send('auth-tokens', { access_token, refresh_token });
  }
});
```

### `authServer.ts`
**What it is:** A mini web server that runs inside your app
**What it does:** Handles the OAuth callback from Supabase authentication

**Why it exists:** When you click the magic link in your email, it opens in Safari. This server catches the authentication tokens and sends them to the Electron app.

**How it works:**
1. **Listens on port 54321** - `http://localhost:54321`
2. **Receives auth callback** - When user clicks magic link, browser redirects here
3. **Extracts tokens** - JavaScript in the browser page sends tokens via HTTP POST
4. **Notifies the app** - Sends tokens to the main window via IPC

**Key endpoint:**
```typescript
// Browser sends tokens here via POST request
app.post('/auth/tokens', (req, res) => {
  const { access_token, refresh_token } = req.body;
  mainWindow.webContents.send('auth-tokens', { access_token, refresh_token });
});
```

---

## 📂 `src/preload/` - The Security Bridge

### `preload.ts`
**What it is:** The secure bridge between frontend and backend
**What it does:** Exposes specific, safe functions that the React app can call

**Why it exists:** For security, the frontend can't directly access Node.js or Electron APIs. The preload script acts as a controlled gateway.

**What it exposes:**
```typescript
window.electron = {
  // App version info
  versions: { node: '...', chrome: '...', electron: '...' },

  // Function to open auth popup
  openAuthWindow: (url) => { ... },

  // Listener for when auth tokens arrive
  onAuthTokens: (callback) => { ... }
}
```

**Security features:**
- `contextIsolation: true` - Keeps this code separate from web content
- `contextBridge` - Only exposes what you explicitly allow

---

## 📂 `src/renderer/` - The Frontend (React App)

These files create the user interface that people see and interact with.

### `index.html`
**What it is:** The HTML page that loads your React app
**What it does:** Provides the container (`<div id="root">`) where React renders

**Simple structure:**
```html
<body>
  <div id="root"></div>  <!-- React renders here -->
  <script type="module" src="/main.tsx"></script>  <!-- Loads React -->
</body>
```

### `main.tsx`
**What it is:** The entry point for React
**What it does:** Finds the `#root` element and renders your React app into it

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />  {/* Your main app component */}
  </React.StrictMode>
);
```

### `App.tsx`
**What it is:** The main component that decides what to show
**What it does:** Routes between Login, Dashboard, and Auth Callback based on state

**Logic:**
1. If URL has `access_token` → Show `AuthCallback` component
2. If loading → Show spinner
3. If user logged in → Show `Dashboard`
4. If not logged in → Show `Login`

### `index.css`
**What it is:** Global styles for the entire app
**What it does:** Sets default fonts, colors, background, and loading spinner animation

---

## 📂 `src/renderer/lib/` - Utility Code

### `supabase.ts`
**What it is:** Supabase client configuration
**What it does:** Creates and exports a configured Supabase client for database and auth

**What it does:**
```typescript
// Gets your Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creates a client you can use throughout your app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Usage in other files:**
```typescript
import { supabase } from './lib/supabase';

// Sign in
await supabase.auth.signInWithOtp({ email });

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📂 `src/renderer/contexts/` - Shared State

### `AuthContext.tsx`
**What it is:** Global authentication state manager
**What it does:** Keeps track of whether the user is logged in and shares that info with all components

**Why use Context?** Instead of passing `user` and `session` through every component, Context makes it available anywhere.

**What it provides:**
- `user` - The logged-in user (or null)
- `session` - The authentication session
- `loading` - Whether we're still checking auth status
- `signOut()` - Function to log out

**How it works:**
```typescript
// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>

// Use in any component
function Dashboard() {
  const { user, signOut } = useAuth();
  return <div>Welcome {user.email}!</div>
}
```

**Special features:**
- Listens to Supabase auth changes (automatically updates when user logs in/out)
- Listens for auth tokens from Electron main process
- Persists session across app restarts (Supabase handles this)

---

## 📂 `src/renderer/components/` - UI Components

### `Login.tsx`
**What it is:** The login screen component
**What it does:** Allows users to sign in with magic link (passwordless email authentication)

**User flow:**
1. User enters email
2. App detects environment and chooses the right redirect URL:
   - Development: `http://localhost:54321/auth/callback`
   - Production: `devjournal://auth/callback`
3. App sends magic link to email via Supabase
4. User clicks link in email
5. Tokens are delivered to the app (method depends on environment)
6. App receives tokens → User is logged in

**Key features:**
- **Environment-aware redirect** - Automatically uses the right URL for dev vs production
- Email validation
- Loading states ("Sending magic link...")
- Success/error messages
- Info messages with instructions

### `Login.css`
**What it is:** Styles specifically for the Login component
**What it does:** Makes the login form look nice (dark theme, animations, responsive)

**Features:**
- Dark gradient background
- Hover effects on button
- Animated spinner for loading state
- Color-coded messages (blue for info, green for success, red for errors)

### `Dashboard.tsx`
**What it is:** The main screen shown after login
**What it does:** Displays the user's email and a sign-out button

**Currently:** Simple welcome screen (you'll add journal features here later)

**Features:**
- Header with user email
- Sign out button
- Welcome card (placeholder for future content)

### `Dashboard.css`
**What it is:** Styles for the Dashboard component
**What it does:** Dark theme consistent with the login page

---

## 📂 `src/renderer/` - Additional Files

### `AuthCallback.tsx`
**What it is:** Special component shown when processing authentication
**What it does:** Handles the redirect after clicking the magic link

**Two scenarios:**
1. **Opened in Electron app:** Processes tokens and shows success
2. **Opened in browser:** Shows message to return to the app

**Why it's needed:** When you click the magic link, it might open in Safari instead of the Electron app. This component detects which and handles both cases.

### `electron.d.ts`
**What it is:** TypeScript type definitions for `window.electron`
**What it does:** Tells TypeScript what functions are available on `window.electron`

**Why it's needed:** TypeScript needs to know what's available. Without this, you'd get errors like "Property 'electron' does not exist on type 'Window'".

---

## 🔄 How Everything Works Together

### Development Mode (`pnpm dev`)
1. **Vite starts** - React dev server runs on `http://localhost:5173`
2. **TypeScript compiles** - Main process code is compiled to JavaScript
3. **Electron launches** - Opens a window loading `http://localhost:5173`
4. **Auth server starts** - Listens on `http://localhost:54321`
5. **Hot reload enabled** - Changes to React code appear instantly

### Production Build (`pnpm build:electron`)
1. **Vite builds** - Optimizes and bundles React code into `dist/renderer/`
2. **TypeScript compiles** - Converts main process TypeScript to JavaScript in `dist/main/`
3. **Electron Builder packages** - Creates `DevJournal.app` with everything bundled
4. **Result:** Standalone Mac app that doesn't need Node.js or development tools

### Authentication Flow (Hybrid Approach)

This app uses a **hybrid authentication strategy** that adapts to your environment:
- **Development mode** (`pnpm dev`): Uses localhost HTTP server
- **Production mode** (built .app): Uses deep linking with custom URL scheme

This is the **industry standard** approach used by apps like Slack, VS Code, and Discord.

#### Development Flow (localhost)
1. **User enters email** → `Login.tsx` sends request to Supabase
2. **Supabase sends magic link** → Email contains URL to `http://localhost:54321/auth/callback`
3. **User clicks link** → Opens in Safari, browser extracts tokens from URL
4. **Browser sends tokens** → HTTP POST to `http://localhost:54321/auth/tokens`
5. **Auth server receives** → `authServer.ts` gets tokens
6. **Tokens sent to app** → IPC message to renderer process
7. **Session created** → `AuthContext.tsx` calls `supabase.auth.setSession()`
8. **User logged in** → Dashboard shown

**Why localhost in dev?** Fast iteration, hot reload works, no need to rebuild the app for every test.

#### Production Flow (deep linking)
1. **User enters email** → `Login.tsx` sends request to Supabase
2. **Supabase sends magic link** → Email contains URL to `devjournal://auth/callback#access_token=...`
3. **User clicks link** → macOS recognizes `devjournal://` and launches the app
4. **App receives URL** → `main.ts` handles `open-url` event
5. **Tokens extracted** → URL hash parameters parsed
6. **Tokens sent to renderer** → IPC message to renderer process
7. **Session created** → `AuthContext.tsx` calls `supabase.auth.setSession()`
8. **User logged in** → Dashboard shown

**Why deep linking in prod?** Works anywhere (no localhost dependency), native OS integration, more secure.

#### How the Hybrid Detection Works

The `Login.tsx` component automatically detects which environment it's running in:

```typescript
const redirectUrl = import.meta.env.DEV
  ? 'http://localhost:54321/auth/callback'  // Development
  : 'devjournal://auth/callback';           // Production
```

- `import.meta.env.DEV` is `true` when running with `pnpm dev`
- `import.meta.env.DEV` is `false` when running the built .app

**No code changes needed** when switching between development and production!

---

## 🚀 Common Commands

```bash
# Install dependencies
pnpm install

# Run in development mode (with hot reload)
pnpm dev

# Build for production
pnpm build

# Create distributable app (.app, .dmg, .zip)
pnpm build:electron

# Build only the React frontend
pnpm build:renderer

# Build only the Electron backend
pnpm build:main
```

---

## 🧪 Testing Authentication

### Testing in Development Mode
1. Run `pnpm dev`
2. Enter your email in the login form
3. Click the magic link in your email
4. Browser opens → automatically sends tokens to the app
5. App logs you in instantly

**Advantage:** Fast testing with hot reload enabled

### Testing in Production Mode
1. Build the app: `pnpm build:electron`
2. Open the built app: `open release/mac/DevJournal.app`
3. Enter your email in the login form
4. Click the magic link in your email
5. macOS launches the app with the deep link
6. App logs you in instantly

**Advantage:** Tests the real production flow

### Verifying Deep Link Registration
After building, check if the protocol was registered:
```bash
# macOS will show DevJournal as the handler for devjournal://
open "devjournal://test"
```
This should launch your built app (if it doesn't, rebuild with `pnpm build:electron`)

---

## 📚 Key Technologies Explained

### **Electron**
Framework for building desktop apps with web technologies. Combines Chromium (browser) and Node.js (JavaScript runtime).

### **React**
JavaScript library for building user interfaces. Uses components (reusable UI pieces) and manages state (data that changes).

### **TypeScript**
JavaScript with type checking. Catches errors before you run the code. Files end in `.ts` or `.tsx`.

### **Vite**
Build tool for frontend. Fast dev server with hot module replacement (see changes instantly).

### **Supabase**
Backend-as-a-Service. Provides authentication, database, and more without writing backend code.

### **pnpm**
Package manager (installs libraries). Faster and more efficient than npm.

### **Electron Builder**
Tool that packages your app into distributable formats (.app, .dmg, .exe, etc.).

---

## 🔒 Security Notes

### Why `contextIsolation: true`?
Prevents malicious web content from accessing Electron/Node.js APIs. Even if someone tricks your app into loading bad code, it can't access the system.

### Why `nodeIntegration: false`?
Prevents the renderer (web content) from directly accessing Node.js. Must use preload script instead.

### Why `contextBridge`?
Safely exposes specific functions to the renderer. Only what you explicitly allow is accessible.

### Environment Variables
Never commit `.env` to Git! It contains secrets. Use `.env.example` to document what variables are needed.

---

## 🐛 Troubleshooting

### "Electron failed to install correctly"
Run: `pnpm rebuild electron`

### "Module not found"
Run: `pnpm install`

### "Port 5173 already in use"
Kill the process: `lsof -ti:5173 | xargs kill -9`

### "Port 54321 already in use"
Kill the auth server: `lsof -ti:54321 | xargs kill -9`

### App won't open after build
Make sure you built first: `pnpm build:electron`

### Changes not appearing
In dev mode, make sure both Vite and Electron restarted. Try: `pkill -f "concurrently" && pnpm dev`

---

## 📝 Next Steps

This app currently has basic authentication. Here's what you might add next:

1. **Journal entries** - Create, read, update, delete entries
2. **Database schema** - Set up tables in Supabase
3. **Rich text editor** - For writing journal entries
4. **Search/filter** - Find entries by date, tags, etc.
5. **Data sync** - Real-time updates across devices
6. **File attachments** - Upload images, code snippets
7. **Settings page** - Customize app appearance, preferences

---

## 🎓 Learning Resources

- **Electron Docs:** https://www.electronjs.org/docs
- **React Docs:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook
- **Supabase Docs:** https://supabase.com/docs
- **Vite Guide:** https://vitejs.dev/guide

---

## 📄 License

ISC

---

**Built with Electron + React + TypeScript + Supabase**
