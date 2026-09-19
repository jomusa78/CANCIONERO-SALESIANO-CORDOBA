// Netlify serverless function for CANCIONERO SALESIANO
// Handles /api/admin/verify and /api/admin/change-password on Netlify

let inMemoryPassword = process.env.ADMIN_PASSWORD || 'admin123';

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

  // Route: /api/admin/status or default
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ok',
      service: 'cancionero-salesiano-netlify-api',
      timestamp: new Date().toISOString()
    })
  };
};
