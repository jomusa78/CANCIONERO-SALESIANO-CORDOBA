// Netlify serverless function for CANCIONERO SALESIANO
// Handles /api/admin/verify and /api/admin/change-password on Netlify

let inMemoryPassword = process.env.ADMIN_PASSWORD || 'admin123';
let inMemoryRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL || 'jomusa78@gmail.com';
let netlifyPendingRecovery: { code: string; expires: number; targetEmail: string } | null = null;

function maskEmailNetlify(email: string): string {
  if (!email || !email.includes('@')) return 'correo configurado';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
}

export const handler = async (event: NetlifyEvent) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  const path = event.path || '';

  // Parse JSON Body
  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'JSON inválido' })
      };
    }
  }

  // Route: /api/admin/verify (or matching sub-path)
  if (path.endsWith('/verify') && event.httpMethod === 'POST') {
    const password = body.password;
    if (!password || typeof password !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Por favor introduce la contraseña de administrador.' })
      };
    }

    const expected = process.env.ADMIN_PASSWORD || inMemoryPassword;
    if (password.trim() === expected.trim()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: `net-admin-${Date.now()}`,
          message: 'Acceso concedido en el servidor Netlify.'
        })
      };
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Contraseña de administrador incorrecta. Verifica e intenta de nuevo.'
      })
    };
  }

  // Route: /api/admin/change-password
  if (path.endsWith('/change-password') && event.httpMethod === 'POST') {
    const { currentPassword, newPassword } = body;
    const expected = process.env.ADMIN_PASSWORD || inMemoryPassword;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Se requiere la contraseña actual.' })
      };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' })
      };
    }

    if (currentPassword.trim() !== expected.trim()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'La contraseña actual no coincide.' })
      };
    }

    inMemoryPassword = newPassword.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contraseña actualizada en la instancia del servidor web Netlify. (Para cambiarla de forma permanente en Netlify, puedes configurar la variable ADMIN_PASSWORD en el panel de Netlify).'
      })
    };
  }

  // Route: /api/admin/recover-request
  if (path.endsWith('/recover-request') && event.httpMethod === 'POST') {
    const { email } = body || {};
    const configuredEmail = inMemoryRecoveryEmail.trim().toLowerCase();
    const inputEmail = (email && typeof email === 'string') ? email.trim().toLowerCase() : '';

    if (inputEmail && inputEmail !== configuredEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `El correo ingresado no coincide con el correo de recuperación registrado (${maskEmailNetlify(configuredEmail)}).`
        })
      };
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    netlifyPendingRecovery = {
      code: recoveryCode,
      expires: Date.now() + 15 * 60 * 1000,
      targetEmail: configuredEmail,
    };

    console.log(`[Netlify] Recuperación generada para ${configuredEmail}: código ${recoveryCode}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        maskedEmail: maskEmailNetlify(configuredEmail),
        previewRecoveryCode: recoveryCode,
        message: `Código de recuperación generado para ${maskEmailNetlify(configuredEmail)}.`
      })
    };
  }

  // Route: /api/admin/recover-reset
  if (path.endsWith('/recover-reset') && event.httpMethod === 'POST') {
    const { code, newPassword } = body || {};

    if (!code || typeof code !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Ingresa el código de 6 dígitos.' })
      };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' })
      };
    }

    if (!netlifyPendingRecovery || Date.now() > netlifyPendingRecovery.expires) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'El código ha expirado o no es válido.' })
      };
    }

    if (netlifyPendingRecovery.code !== code.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Código de recuperación incorrecto.' })
      };
    }

    inMemoryPassword = newPassword.trim();
    netlifyPendingRecovery = null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contraseña restablecida con éxito en Netlify.'
      })
    };
  }

  // Route: /api/admin/update-recovery-email
  if (path.endsWith('/update-recovery-email') && event.httpMethod === 'POST') {
    const { password, newEmail } = body || {};
    const expected = process.env.ADMIN_PASSWORD || inMemoryPassword;

    if (!password || password.trim() !== expected.trim()) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Contraseña incorrecta.' })
      };
    }

    if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Correo inválido.' })
      };
    }

    inMemoryRecoveryEmail = newEmail.trim().toLowerCase();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recoveryEmail: inMemoryRecoveryEmail,
        maskedEmail: maskEmailNetlify(inMemoryRecoveryEmail),
        message: 'Correo de recuperación actualizado con éxito en Netlify.'
      })
    };
  }

  // Route: /api/admin/recovery-info
  if (path.endsWith('/recovery-info') && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasRecoveryEmail: !!inMemoryRecoveryEmail,
        maskedEmail: maskEmailNetlify(inMemoryRecoveryEmail),
      })
    };
  }

  // Route: /api/version
  if (path.endsWith('/version')) {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify({
        version: '1.0.0',
        timestamp: Date.now()
      })
    };
  }

  // Route: /api/admin/status or default
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ok',
      service: 'cancionero-salesiano-netlify-api',
      hasRecoveryEmail: !!inMemoryRecoveryEmail,
      maskedEmail: maskEmailNetlify(inMemoryRecoveryEmail),
      timestamp: new Date().toISOString()
    })
  };
};
