import { render, screen, fireEvent } from '@testing-library/react';

import { useAuth } from '@/hooks/useAuth';
import App from './App';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./components/LoginPage', () => ({ default: () => <div>login page</div> }));
vi.mock('./components/epg/EpgPage', () => ({ default: () => <div>epg page</div> }));

describe('App', () => {
  it('shows the login page when the session is not logged in', () => {
    useAuth.mockReturnValue({ data: { logged_in: false }, isLoading: false });
    render(<App />);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('explains a failed session check instead of asking for a password', () => {
    const refetch = vi.fn();
    useAuth.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('La Freebox ne répond pas (HTTP 502)'),
      refetch,
    });
    render(<App />);

    expect(screen.getByText('La Freebox ne répond pas (HTTP 502)')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(refetch).toHaveBeenCalledWith();
  });
});
