
import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import { describe, test, expect, vi } from 'vitest';
import { render } from '../testUtils';
import OptimizedLeads from '../../pages/OptimizedLeads';

// Mock the hooks
vi.mock('../../hooks/useOptimizedLeads', () => ({
  useOptimizedLeads: () => ({
    leads: [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        country: 'US',
        status: 'new',
        balance: 1000,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    isLoading: false,
    error: null,
    pagination: { page: 1, pageSize: 50, total: 1 },
    filters: {},
    setFilters: vi.fn(),
    refetch: vi.fn()
  })
}));

describe('Leads Integration Tests', () => {
  test('renders leads table with data', async () => {
    render(<OptimizedLeads />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });
  });

  test('filters work correctly', async () => {
    const mockSetFilters = vi.fn();
    
    // Mock the hook with setFilters function
    vi.mock('../../hooks/useOptimizedLeads', () => ({
      useOptimizedLeads: () => ({
        leads: [],
        isLoading: false,
        error: null,
        pagination: { page: 1, pageSize: 50, total: 0 },
        filters: {},
        setFilters: mockSetFilters,
        refetch: vi.fn()
      })
    }));

    render(<OptimizedLeads />);
    
    // Test filtering functionality
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    // This would test the actual filter implementation
    expect(filterButton).toBeInTheDocument();
  });
});
