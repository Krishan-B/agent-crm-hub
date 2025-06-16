
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface FieldError {
  message: string;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  });

  const validateField = useCallback((name: keyof T, value: any) => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = schema.pick({ [name]: true } as any);
      fieldSchema.parse({ [name]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { message: error.errors[0]?.message || 'Invalid value' };
      }
      return { message: 'Validation error' };
    }
  }, [schema]);

  const validateForm = useCallback((values: T) => {
    try {
      schema.parse(values);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, FieldError>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          if (path) {
            errors[path] = { message: err.message };
          }
        });
        return errors;
      }
      return {};
    }
  }, [schema]);

  const setValue = useCallback((name: keyof T, value: any) => {
    setState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const fieldError = validateField(name, value);
      const newErrors = { ...prev.errors };
      
      if (fieldError) {
        newErrors[name] = fieldError;
      } else {
        delete newErrors[name];
      }

      const allErrors = validateForm(newValues);
      const isValid = Object.keys(allErrors).length === 0;

      return {
        ...prev,
        values: newValues,
        errors: prev.touched[name] ? newErrors : prev.errors,
        isValid
      };
    });
  }, [validateField, validateForm]);

  const setTouched = useCallback((name: keyof T) => {
    setState(prev => {
      const fieldError = validateField(name, prev.values[name]);
      const newErrors = { ...prev.errors };
      
      if (fieldError) {
        newErrors[name] = fieldError;
      }

      return {
        ...prev,
        touched: { ...prev.touched, [name]: true },
        errors: newErrors
      };
    });
  }, [validateField]);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: false,
      isSubmitting: false
    });
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(state.values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);

      const allErrors = validateForm(state.values);
      const isValid = Object.keys(allErrors).length === 0;

      setState(prev => ({
        ...prev,
        touched: allTouched,
        errors: allErrors,
        isValid,
        isSubmitting: true
      }));

      if (isValid) {
        try {
          await onSubmit(state.values);
        } finally {
          setState(prev => ({ ...prev, isSubmitting: false }));
        }
      } else {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    };
  }, [state.values, validateForm]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    setValue,
    setTouched,
    setSubmitting,
    reset,
    handleSubmit
  };
};
