import { store } from '@/lib/redux/store';
import { setError } from '@/lib/redux/slices/errors';
import { AuthenticationError } from '@/lib/api/auth-interceptor';
import { APIError } from '@/lib/api/utils';

export type ErrorCategory = 'auth' | 'api' | 'validation' | 'system';

export interface ManagedError {
  category: ErrorCategory;
  message: string;
  code?: string;
  provider?: 'google' | 'microsoft';
  recoverable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export class ErrorManager {
  static handle(error: unknown, _context?: { stepId?: string; stepTitle?: string }): ManagedError {
    if (error instanceof AuthenticationError) {
      return {
        category: 'auth',
        message: error.message,
        code: 'AUTH_EXPIRED',
        provider: error.provider,
        recoverable: true,
        action: {
          label: 'Sign In',
          handler: () => {
            window.location.href = '/login';
          },
        },
      };
    }

    if (error instanceof APIError) {
      const isApiEnablement = error.code === 'API_NOT_ENABLED';
      return {
        category: 'api',
        message: error.message,
        code: error.code,
        recoverable: isApiEnablement,
        action: isApiEnablement
          ? {
              label: 'Enable API',
              handler: () => {
                const match = error.message.match(/https:\/\/[^\s]+/);
                if (match) window.open(match[0], '_blank');
              },
            }
          : undefined,
      };
    }

    return {
      category: 'system',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      recoverable: false,
    };
  }

  static dispatch(
    error: unknown,
    context?: { stepId?: string; stepTitle?: string },
  ): void {
    const managed = this.handle(error, context);
    store.dispatch(
      setError({
        message: managed.message,
        details: {
          ...context,
          category: managed.category,
          code: managed.code,
          provider: managed.provider,
          recoverable: managed.recoverable,
          action: managed.action, // Make sure action is included here
        },
      }),
    );
  }
}
