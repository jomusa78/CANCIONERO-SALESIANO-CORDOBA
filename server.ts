import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Server-side admin password storage
const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.resolve(DATA_DIR, 'admin-config.json');

// Memory cache for runtime
let inMemoryPassword = process.env.ADMIN_PASSWORD || 'admin123';

// Load stored password on server start
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.adminPassword && typeof parsed.adminPassword === 'string') {
      inMemoryPassword = parsed.adminPassword.trim();
      console.log('[Server] Loaded admin password from server configuration file.');
    }
  }
} catch (err) {
  console.warn('[Server] Could not read admin config file, using default/env password:', err);
}

function saveServerPassword(newPass: string): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
      adminPassword: newPass,
      updatedAt: new Date().toISOString()
    }, null, 2), 'utf-8');
    inMemoryPassword = newPass;
    return true;
  } catch (err) {
    console.error('[Server] Error saving admin config to disk:', err);
    // Still update in memory for active server session
    inMemoryPassword = newPass;
    return false;
  }
}

// ----------------------------------------------------
// API ROUTES FOR SERVER-SIDE ADMIN AUTHENTICATION
// ----------------------------------------------------

// Verify admin password
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Por favor introduce la contraseña de administrador.' 
    });
  }

  const expectedPassword = inMemoryPassword;

  if (password.trim() === expectedPassword) {
    return res.json({ 
      success: true, 
      token: `admin-${Date.now()}`,
      message: 'Acceso concedido en el servidor.'
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Contraseña de administrador incorrecta. Verifica e intenta de nuevo.' 
  });
});

// Change admin password on the server
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Se requiere la contraseña actual.' 
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ 
      success: false, 
      message: 'La nueva contraseña debe tener al menos 4 caracteres.' 
    });
  }

  if (currentPassword.trim() !== inMemoryPassword) {
    return res.status(401).json({ 
      success: false, 
      message: 'La contraseña actual no coincide.' 
    });
  }

  const savedToDisk = saveServerPassword(newPassword.trim());

  return res.json({ 
    success: true, 
    message: savedToDisk 
      ? 'Contraseña de administrador actualizada con éxito en el servidor web.'
      : 'Contraseña actualizada en memoria del servidor web.'
  });
});

// Server status check
app.get('/api/admin/status', (_req, res) => {
  res.json({ 
    status: 'ok', 
    serverConfigured: true, 
    timestamp: new Date().toISOString() 
  });
});

// ----------------------------------------------------
// VITE / STATIC SERVING MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] CANCIONERO SALESIANO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
