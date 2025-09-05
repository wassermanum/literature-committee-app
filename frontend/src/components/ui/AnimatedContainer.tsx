import React from 'react';
import { Box, BoxProps, styled } from '@mui/material';

interface AnimatedContainerProps extends BoxProps {
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  delay?: number;
  duration?: number;
}

const StyledAnimatedContainer = styled(Box)<{
  animationType: string;
  animationDelay: number;
  animationDuration: number;
}>(({ animationType, animationDelay, animationDuration }) => ({
  animation: `${animationType} ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1) ${animationDelay}ms both`,
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
  '@keyframes slideUp': {
    from: {
      opacity: 0,
      transform: 'translateY(30px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  '@keyframes slideDown': {
    from: {
      opacity: 0,
      transform: 'translateY(-30px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  '@keyframes slideLeft': {
    from: {
      opacity: 0,
      transform: 'translateX(30px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  '@keyframes slideRight': {
    from: {
      opacity: 0,
      transform: 'translateX(-30px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
}));

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  animation = 'fadeIn',
  delay = 0,
  duration = 600,
  children,
  ...props
}) => {
  return (
    <StyledAnimatedContainer
      animationType={animation}
      animationDelay={delay}
      animationDuration={duration}
      {...props}
    >
      {children}
    </StyledAnimatedContainer>
  );
};