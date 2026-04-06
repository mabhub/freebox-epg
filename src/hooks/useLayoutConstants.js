/**
 * Hook for responsive layout constants based on viewport width
 * @module hooks/useLayoutConstants
 */

import { useMediaQuery, useTheme } from '@mui/material';
import { RESPONSIVE_CONSTANTS } from '@/utils/constants';

const MOBILE = { ...RESPONSIVE_CONSTANTS.mobile, isMobile: true, isTablet: false };
const TABLET = { ...RESPONSIVE_CONSTANTS.tablet, isMobile: false, isTablet: true };
const DESKTOP = { ...RESPONSIVE_CONSTANTS.desktop, isMobile: false, isTablet: false };

/**
 * Return layout constants adapted to the current breakpoint
 * @returns {{ sidebarWidth: number, pixelsPerMinute: number, isMobile: boolean, isTablet: boolean }} Responsive constants
 */
const useLayoutConstants = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  if (isMobile) {
    return MOBILE;
  }
  if (isTablet) {
    return TABLET;
  }
  return DESKTOP;
};

export default useLayoutConstants;
