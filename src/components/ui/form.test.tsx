
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';
import { Form, FormField, FormItem, FormMessage, FormControl } from './form';
import { Input } from './input';

const TestForm = ({ errorMessage }: { errorMessage: string }) => {
  const form = useForm({
    defaultValues: {
      testField: '',
    },
  });

  React.useEffect(() => {
    form.setError('testField', { type: 'manual', message: errorMessage });
  }, [form, errorMessage]);

  return (
    <FormProvider {...form}>
      <form>
        <FormField
          control={form.control}
          name="testField"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </FormProvider>
  );
};

describe('FormMessage', () => {
  it('should strip HTML and scripts from error messages', () => {
    const maliciousMessage = '<span>Malicious</span><script>alert("XSS")</script> and some text';
    render(<TestForm errorMessage={maliciousMessage} />);
    
    const errorMessageElement = screen.getByText('Malicious and some text');
    expect(errorMessageElement).toBeInTheDocument();
    
    const scriptTag = document.querySelector('script');
    expect(scriptTag).not.toBeInTheDocument();

    expect(errorMessageElement.innerHTML).toBe('Malicious and some text');
    expect(errorMessageElement.querySelector('span')).toBeNull();
  });

  it('should render plain text error messages correctly', () => {
    const plainMessage = 'This is a simple error.';
    render(<TestForm errorMessage={plainMessage} />);
    
    expect(screen.getByText(plainMessage)).toBeInTheDocument();
  });
});
