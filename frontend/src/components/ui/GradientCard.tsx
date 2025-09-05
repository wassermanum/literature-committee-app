import React from 'react';
import { Card, CardProps, styled, alpha } from '@mui/material';

interface GradientCardProps extends CardProps {
  gradient?: boolean;
  hover?: boolean;
}

const StyledGradientCard = styled(Card)<{ gradientEnabled: boolean; hoverEnabled: boolean }>(
  ({ theme, gradientEnabled, hoverEnabled }) => ({
    borderRadius: 20,
    padding: theme.spacing(3),
    background: gradientEnabled
      ? `linear-gradient(135deg, ${alpha(theme.colors.primary[50], 0.8)} 0%, ${alpha(
          theme.colors.brown[50],
          0.8
        )} 100%)`
      : theme.palette.background.paper,
    border: `1px solid ${alpha(theme.colors.neutral[200], 0.5)}`,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': gradientEnabled
      ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(
            theme.colors.primary[100],
            0.1
          )} 0%, ${alpha(theme.colors.brown[100], 0.1)} 100%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 0,
        }
      : {},
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
    ...(hoverEnabled && {
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.12)',
        '&::before': {
          opacity: 1,
        },
      },
    }),
  })
);

export const GradientCard: React.FC<GradientCardProps> = ({
  gradient = false,
  hover = true,
  children,
  ...props
}) => {
  return (
    <StyledGradientCard gradientEnabled={gradient} hoverEnabled={hover} {...props}>
      {children}
    </StyledGradientCard>
  );
};