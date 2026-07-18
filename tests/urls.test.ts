import { getSafeHttpsUrl } from '@/lib/urls';

describe('Milestone 02 URL safety', () => {
  it('accepts HTTPS action URLs', () => {
    expect(getSafeHttpsUrl('https://example.com/account')?.hostname).toBe(
      'example.com',
    );
  });

  it.each([
    null,
    'not a URL',
    'http://example.com',
    'javascript:alert(1)',
    'https://user:password@example.com',
  ])('rejects unsafe action URL %s', (value) => {
    expect(getSafeHttpsUrl(value)).toBeNull();
  });
});
