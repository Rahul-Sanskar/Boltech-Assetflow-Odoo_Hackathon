const { sendSuccess, sendError } = require('../utils/response');
const { maintenanceAI, dashboardAI, auditAI, bookingAI, descriptionAI, chatAI } = require('../aiService');

// Helper to handle AI result and fallback
function handleResult(res, result) {
  if (result && !result.error) {
    return sendSuccess(res, { message: 'AI response', data: { ...result, available: true } });
  }
  return sendSuccess(res, { message: 'AI unavailable', data: { error: result?.error || 'Service down', available: false } });
}

// Maintenance analysis
exports.maintenance = async (req, res) => {
  const { issue, asset } = req.body;
  // Even if required fields are missing, respond with 200 and error info for graceful degradation
  if (!issue || !asset) {
    return sendSuccess(res, { message: 'Invalid input', data: { error: 'Missing issue or asset', available: false } });
  }
  const result = await maintenanceAI({ issue, asset });
  return handleResult(res, result);
};

// Dashboard insights
exports.dashboard = async (req, res) => {
  const result = await dashboardAI();
  return handleResult(res, result);
};

// Audit summary
exports.audit = async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return sendSuccess(res, { message: 'Invalid input', data: { error: 'Missing data', available: false } });
  }
  const result = await auditAI({ data });
  return handleResult(res, result);
};

// Booking suggestions
exports.booking = async (req, res) => {
  const { asset_name, requested_by, start_date, end_date } = req.body;
  if (!asset_name || !requested_by || !start_date || !end_date) {
    return sendSuccess(res, { message: 'Invalid input', data: { error: 'Missing booking fields', available: false } });
  }
  const result = await bookingAI({ asset_name, requested_by, start_date, end_date });
  return handleResult(res, result);
};

// Description generation
exports.description = async (req, res) => {
  const { asset_name, category } = req.body;
  if (!asset_name || !category) {
    return sendSuccess(res, { message: 'Invalid input', data: { error: 'Missing asset_name or category', available: false } });
  }
  const result = await descriptionAI({ asset_name, category });
  return handleResult(res, result);
};

// Chat endpoint
exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return sendSuccess(res, { message: 'Invalid input', data: { error: 'Missing message', available: false } });
  }
  const result = await chatAI({ message });
  return handleResult(res, result);
};
