import { fireEvent, render, screen } from '@testing-library/react';

import NoticeSnackbar from './NoticeSnackbar';

describe('NoticeSnackbar', () => {
  it('shows nothing without a notice', () => {
    render(<NoticeSnackbar notice={null} onClose={() => {}} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the message of the notice', () => {
    render(<NoticeSnackbar notice={{ message: 'Enregistrement modifié : 21:05 – 22:55' }} onClose={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enregistrement modifié : 21:05 – 22:55');
  });

  it('runs the undo then closes when Annuler is clicked', () => {
    const undo = vi.fn();
    const onClose = vi.fn();
    render(<NoticeSnackbar notice={{ message: 'Enregistrement modifié', undo }} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(undo).toHaveBeenCalledExactlyOnceWith();
    expect(onClose).toHaveBeenCalledExactlyOnceWith();
  });

  it('offers no Annuler button on an error', () => {
    render(<NoticeSnackbar notice={{ message: 'Modification refusée', severity: 'error' }} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
  });
});
