/* Thin fetch wrapper around the FastAPI backend. */
const API = (() => {
  let baseUrl = localStorage.getItem('acaBaseUrl') || 'http://localhost:8000';

  function setBaseUrl(url) {
    baseUrl = url.replace(/\/$/, '');
    localStorage.setItem('acaBaseUrl', baseUrl);
  }

  function getBaseUrl() {
    return baseUrl;
  }

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
  }

  return {
    setBaseUrl,
    getBaseUrl,
    status: () => request('/'),
    chat: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    generateCode: (prompt, language) =>
      request('/generate-code', { method: 'POST', body: JSON.stringify({ prompt, language }) }),
    explainCode: (code) => request('/explain-code', { method: 'POST', body: JSON.stringify({ code }) }),
    debugCode: (code) => request('/debug-code', { method: 'POST', body: JSON.stringify({ code }) }),
    optimizeCode: (code) => request('/optimize-code', { method: 'POST', body: JSON.stringify({ code }) }),
    complexity: (code) => request('/complexity', { method: 'POST', body: JSON.stringify({ code }) }),
    convertCode: (code, source_language, target_language) =>
      request('/convert-code', {
        method: 'POST',
        body: JSON.stringify({ code, source_language, target_language }),
      }),
    generateDocs: (code) => request('/generate-docs', { method: 'POST', body: JSON.stringify({ code }) }),
    securityScan: (code) => request('/security-scan', { method: 'POST', body: JSON.stringify({ code }) }),
    generateProject: (prompt) =>
      request('/generate-project', { method: 'POST', body: JSON.stringify({ prompt, language: 'multi' }) }),
    getHistory: () => request('/history'),
    clearHistory: () => request('/history', { method: 'DELETE' }),
  };
})();
