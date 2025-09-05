import React from 'react';
import { Box, CircularProgress, styled, keyframes } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  overlay?: boolean;
  message?: string;
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const StyledSpinnerContainer = styled(Box)<{ isOverlay: boolean }>(({ theme, isOverlay }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  ...(isOverlay && {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
  }),
}));

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  animation: `${pulseAnimation} 2s ease-in-out infinite`,
  '& .MuiCircularProgress-circle': {
    stroke: `url(#gradient)`,
  },
}));

const StyledMessage = styled(Box)(({ theme }) => ({
  color: theme.colors.neutral[600],
  fontSize: '0.875rem',
  fontWeight: 500,
  textAlign: 'center',
}));

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  overlay = false,
  message,
}) => {
  return (
    <StyledSpinnerContainer isOverlay={overlay}>
      <Box position="relative">
        <svg width={0} height={0}>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2196f3" />
              <stop offset="100%" stopColor="#795548" />
            </linearGradient>
          </defs>
        </svg>
        <StyledCircularProgress size={size} thickness={4} />
      </Box>
      {message && <StyledMessage>{message}</StyledMessage>}
    </StyledSpinnerContainer>
  );
};