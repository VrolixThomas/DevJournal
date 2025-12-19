import express from 'express';
import { BrowserWindow } from 'electron';

let server: any = null;

export function startAuthServer(mainWindow: BrowserWindow): Promise<number> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    // Endpoint to receive tokens from browser
    app.post('/auth/tokens', (req, res) => {
      const { access_token, refresh_token } = req.body;

      if (access_token && refresh_token) {
        // Send tokens to renderer process
        mainWindow.webContents.send('auth-tokens', { access_token, refresh_token });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Missing tokens' });
      }
    });

    app.get('/auth/callback', (_req, res) => {
      // Serve a page that extracts tokens and sends to Electron
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #1a1a1a;
                color: #f0f0f0;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                color: #61dafb;
                margin-bottom: 1rem;
              }
              p {
                color: #888;
                margin-bottom: 2rem;
              }
              .success {
                color: #4ade80;
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #333;
                border-top-color: #61dafb;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h1>Logging you in...</h1>
              <p>Sending credentials to the app...</p>
            </div>
            <script>
              // Extract tokens from URL hash
              const hash = window.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');

              if (accessToken && refreshToken) {
                // Send tokens to Electron app
                fetch('http://localhost:54321/auth/tokens', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    access_token: accessToken,
                    refresh_token: refreshToken
                  })
                })
                .then(() => {
                  document.querySelector('.container').innerHTML = \`
                    <div class="success">✓</div>
                    <h1>Authentication Successful!</h1>
                    <p>You can close this window and return to the app.</p>
                    <p style="color: #61dafb; margin-top: 2rem;">The app will log you in automatically.</p>
                  \`;
                  setTimeout(() => window.close(), 2000);
                })
                .catch(err => {
                  document.querySelector('.container').innerHTML = \`
                    <h1 style="color: #f87171;">Error</h1>
                    <p>Could not communicate with the app. Please make sure DevJournal is running.</p>
                  \`;
                });
              }
            </script>
          </body>
        </html>
      `);
    });

    server = app.listen(54321, () => {
      console.log('Auth callback server running on http://localhost:54321');
      resolve(54321);
    });
  });
}

export function stopAuthServer() {
  if (server) {
    server.close();
    server = null;
  }
}
