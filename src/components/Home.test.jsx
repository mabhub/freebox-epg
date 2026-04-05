import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Home from './Home';

describe('home component', () => {
  it('renders the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /Vite \+ React \+ MUI/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the counter button with initial count of 0', () => {
    render(<Home />);
    const counterButton = screen.getByRole('button', { name: /Compteur : 0/i });
    expect(counterButton).toBeInTheDocument();
  });

  it('increments counter when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);

    const counterButton = screen.getByRole('button', { name: /Compteur : 0/i });
    await user.click(counterButton);

    expect(screen.getByRole('button', { name: /Compteur : 1/i })).toBeInTheDocument();
  });

  it('enables reset button when counter is greater than 0', async () => {
    const user = userEvent.setup();
    render(<Home />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    expect(resetButton).toBeDisabled();

    const counterButton = screen.getByRole('button', { name: /Compteur :/i });
    await user.click(counterButton);

    expect(resetButton).toBeEnabled();
  });

  it('resets counter to 0 when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);

    const counterButton = screen.getByRole('button', { name: /Compteur :/i });
    await user.click(counterButton);
    await user.click(counterButton);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    await user.click(resetButton);

    expect(screen.getByRole('button', { name: /Compteur : 0/i })).toBeInTheDocument();
    expect(resetButton).toBeDisabled();
  });

  it('displays technology descriptions', () => {
    render(<Home />);

    expect(screen.getByText(/React 19 avec hooks modernes/i)).toBeInTheDocument();
    expect(screen.getByText(/Material-UI v7 avec thème/i)).toBeInTheDocument();
    expect(screen.getByText(/TanStack Query v5 pour la gestion/i)).toBeInTheDocument();
    expect(screen.getByText(/React Router v7 pour la navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/Vite 8 pour un développement/i)).toBeInTheDocument();
  });
});
