
import { validateSingleLead } from '../../utils/leadValidator';

describe('Lead Validator', () => {
  test('validates required fields', () => {
    const invalidLead = {
      first_name: '',
      last_name: 'Doe',
      email: 'invalid-email',
      country: ''
    };

    const errors = validateSingleLead(invalidLead, 1);
    
    expect(errors).toHaveLength(3);
    expect(errors.find(e => e.field === 'first_name')).toBeDefined();
    expect(errors.find(e => e.field === 'email')).toBeDefined();
    expect(errors.find(e => e.field === 'country')).toBeDefined();
  });

  test('passes validation for valid lead', () => {
    const validLead = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      country: 'US',
      phone: '+1234567890',
      balance: '1000',
      status: 'new'
    };

    const errors = validateSingleLead(validLead, 1);
    expect(errors).toHaveLength(0);
  });
});
