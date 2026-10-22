import { renderHook } from '@testing-library/react';
import { ROW_HEIGHT, OVERSCAN_ROWS } from '@/utils/constants';
import useVirtualChannels from './useVirtualChannels';

const channels = Array.from({ length: 100 }, (_, i) => ({ uuid: `uuid-${i}` }));

describe('useVirtualChannels', () => {
  it('reports the on-screen rows without the overscan', () => {
    const { result } = renderHook(() =>
      useVirtualChannels({ channels, scrollTop: 20 * ROW_HEIGHT, containerHeight: 5 * ROW_HEIGHT }),
    );
    expect(result.current.startIndex).toBe(20 - OVERSCAN_ROWS);
    expect(result.current.onScreenStart).toBe(20);
    expect(result.current.onScreenEnd).toBe(25);
  });

  it('reports no on-screen rows before the container is measured', () => {
    const { result } = renderHook(() => useVirtualChannels({ channels, scrollTop: 0, containerHeight: 0 }));
    expect(result.current.onScreenStart).toBe(0);
    expect(result.current.onScreenEnd).toBe(0);
  });
});
