import { describe, it, expect } from 'vitest';
import { sanitizeReturnTo } from '../src/app/router';

describe('sanitizeReturnTo', () => {
  it('chấp nhận các đường dẫn nội bộ hợp lệ', () => {
    expect(sanitizeReturnTo('/admin')).toBe('/admin');
    expect(sanitizeReturnTo('/item/abc-123')).toBe('/item/abc-123');
    expect(sanitizeReturnTo('/chat?query=hello')).toBe('/chat?query=hello');
  });

  it('chặn các đường dẫn độc hại và open redirect', () => {
    // Protocol-relative URL
    expect(sanitizeReturnTo('//evil.com')).toBe('/');
    expect(sanitizeReturnTo('//evil.com/path')).toBe('/');

    // Absolute URLs
    expect(sanitizeReturnTo('http://evil.com')).toBe('/');
    expect(sanitizeReturnTo('https://malicious.org/phishing')).toBe('/');

    // Javascript scheme
    expect(sanitizeReturnTo('javascript:alert(1)')).toBe('/');

    // Backslash bypass
    expect(sanitizeReturnTo('/\\evil.com')).toBe('/');

    // Empty hoặc null
    expect(sanitizeReturnTo(null)).toBe('/');
    expect(sanitizeReturnTo(undefined)).toBe('/');
    expect(sanitizeReturnTo('')).toBe('/');
  });
});
