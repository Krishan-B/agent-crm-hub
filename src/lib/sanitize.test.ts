
import { describe, it, expect } from 'vitest';
import { sanitizeInput } from './sanitize';

describe('sanitizeInput', () => {
  it('should remove script tags', () => {
    const dirty = '<script>alert("hello")</script>';
    expect(sanitizeInput(dirty)).toBe('');
  });

  it('should remove HTML tags but keep content', () => {
    const dirty = '<b>hello</b> <span>world</span>';
    expect(sanitizeInput(dirty)).toBe('hello world');
  });

  it('should keep plain text', () => {
    const clean = 'hello world 123';
    expect(sanitizeInput(clean)).toBe(clean);
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle mixed content', () => {
    const mixed = 'Text with <img src="x" onerror="alert(1)"> and <a href="javascript:alert(2)">link</a>';
    expect(sanitizeInput(mixed)).toBe('Text with  and link');
  });
});

