
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorMessage } from '@/components/ui/error-message';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useRetry } from '@/hooks/useRetry';
import { loginSchema } from '@/lib/validation';
import { sanitizeInput } from '@/lib/sanitize';

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const { login, user, isLoading } = useAuth();
  const { retry, isRetrying, attemptCount } = useRetry({ maxAttempts: 3, delay: 1000 });

  const {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    handleSubmit
  } = useFormValidation(loginSchema, {
    email: '',
    password: ''
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (formValues: typeof values) => {
    setError('');
    
    try {
      const sanitizedEmail = sanitizeInput(formValues.email);
      const sanitizedPassword = sanitizeInput(formValues.password);

      await retry(async () => {
        const result = await login(sanitizedEmail, sanitizedPassword);
        if (result.error) {
          throw new Error(result.error);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mobile-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="mobile-heading font-bold text-blue-600">Plexop CRM</CardTitle>
          <CardDescription className="mobile-text">Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="mobile-form-spacing">
            <div className="space-y-2">
              <Label htmlFor="email" className="mobile-text">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                onBlur={() => setTouched('email')}
                required
                placeholder="Enter your email"
                className="touch-target text-base"
                autoComplete="email"
              />
              {touched.email && errors.email && (
                <ErrorMessage message={errors.email.message} type="error" />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="mobile-text">Password</Label>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => setValue('password', e.target.value)}
                onBlur={() => setTouched('password')}
                required
                placeholder="Enter your password"
                className="touch-target text-base"
                autoComplete="current-password"
              />
              {touched.password && errors.password && (
                <ErrorMessage message={errors.password.message} type="error" />
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="mobile-text">
                  {error}
                  {isRetrying && attemptCount > 1 && (
                    <span className="block mt-1 text-xs">
                      Retrying... (Attempt {attemptCount}/3)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full touch-target" 
              disabled={isLoading || isRetrying || !isValid}
              size="lg"
            >
              {isLoading || isRetrying ? (
                isRetrying ? `Retrying... (${attemptCount}/3)` : 'Signing in...'
              ) : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
