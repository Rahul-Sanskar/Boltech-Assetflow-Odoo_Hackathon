import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ProviderFactory } from '../providers/ProviderFactory';
import { MaintenanceRequestSchema, MaintenanceRequest } from '../types/maintenanceRequest';
import { buildMaintenancePrompt } from '../prompts/MaintenancePromptTemplate';
import { parseMaintenanceAnalysis } from '../utils/maintenanceParser';

const router = Router();
const provider = ProviderFactory.getInstance().getProvider();

// Simple retry helper
async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 200): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

router.post('/maintenance/analyze', async (req: Request, res: Response) => {
  // Validate payload
  const parseResult = MaintenanceRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      data: null,
      metadata: { errorCode: 'INVALID_PAYLOAD', details: parseResult.error.format() },
      processingTime: 0,
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
  const maintenanceReq = parseResult.data as MaintenanceRequest;

  const prompt = buildMaintenancePrompt(maintenanceReq);

  try {
    const llmResponse = await retry(() => provider.complete({ prompt }));
    const analysis = parseMaintenanceAnalysis(llmResponse.content);
    return res.json({
      success: true,
      data: analysis,
      metadata: { model: llmResponse.model, tokensUsed: llmResponse.tokensUsed, provider: llmResponse.provider },
      processingTime: 0,
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error) {
    logger.error('Maintenance analysis failed', { error });
    return res.status(400).json({
      success: false,
      data: null,
      metadata: { errorCode: 'ANALYSIS_ERROR' },
      processingTime: 0,
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;
