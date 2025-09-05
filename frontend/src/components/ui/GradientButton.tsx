import React from 'react';
import { Button, ButtonProps, styled } from '@mui/material';

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  gradient?: 'primary' | 'secondary' | 'accent';
}

const StyledGradientButton = styled(Button)<{ gradientType: string }>(
  ({ theme, gradientType }) => ({
    background: theme.colors.gradients[gradientType as keyof typeof theme.colors.gradients],
    color: '#ffffff',
    fontWeight: 600,
    padding: '12px 32px',
    borderRadius: 16,
    textTransform: 'none',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: theme.colors.gradients[gradientType as keyof typeof theme.colors.gradients],
      filter: 'brightness(1.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
      transform: 'translateY(0px)',
    },
    '&:disabled': {
      background: theme.palette.grey[300],
      color: theme.palette.grey[500],
      transform: 'none',
      boxShadow: 'none',
    },
  })
);

export const GradientButton: React.FC<GradientButtonProps> = ({
  gradient = 'primary',
  children,
  ...props
}) => {
  return (
    <StyledGradientButton gradientType={gradient} {...props}>
      {children}
    </StyledGradientButton>
  );
};