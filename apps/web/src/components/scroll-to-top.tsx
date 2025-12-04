import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

/**
 * Component that scrolls to top of page on route changes
 * This ensures users always start at the top when navigating to a new route
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll to top when route changes
    // Use setTimeout to ensure DOM is ready after route change
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
      });
    };

    // Scroll immediately
    scrollToTop();

    // Also scroll after a tiny delay to handle async route updates
    const timeoutId = setTimeout(scrollToTop, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
