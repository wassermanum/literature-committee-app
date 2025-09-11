import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import GlobalErrorHandler from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    GlobalErrorHandler.handleReactError(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%'
            }}
          >
            <ErrorOutline
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2
              }}
            />
            
            <Typography variant="h5" gutterBottom>
              Произошла ошибка
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              К сожалению, что-то пошло не так. Попробуйте перезагрузить страницу.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left'
                }}
              >
                <Typography variant="caption" component="pre">
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
              sx={{ mt: 3 }}
            >
              Перезагрузить страницу
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;