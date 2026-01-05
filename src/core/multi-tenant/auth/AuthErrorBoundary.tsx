import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography, Button, Paper } from '@mui/material';
import React, { Component, ReactNode, ErrorInfo } from 'react';

import { logger } from '@/utils/logger';

/**
 * Authentication Error Boundary
 * Catches and handles authentication-related errors gracefully
 */


interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    logger.error('Authentication Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center'
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2
              }}
            />
            <Typography variant="h4" gutterBottom>
              Authentication Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We encountered an issue with authentication. Please try refreshing the page or logging in again.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  overflowX: 'auto'
                }}
              >
                {this.state.error.toString()}
              </Typography>
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{ mr: 2 }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;