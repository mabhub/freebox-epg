/**
 * Hook for responsive layout constants based on viewport width
 * @module hooks/useLayoutConstants
 */

import { useMediaQuery, useTheme } from '@mui/material';
import { RESPONSIVE_CONSTANTS } from '@/utils/constants';

/**
 * Return layout constants adapted to the current breakpoint
 * @returns {{ sidebarWidth: number, pixelsPerMinute: number, isMobile: boolean, isTablet: boolean }} Responsive constants
 */
const useLayoutConstants = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  if (isMobile) {
    return { ...RESPONSIVE_CONSTANTS.mobile, isMobile: true, isTablet: false };
  }
  if (isTablet) {
    return { ...RESPONSIVE_CONSTANTS.tablet, isMobile: false, isTablet: true };
  }
  return { ...RESPONSIVE_CONSTANTS.desktop, isMobile: false, isTablet: false };
};

export default useLayoutConstants;
