
import type { ValidationError } from '../types/validation';
import { isValidEmail, isValidPhone, isValidNumber } from './fieldValidators';

export const validateSingleLead = (record: any, rowNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!record.first_name || record.first_name.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'first_name',
      error: 'First name is required',
      value: record.first_name,
      data: record
    });
  }

  if (!record.last_name || record.last_name.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'last_name',
      error: 'Last name is required',
      value: record.last_name,
      data: record
    });
  }

  if (!record.email || record.email.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'email',
      error: 'Email is required',
      value: record.email,
      data: record
    });
  } else if (!isValidEmail(record.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      error: 'Invalid email format',
      value: record.email,
      data: record
    });
  }

  if (!record.country || record.country.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'country',
      error: 'Country is required',
      value: record.country,
      data: record
    });
  }

  // Optional fields validation
  if (record.phone && !isValidPhone(record.phone)) {
    errors.push({
      row: rowNumber,
      field: 'phone',
      error: 'Invalid phone format',
      value: record.phone,
      data: record
    });
  }

  if (record.balance && !isValidNumber(record.balance)) {
    errors.push({
      row: rowNumber,
      field: 'balance',
      error: 'Balance must be a valid number',
      value: record.balance,
      data: record
    });
  }

  if (record.bonus_amount && !isValidNumber(record.bonus_amount)) {
    errors.push({
      row: rowNumber,
      field: 'bonus_amount',
      error: 'Bonus amount must be a valid number',
      value: record.bonus_amount,
      data: record
    });
  }

  // Status validation
  const validStatuses = ['new', 'contacted', 'qualified', 'active', 'inactive', 'archived'];
  if (record.status && !validStatuses.includes(record.status)) {
    errors.push({
      row: rowNumber,
      field: 'status',
      error: `Status must be one of: ${validStatuses.join(', ')}`,
      value: record.status,
      data: record
    });
  }

  // KYC status validation
  const validKycStatuses = ['not_submitted', 'pending', 'approved', 'rejected'];
  if (record.kyc_status && !validKycStatuses.includes(record.kyc_status)) {
    errors.push({
      row: rowNumber,
      field: 'kyc_status',
      error: `KYC status must be one of: ${validKycStatuses.join(', ')}`,
      value: record.kyc_status,
      data: record
    });
  }

  return errors;
};
