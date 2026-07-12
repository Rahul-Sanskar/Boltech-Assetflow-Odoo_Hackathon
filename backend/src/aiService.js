// AI service client for the Python FastAPI service.
// Uses the built-in fetch (Node 18+) – no external dependency required.

const BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT) || 8000;

/**
 * Generic helper to call an AI endpoint.
 * Returns the parsed JSON, or an error object on any failure
 * (timeout, network error, invalid JSON, missing API key, AI server down).
 */
async function callEndpoint(path, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { error: 'Invalid JSON returned by AI service' };
    }

    if (data && data.error) {
      return { error: data.error };
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { error: 'AI request timed out. Please try again.' };
    }
    return { error: 'AI service is unavailable. Please try again later.' };
  }
}

async function maintenanceAI(data) {
  return callEndpoint('/maintenance', data);
}

async function dashboardAI(data) {
  return callEndpoint('/dashboard', data);
}

async function auditAI(data) {
  return callEndpoint('/audit', data);
}

async function bookingAI(data) {
  return callEndpoint('/booking', data);
}

async function descriptionAI(data) {
  return callEndpoint('/description', data);
}

async function chatAI(data) {
  return callEndpoint('/chat', data);
}

module.exports = {
  maintenanceAI,
  dashboardAI,
  auditAI,
  bookingAI,
  descriptionAI,
  chatAI,
};
