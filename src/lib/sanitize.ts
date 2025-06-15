
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  // Strip all HTML tags from input, leaving only text content.
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: false } });
};
