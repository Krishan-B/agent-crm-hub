
import { useState } from 'react';
import { leadSchema } from '../lib/validation';

interface ValidationError {
  row: number;
  field: string;
  error: string;
  value: any;
}

interface ValidationResult {
  validData: any[];
  invalidData: any[];
  errors: ValidationError[];
  hasErrors: boolean;
}

export const useDataValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateLeadsData = async (data: any[], mode: 'strict' | 'relaxed'): Promise<ValidationResult> => {
    setIsValidating(true);
    
    const validData: any[] = [];
    const invalidData: any[] = [];
    const errors: ValidationError[] = [];

    for (const [index, record] of data.entries()) {
      const rowNumber = record._rowNumber || index + 1;
      const recordErrors = validateSingleLead(record, rowNumber);
      
      if (recordErrors.length === 0) {
        validData.push(record);
      } else {
        errors.push(...recordErrors);
        if (mode === 'strict') {
          invalidData.push(record);
        } else {
          // In relaxed mode, try to fix common issues
          const fixedRecord = attemptDataFix(record);
          const fixedErrors = validateSingleLead(fixedRecord, rowNumber);
          
          if (fixedErrors.length === 0) {
            validData.push(fixedRecord);
          } else {
            invalidData.push(record);
          }
        }
      }
    }

    const result = {
      validData,
      invalidData,
      errors,
      hasErrors: errors.length > 0
    };

    setValidationErrors(errors);
    setIsValidating(false);
    
    return result;
  };

  const validateSingleLead = (record: any, rowNumber: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!record.first_name || record.first_name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'first_name',
        error: 'First name is required',
        value: record.first_name
      });
    }

    if (!record.last_name || record.last_name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'last_name',
        error: 'Last name is required',
        value: record.last_name
      });
    }

    if (!record.email || record.email.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'email',
        error: 'Email is required',
        value: record.email
      });
    } else if (!isValidEmail(record.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        error: 'Invalid email format',
        value: record.email
      });
    }

    if (!record.country || record.country.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'country',
        error: 'Country is required',
        value: record.country
      });
    }

    // Optional fields validation
    if (record.phone && !isValidPhone(record.phone)) {
      errors.push({
        row: rowNumber,
        field: 'phone',
        error: 'Invalid phone format',
        value: record.phone
      });
    }

    if (record.balance && !isValidNumber(record.balance)) {
      errors.push({
        row: rowNumber,
        field: 'balance',
        error: 'Balance must be a valid number',
        value: record.balance
      });
    }

    if (record.bonus_amount && !isValidNumber(record.bonus_amount)) {
      errors.push({
        row: rowNumber,
        field: 'bonus_amount',
        error: 'Bonus amount must be a valid number',
        value: record.bonus_amount
      });
    }

    // Status validation
    const validStatuses = ['new', 'contacted', 'qualified', 'active', 'inactive', 'archived'];
    if (record.status && !validStatuses.includes(record.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        error: `Status must be one of: ${validStatuses.join(', ')}`,
        value: record.status
      });
    }

    // KYC status validation
    const validKycStatuses = ['not_submitted', 'pending', 'approved', 'rejected'];
    if (record.kyc_status && !validKycStatuses.includes(record.kyc_status)) {
      errors.push({
        row: rowNumber,
        field: 'kyc_status',
        error: `KYC status must be one of: ${validKycStatuses.join(', ')}`,
        value: record.kyc_status
      });
    }

    return errors;
  };

  const attemptDataFix = (record: any): any => {
    const fixed = { ...record };

    // Trim whitespace
    Object.keys(fixed).forEach(key => {
      if (typeof fixed[key] === 'string') {
        fixed[key] = fixed[key].trim();
      }
    });

    // Fix email case
    if (fixed.email) {
      fixed.email = fixed.email.toLowerCase();
    }

    // Fix phone format
    if (fixed.phone) {
      fixed.phone = fixed.phone.replace(/\D/g, ''); // Remove non-digits
      if (fixed.phone.length >= 10) {
        // Add + if missing for international format
        if (!fixed.phone.startsWith('+')) {
          fixed.phone = '+' + fixed.phone;
        }
      }
    }

    // Fix status case
    if (fixed.status) {
      fixed.status = fixed.status.toLowerCase();
    }

    // Fix KYC status case
    if (fixed.kyc_status) {
      fixed.kyc_status = fixed.kyc_status.toLowerCase();
    }

    // Set default values
    if (!fixed.status) {
      fixed.status = 'new';
    }

    if (!fixed.kyc_status) {
      fixed.kyc_status = 'not_submitted';
    }

    return fixed;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const isValidNumber = (value: string): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  };

  return {
    validateLeadsData,
    validateSingleLead,
    validationErrors,
    isValidating
  };
};
