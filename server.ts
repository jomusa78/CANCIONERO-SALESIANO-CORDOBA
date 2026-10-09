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
let inMemoryRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL || 'jomusa78@gmail.com';

// Load stored password and recovery email on server start
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.adminPassword && typeof parsed.adminPassword === 'string') {
      inMemoryPassword = parsed.adminPassword.trim();
      console.log('[Server] Loaded admin password from server configuration file.');
    }
    if (parsed.recoveryEmail && typeof parsed.recoveryEmail === 'string') {
      inMemoryRecoveryEmail = parsed.recoveryEmail.trim();
      console.log('[Server] Loaded recovery email from server configuration file:', inMemoryRecoveryEmail);
    }
  }
} catch (err) {
  console.warn('[Server] Could not read admin config file, using default/env password:', err);
}

function saveServerConfig(updates: { adminPassword?: string; recoveryEmail?: string }): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let currentData: any = {};
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        currentData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      } catch {
        currentData = {};
      }
    }

    if (updates.adminPassword) {
      inMemoryPassword = updates.adminPassword;
      currentData.adminPassword = updates.adminPassword;
    }
    if (updates.recoveryEmail !== undefined) {
      inMemoryRecoveryEmail = updates.recoveryEmail;
      currentData.recoveryEmail = updates.recoveryEmail;
    }
    currentData.updatedAt = new Date().toISOString();

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Server] Error saving admin config to disk:', err);
    if (updates.adminPassword) inMemoryPassword = updates.adminPassword;
    if (updates.recoveryEmail !== undefined) inMemoryRecoveryEmail = updates.recoveryEmail;
    return false;
  }
}

function saveServerPassword(newPass: string): boolean {
  return saveServerConfig({ adminPassword: newPass });
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

// Helper function to mask email: e.g. "jomusa78@gmail.com" -> "j***8@gmail.com"
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'correo configurado';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// Memory store for verification recovery codes: { code: string, expires: number }
let pendingRecovery: { code: string; expires: number; targetEmail: string } | null = null;

// Request password recovery to email
app.post('/api/admin/recover-request', (req, res) => {
  const { email } = req.body || {};

  const configuredEmail = inMemoryRecoveryEmail.trim().toLowerCase();
  const inputEmail = (email && typeof email === 'string') ? email.trim().toLowerCase() : '';

  // If email was provided, check if it matches configured email
  if (inputEmail && inputEmail !== configuredEmail) {
    return res.status(400).json({
      success: false,
      message: `El correo ingresado no coincide con el correo de recuperación registrado (${maskEmail(configuredEmail)}).`
    });
  }

  // Generate 6-digit recovery code
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  pendingRecovery = {
    code: recoveryCode,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    targetEmail: configuredEmail,
  };

  console.log(`[Server] ==============================================`);
  console.log(`[Server] SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA`);
  console.log(`[Server] Correo de destino: ${configuredEmail}`);
  console.log(`[Server] Código de recuperación de un solo uso: ${recoveryCode}`);
  console.log(`[Server] Contraseña actual del sistema: ${inMemoryPassword}`);
  console.log(`[Server] ==============================================`);

  return res.json({
    success: true,
    maskedEmail: maskEmail(configuredEmail),
    // Send preview code for easy immediate retrieval in environments without external SMTP
    previewRecoveryCode: recoveryCode,
    message: `Se ha generado el código de recuperación para ${maskEmail(configuredEmail)}. Utiliza el código para restablecer la contraseña.`
  });
});

// Verify recovery code and reset password
app.post('/api/admin/recover-reset', (req, res) => {
  const { code, newPassword } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Ingresa el código de recuperación de 6 dígitos.'
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 4 caracteres.'
    });
  }

  if (!pendingRecovery || Date.now() > pendingRecovery.expires) {
    return res.status(400).json({
      success: false,
      message: 'El código de recuperación ha expirado o no es válido. Solicita uno nuevo.'
    });
  }

  if (pendingRecovery.code !== code.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Código de recuperación incorrecto.'
    });
  }

  // Reset password
  saveServerPassword(newPassword.trim());
  pendingRecovery = null; // Invalidate code

  return res.json({
    success: true,
    message: 'Contraseña restablecida con éxito en el servidor web. Ya puedes iniciar sesión con tu nueva clave.'
  });
});

