import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorMessage } from '@/components/ui/error-message';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useRetry } from '@/hooks/useRetry';
import { signupSchema } from '@/lib/validation';
import { sanitizeInput } from '@/lib/sanitize';
import { z } from 'zod';

interface AddUserDialogProps {
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const { retry, isRetrying, attemptCount } = useRetry({ maxAttempts: 3, delay: 1000 });

  const formSchema = signupSchema.extend({
    role: z.enum(['admin', 'agent'])
  });

  const {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    reset,
    handleSubmit
  } = useFormValidation(formSchema, {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'agent' as 'admin' | 'agent'
  });

  const onSubmit = async (formValues: typeof values) => {
    setError('');

    try {
      const sanitizedFirstName = sanitizeInput(formValues.firstName);
      const sanitizedLastName = sanitizeInput(formValues.lastName);
      const sanitizedEmail = sanitizeInput(formValues.email);
      const sanitizedPassword = sanitizeInput(formValues.password);

      await retry(async () => {
        const result = await signUp(
          sanitizedEmail, 
          sanitizedPassword, 
          sanitizedFirstName, 
          sanitizedLastName, 
          formValues.role
        );
        
        if (result.error) {
          throw new Error(result.error);
        }
      });

      // Reset form and close dialog on success
      reset();
      setOpen(false);
      onUserAdded();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={values.firstName}
                onChange={(e) => setValue('firstName', e.target.value)}
                onBlur={() => setTouched('firstName')}
                placeholder="First name"
              />
              {touched.firstName && errors.firstName && (
                <ErrorMessage message={errors.firstName.message} type="error" />
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={values.lastName}
                onChange={(e) => setValue('lastName', e.target.value)}
                onBlur={() => setTouched('lastName')}
                placeholder="Last name"
              />
              {touched.lastName && errors.lastName && (
                <ErrorMessage message={errors.lastName.message} type="error" />
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={() => setTouched('email')}
              placeholder="Enter email"
            />
            {touched.email && errors.email && (
              <ErrorMessage message={errors.email.message} type="error" />
            )}
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              onBlur={() => setTouched('password')}
              placeholder="Enter password"
              minLength={6}
            />
            {touched.password && errors.password && (
              <ErrorMessage message={errors.password.message} type="error" />
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
              onBlur={() => setTouched('confirmPassword')}
              placeholder="Confirm password"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <ErrorMessage message={errors.confirmPassword.message} type="error" />
            )}
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={values.role} onValueChange={(value: 'admin' | 'agent') => setValue('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                {isRetrying && attemptCount > 1 && (
                  <span className="block mt-1 text-xs">
                    Retrying... (Attempt {attemptCount}/3)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isRetrying || !isValid}
            >
              {isRetrying ? `Retrying... (${attemptCount}/3)` : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
