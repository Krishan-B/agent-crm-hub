
import { useState } from 'react';
import type { ValidationError, ValidationResult, ValidationMode } from '../types/validation';
import { validateSingleLead } from '../utils/leadValidator';
import { attemptDataFix } from '../utils/dataFixer';

export const useDataValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateLeadsData = async (data: any[], mode: ValidationMode): Promise<ValidationResult> => {
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

  return {
    validateLeadsData,
    validateSingleLead,
    validationErrors,
    isValidating
  };
};