// Configure or update recovery email (requires admin authentication or allows admin to update)
app.post('/api/admin/update-recovery-email', (req, res) => {
  const { password, newEmail } = req.body || {};

  if (!password || password.trim() !== inMemoryPassword) {
    return res.status(401).json({
      success: false,
      message: 'Contraseña de administrador requerida para cambiar el correo de recuperación.'
    });
  }

  if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Por favor introduce una dirección de correo electrónico válida.'
    });
  }

  saveServerConfig({ recoveryEmail: newEmail.trim().toLowerCase() });

  return res.json({
    success: true,
    recoveryEmail: newEmail.trim().toLowerCase(),
    maskedEmail: maskEmail(newEmail.trim().toLowerCase()),
    message: 'Correo de recuperación actualizado con éxito en el servidor.'
  });
});

// Get public recovery info (masked email)
app.get('/api/admin/recovery-info', (_req, res) => {
  res.json({
    hasRecoveryEmail: !!inMemoryRecoveryEmail,
    maskedEmail: maskEmail(inMemoryRecoveryEmail),
  });
});

// Server status check
app.get('/api/admin/status', (_req, res) => {
  res.json({ 
    status: 'ok', 
    serverConfigured: true, 
    hasRecoveryEmail: !!inMemoryRecoveryEmail,
    maskedEmail: maskEmail(inMemoryRecoveryEmail),
    timestamp: new Date().toISOString() 
  });
});

// ----------------------------------------------------
// PERSISTENT SONGS API (MULTI-DEVICE SYNCHRONIZATION)
// ----------------------------------------------------
const SONGS_FILE = path.resolve(DATA_DIR, 'songs.json');

function getServerSongs(): any[] | null {
  try {
    if (fs.existsSync(SONGS_FILE)) {
      const raw = fs.readFileSync(SONGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[Server] Error reading songs database:', err);
  }
  return null;
}

function saveServerSongs(songsList: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SONGS_FILE, JSON.stringify(songsList, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Server] Error writing songs database:', err);
    return false;
  }
}

// GET all songs
app.get('/api/songs', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const list = getServerSongs();
  res.json({
    success: true,
    songs: list || [],
    count: list ? list.length : 0,
    hasCustomData: list !== null
  });
});

// POST song (bulk replace or single upsert)
app.post('/api/songs', (req, res) => {
  const payload = req.body;
  if (Array.isArray(payload)) {
    saveServerSongs(payload);
    return res.json({ success: true, count: payload.length });
  } else if (payload && typeof payload === 'object' && payload.id) {
    let currentSongs = getServerSongs() || [];
    const index = currentSongs.findIndex((s: any) => s.id === payload.id);
    if (index >= 0) {
      currentSongs[index] = { ...currentSongs[index], ...payload, updatedAt: new Date().toISOString() };
    } else {
      currentSongs = [payload, ...currentSongs];
    }
    saveServerSongs(currentSongs);
    return res.json({ success: true, song: payload, total: currentSongs.length });
  }
  return res.status(400).json({ success: false, message: 'Formato de canción inválido.' });
});

// DELETE song by id
app.delete('/api/songs/:id', (req, res) => {
  const songId = req.params.id;
  let currentSongs = getServerSongs() || [];
  const initialLength = currentSongs.length;
  currentSongs = currentSongs.filter((s: any) => s.id !== songId);
  saveServerSongs(currentSongs);
  return res.json({
    success: true,
    deleted: initialLength !== currentSongs.length,
    remaining: currentSongs.length
  });
});

// ----------------------------------------------------
// ANTI-CACHE & VERSION CHECK ENDPOINTS
// ----------------------------------------------------
const serverStartTime = Date.now().toString();

app.get(['/api/version', '/version.json'], (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.json({
    version: '1.0.0',
    buildTime: serverStartTime,
    timestamp: Date.now()
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

    // Intercept requests for HTML and enforce no-cache
    app.use((req, res, next) => {
      if (req.path === '/' || req.path === '/index.html' || req.path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
      }
      next();
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('version.json')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filePath.includes('/assets/')) {
          // Hashed assets are safe to cache immutably
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] CANCIONERO SALESIANO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
