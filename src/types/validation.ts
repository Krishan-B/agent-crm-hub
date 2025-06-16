
export interface ValidationError {
  row: number;
  field: string;
  error: string;
  value: any;
  data: any;
}

export interface ValidationResult {
  validData: any[];
  invalidData: any[];
  errors: ValidationError[];
  hasErrors: boolean;
}

export type ValidationMode = 'strict' | 'relaxed';
