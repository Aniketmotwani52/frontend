import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceDialog } from './ServiceDialog';

// Mock the AuthContext hook
vi.mock('../../../app/providers/AuthContext', () => ({
  useAuth: () => ({
    user: { orgId: 1, name: 'Test User' },
  }),
}));

// Mock React Query's useQuery hook
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [
      { categoryId: 1, name: 'Hair' },
      { categoryId: 2, name: 'Nails' }
    ],
    isLoading: false
  }),
}));

// Mock the API calls
vi.mock('../../../shared/api/service.api', () => ({
  serviceApi: {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  },
  serviceCategoryApi: {
    getActiveByOrg: vi.fn().mockResolvedValue([]),
  }
}));

describe('ServiceDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for creating a new service', () => {
    render(
      <ServiceDialog 
        open={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByText('Add New Service')).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Price/i)).toBeInTheDocument();
  });

  it('validates price correctly and prevents submission if invalid', async () => {
    render(
      <ServiceDialog 
        open={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    // Fill in valid name
    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: 'Haircut' } });
    
    // Fill in invalid price (negative)
    fireEvent.change(screen.getByLabelText(/Default Price/i), { target: { value: '-50' } });
    fireEvent.change(screen.getByLabelText(/Estimated Duration/i), { target: { value: '30' } });

    // Submit the form directly
    fireEvent.submit(screen.getByRole('button', { name: /Create Service/i }).closest('form')!);

    // Should show error alert
    expect(await screen.findByText('Price must be a valid number greater than 0')).toBeInTheDocument();
    
    // API should not have been called
    const { serviceApi } = await import('../../../shared/api/service.api');
    expect(serviceApi.create).not.toHaveBeenCalled();
  });
});
