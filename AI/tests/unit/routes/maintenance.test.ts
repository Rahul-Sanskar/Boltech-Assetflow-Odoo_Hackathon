import request from 'supertest';
import { App } from '../../../src/app';
import { ProviderFactory } from '../../../src/providers/ProviderFactory';
import { LLMProvider } from '../../../src/providers/LLMProvider';

// Mock provider
class MockProvider implements LLMProvider {
  name = 'mock';
  async complete() {
    return {
      content: JSON.stringify({
        category: 'Hardware',
        priority: 'High',
        probableCause: 'Dust accumulation',
        estimatedRepairTime: '2-3 hours',
        recommendation: 'Inspect cooling fan',
        technicianSkill: 'Hardware Technician',
        riskLevel: 'Medium',
        preventiveSuggestion: 'Regular cleaning',
        confidence: 0.9,
      }),
      model: 'mock-model',
      tokensUsed: 10,
      provider: 'mock',
    };
  }
}

beforeAll(() => {
  // Replace real provider with mock
  ProviderFactory.getInstance().initializeOpenRouter('', '', '');
  // @ts-ignore
  ProviderFactory.getInstance().getProvider = () => new MockProvider();
});

describe('POST /maintenance/analyze', () => {
  it('should return analysis for valid payload', async () => {
    const appInstance = new App();
    await appInstance.initialize();
    const res = await request(appInstance.app)
      .post('/api/ai/maintenance/analyze')
      .send({
        assetType: 'Laptop',
        assetCategory: 'Computing',
        issueDescription: 'Overheating',
        assetAge: 2,
        previousMaintenanceCount: 1,
      })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('category');
  });

  it('should reject invalid payload', async () => {
    const appInstance = new App();
    await appInstance.initialize();
    const res = await request(appInstance.app)
      .post('/api/ai/maintenance/analyze')
      .send({ assetType: '' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
