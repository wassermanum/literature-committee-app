import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Paper,
  LinearProgress
} from '@mui/material';

interface LoadingStateProps {
  variant?: 'circular' | 'linear' | 'skeleton';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  overlay?: boolean;
}

interface SkeletonLoaderProps {
  rows?: number;
  height?: number;
  variant?: 'text' | 'rectangular' | 'circular';
}

// Основной компонент загрузки
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'circular',
  message = 'Загрузка...',
  size = 'medium',
  fullScreen = false,
  overlay = false
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 40;
    }
  };

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      {variant === 'circular' && (
        <CircularProgress size={getSizeValue()} />
      )}
      
      {variant === 'linear' && (
        <Box width="100%" maxWidth={300}>
          <LinearProgress />
        </Box>
      )}
      
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor={overlay ? 'rgba(255, 255, 255, 0.8)' : 'background.default'}
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight={200}
      p={3}
    >
      {content}
    </Box>
  );
};

// Компонент скелетона для списков
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  rows = 3,
  height = 60,
  variant = 'rectangular'
}) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, index) => (
        <Box key={index} mb={2}>
          <Skeleton
            variant={variant}
            height={height}
            animation="wave"
          />
        </Box>
      ))}
    </Box>
  );
};

// Компонент скелетона для карточек
export const CardSkeleton: React.FC = () => {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Skeleton variant="text" height={32} width="60%" />
      <Skeleton variant="text" height={20} width="80%" />
      <Skeleton variant="text" height={20} width="40%" />
      <Box mt={2}>
        <Skeleton variant="rectangular" height={40} width="30%" />
      </Box>
    </Paper>
  );
};

// Компонент скелетона для таблиц
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} display="flex" gap={2} mb={1}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height={40}
              sx={{ flex: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// HOC для обертки компонентов с состоянием загрузки
interface WithLoadingProps {
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const WithLoading: React.FC<WithLoadingProps> = ({
  loading = false,
  error = null,
  children,
  loadingComponent,
  errorComponent
}) => {
  if (loading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <LoadingState />
    );
  }

  if (error) {
    return errorComponent ? (
      <>{errorComponent}</>
    ) : (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={200}
        p={3}
      >
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default LoadingState;