import { describe, expect, it } from 'vitest';
import { checkVideoCapability } from '../../ai/capabilities';

describe('verified video capability router', () => {
  it('routes existing-video editing to Omni, not Veo', () => {
    expect(checkVideoCapability('veo-3.1-generate-preview', 'videoToVideo').supported).toBe(false);
    expect(checkVideoCapability('gemini-omni-flash-preview', 'videoToVideo').supported).toBe(true);
  });
});
