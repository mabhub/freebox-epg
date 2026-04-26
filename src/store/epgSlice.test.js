import epgReducer, {
  setScroll,
  setTimeOrigin,
  centerOnTimeOrigin,
  selectProgram,
  clearSelection,
} from './epgSlice';
import { PAST_HOURS, pastOffsetPx } from '@/utils/constants';

const initial = () => epgReducer(undefined, { type: '@@INIT' });

describe('epgSlice', () => {
  describe('setScroll', () => {
    it('updates scrollLeft and scrollTop independently', () => {
      const s1 = epgReducer(initial(), setScroll({ scrollLeft: 500 }));
      expect(s1.scrollLeft).toBe(500);
      expect(s1.scrollTop).toBe(0);

      const s2 = epgReducer(s1, setScroll({ scrollTop: 200 }));
      expect(s2.scrollLeft).toBe(500);
      expect(s2.scrollTop).toBe(200);
    });
  });

  describe('setTimeOrigin', () => {
    it('shifts the time origin to PAST_HOURS before the target', () => {
      const target = 1_700_000_000;
      const next = epgReducer(initial(), setTimeOrigin(target));
      expect(next.timeOrigin).toBe(target - PAST_HOURS * 3600);
    });

    it('does not touch scrollLeft (centerOnTimeOrigin is responsible)', () => {
      const seeded = epgReducer(initial(), setScroll({ scrollLeft: 999 }));
      const next = epgReducer(seeded, setTimeOrigin(1_700_000_000));
      expect(next.scrollLeft).toBe(999);
    });
  });

  describe('centerOnTimeOrigin', () => {
    it('places the time origin at ~1/3 of the desktop viewport', () => {
      const next = epgReducer(
        initial(),
        centerOnTimeOrigin({ viewportWidth: 1200, pixelsPerMinute: 4 }),
      );
      // pastOffsetPx(4) = 1440; 1440 - 1200/3 = 1040
      expect(next.scrollLeft).toBe(pastOffsetPx(4) - 1200 / 3);
      expect(next.scrollLeft).toBe(1040);
    });

    it('uses the runtime pixelsPerMinute (mobile vs desktop)', () => {
      const desktop = epgReducer(
        initial(),
        centerOnTimeOrigin({ viewportWidth: 1200, pixelsPerMinute: 4 }),
      );
      const mobile = epgReducer(
        initial(),
        centerOnTimeOrigin({ viewportWidth: 360, pixelsPerMinute: 2 }),
      );
      // Both layouts should leave PAST_HOURS - 1/3 viewport in the past
      // buffer; their scroll positions differ because pixelsPerMinute does.
      expect(desktop.scrollLeft).toBe(pastOffsetPx(4) - 1200 / 3);
      expect(mobile.scrollLeft).toBe(pastOffsetPx(2) - 360 / 3);
      expect(desktop.scrollLeft).not.toBe(mobile.scrollLeft);
    });

    it('clamps negative results to 0 when the viewport dwarfs the past buffer', () => {
      const next = epgReducer(
        initial(),
        centerOnTimeOrigin({ viewportWidth: 99_999, pixelsPerMinute: 4 }),
      );
      expect(next.scrollLeft).toBe(0);
    });

    it('returns 0 while the container is still being measured', () => {
      const next = epgReducer(
        initial(),
        centerOnTimeOrigin({ viewportWidth: 0, pixelsPerMinute: 4 }),
      );
      expect(next.scrollLeft).toBe(pastOffsetPx(4));
    });
  });

  describe('program selection', () => {
    it('selectProgram stores both ids; clearSelection wipes them', () => {
      const selected = epgReducer(
        initial(),
        selectProgram({ programId: 'pluri_1', channelUuid: 'uuid-201' }),
      );
      expect(selected.selectedProgramId).toBe('pluri_1');
      expect(selected.selectedChannelUuid).toBe('uuid-201');

      const cleared = epgReducer(selected, clearSelection());
      expect(cleared.selectedProgramId).toBeNull();
      expect(cleared.selectedChannelUuid).toBeNull();
    });
  });
});
