import { triggerCompletionHaptic } from '@/lib/haptics';

describe('Checkpoint 2B haptic feedback', () => {
  it('runs the native haptic request successfully', async () => {
    const request = jest.fn().mockResolvedValue(undefined);

    await expect(triggerCompletionHaptic('ios', request)).resolves.toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does not request haptics on web', async () => {
    const request = jest.fn().mockResolvedValue(undefined);

    await expect(triggerCompletionHaptic('web', request)).resolves.toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('catches native haptic failures', async () => {
    const request = jest.fn().mockRejectedValue(new Error('Unavailable'));

    await expect(triggerCompletionHaptic('ios', request)).resolves.toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
