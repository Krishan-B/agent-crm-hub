
import { useAuditLog } from '../hooks/useAuditLog';
import { useRateLimit } from '../hooks/useRateLimit';

// Security helper functions
export const createSecurityLogger = () => {
  const { createAuditLog } = useAuditLog();

  return {
    logUserAction: async (action: string, details?: any) => {
      await createAuditLog(action, undefined, undefined, undefined, details);
    },
    
    logDataChange: async (tableName: string, recordId: string, oldValues: any, newValues: any) => {
      await createAuditLog('update', tableName, recordId, oldValues, newValues);
    },
    
    logSecurityEvent: async (event: string, details: any) => {
      await createAuditLog(`security_${event}`, undefined, undefined, undefined, details);
    }
  };
};

export const createRateLimiter = () => {
  const { checkRateLimit } = useRateLimit();

  return {
    checkLoginAttempts: async (identifier: string) => {
      return await checkRateLimit(identifier, 'login', 5, 15); // 5 attempts per 15 minutes
    },
    
    checkAPIRequests: async (identifier: string) => {
      return await checkRateLimit(identifier, 'api_request', 100, 1); // 100 requests per minute
    },
    
    checkPasswordReset: async (identifier: string) => {
      return await checkRateLimit(identifier, 'password_reset', 3, 60); // 3 attempts per hour
    }
  };
};

// Security validation helpers
export const validateSecureInput = (input: string): boolean => {
  // Basic input validation to prevent common attacks
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

export const sanitizeFilename = (filename: string): string => {
  // Remove or replace dangerous characters in filenames
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
};

export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
};
