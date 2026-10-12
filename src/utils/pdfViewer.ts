/**
 * Utility functions for handling PDF rendering and opening across all browsers and devices.
 * Browsers block navigating top frames to data: URLs (e.g. data:application/pdf;base64,...),
 * so we convert them to safe same-origin blob: URLs (blob:https://...) which open reliably.
 */

// Cache blob URLs to avoid memory leaks and repeated conversions
const blobUrlCache = new Map<string, string>();

/**
 * Converts a data URL or base64 string to a Blob URL (blob:...).
 * If already an HTTP/HTTPS or blob: URL, returns it directly.
 */
export function getPdfBlobUrl(urlOrData?: string): string | null {
  if (!urlOrData || typeof urlOrData !== 'string') {
    return null;
  }

  const trimmed = urlOrData.trim();
  if (!trimmed) return null;

  // If it's already an http, https, or blob URL, return it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Check cache
  const cached = blobUrlCache.get(trimmed);
  if (cached) {
    return cached;
  }

  try {
    let base64 = trimmed;
    let mimeType = 'application/pdf';

    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1] || 'application/pdf';
        base64 = match[2];
      } else {
        const commaIdx = trimmed.indexOf(',');
        if (commaIdx !== -1) {
          base64 = trimmed.substring(commaIdx + 1);
        }
      }
    }

    // Clean whitespace/newlines from base64 string
    const cleanBase64 = base64.replace(/\s+/g, '');
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(trimmed, blobUrl);
    return blobUrl;
  } catch (err) {
    console.error('[pdfViewer] Error converting PDF to blob URL:', err);
    return trimmed;
  }
}

/**
 * Reliably opens a PDF in a new browser tab/window or native PDF viewer.
 * Works even in sandboxed environments, cross-origin iframes, and mobile devices.
 */
export function openPdfDirectly(urlOrData?: string, filename?: string): boolean {
  if (!urlOrData) {
    console.warn('[pdfViewer] Cannot open PDF: No URL or data provided');
    return false;
  }

  const blobUrl = getPdfBlobUrl(urlOrData);
  if (!blobUrl) {
    return false;
  }

  try {
    // Attempt standard window.open with the safe blob: URL
    const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (newWindow && !newWindow.closed) {
      newWindow.focus();
      return true;
    }
  } catch (e) {
    console.warn('[pdfViewer] window.open failed, trying link fallback:', e);
  }

  // Fallback: programmatic anchor click
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (filename) {
      a.setAttribute('data-filename', filename);
    }
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
    return true;
  } catch (err) {
    console.error('[pdfViewer] Fallback click also failed:', err);
    return false;
  }
}
