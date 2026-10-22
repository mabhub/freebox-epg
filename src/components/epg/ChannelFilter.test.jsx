import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import channelsReducer from '@/store/channelsSlice';
import ChannelFilter from './ChannelFilter';

vi.mock('@/hooks/useFreeboxImage', () => ({ default: () => ({ src: null, failed: false }) }));

const CHANNELS = [
  { uuid: 'tf1', number: 1, name: 'TF1', hasAbo: false },
  { uuid: 'canal', number: 40, name: 'CANAL+', hasAbo: true },
  { uuid: 'disney', number: 337, name: 'Disney Channel', hasAbo: true },
  { uuid: 'f3-alpes', number: 902, name: 'France 3 Alpes', hasAbo: false },
];

const renderFilter = (hiddenChannels = []) => {
  const store = configureStore({
    reducer: { channels: channelsReducer },
    preloadedState: { channels: { hiddenChannels } },
  });
  render(
    <Provider store={store}>
      <ChannelFilter open onClose={() => {}} channels={CHANNELS} />
    </Provider>,
  );
  return store;
};

const hidden = (store) => store.getState().channels.hiddenChannels;

describe('group chips in ChannelFilter', () => {
  it('shows a chip per non-empty group, with its channel count', () => {
    renderFilter();

    expect(screen.getByRole('button', { name: 'Abonnement (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'France 3 régionales (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /International/ })).not.toBeInTheDocument();
  });

  it('hides the subscription channels, then shows them again, leaving other choices alone', () => {
    const store = renderFilter(['tf1']);
    const chip = screen.getByRole('button', { name: 'Abonnement (2)' });

    fireEvent.click(chip);
    expect(hidden(store)).toStrictEqual(['tf1', 'canal', 'disney']);
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(chip);
    expect(hidden(store)).toStrictEqual(['tf1']);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
});
