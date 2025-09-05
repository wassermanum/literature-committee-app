import React, { useEffect, useRef } from 'react';
import { Box, BoxProps, styled } from '@mui/material';

interface SmoothScrollContainerProps extends BoxProps {
  smoothness?: number;
}

const StyledScrollContainer = styled(Box)(() => ({
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(135deg, #2196f3 0%, #795548 100%)',
    borderRadius: 4,
    '&:hover': {
      background: 'linear-gradient(135deg, #1976d2 0%, #5d4037 100%)',
    },
  },
}));

export const SmoothScrollContainer: React.FC<SmoothScrollContainerProps> = ({
  smoothness = 0.1,
  children,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let targetScrollTop = container.scrollTop;

    const smoothScroll = () => {
      if (!isScrolling) return;

      const currentScrollTop = container.scrollTop;
      const distance = targetScrollTop - currentScrollTop;

      if (Math.abs(distance) < 1) {
        container.scrollTop = targetScrollTop;
        isScrolling = false;
        return;
      }

      container.scrollTop += distance * smoothness;
      requestAnimationFrame(smoothScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetScrollTop += e.deltaY;
      targetScrollTop = Math.max(
        0,
        Math.min(targetScrollTop, container.scrollHeight - container.clientHeight)
      );

      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(smoothScroll);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [smoothness]);

  return (
    <StyledScrollContainer ref={containerRef} {...props}>
      {children}
    </StyledScrollContainer>
  );
};