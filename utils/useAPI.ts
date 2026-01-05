/**
 * React Hook برای استفاده از API Services
 * مدیریت loading, error, و data state
 */

import { useState, useCallback, useEffect } from 'react';
import type { APIResponse } from './apiClient';

/**
 * State برای API Request
 */
export interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  statusCode?: number;
}

/**
 * Options برای useAPI
 */
export interface UseAPIOptions {
  immediate?: boolean; // اجرای خودکار در mount
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Hook اصلی برای API Requests
 */
export function useAPI<T, P = any>(
  apiFunction: (params: P) => Promise<APIResponse<T>>,
  options?: UseAPIOptions
) {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * اجرای درخواست
   */
  const execute = useCallback(
    async (params: P) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await apiFunction(params);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            statusCode: response.statusCode,
          });

          if (options?.onSuccess) {
            options.onSuccess(response.data);
          }

          return response.data;
        } else {
          const errorMessage = response.error || 'خطای ناشناخته';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
            statusCode: response.statusCode,
          });

          if (options?.onError) {
            options.onError(errorMessage);
          }

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [apiFunction, options]
  );

  /**
   * Reset کردن state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  /**
   * اجرای خودکار در mount (اگر immediate = true)
   */
  useEffect(() => {
    if (options?.immediate) {
      execute({} as P);
    }
  }, [options?.immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook برای آپلود فایل با Progress
 */
export function useUpload<T>(
  uploadFunction: (file: File, onProgress: (progress: number) => void) => Promise<APIResponse<T>>,
  options?: UseAPIOptions
) {
  const [state, setState] = useState<APIState<T> & { progress: number }>({
    data: null,
    loading: false,
    error: null,
    progress: 0,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({
        data: null,
        loading: true,
        error: null,
        progress: 0,
      });

      try {
        const response = await uploadFunction(file, (progress) => {
          setState((prev) => ({
            ...prev,
            progress,
          }));
        });

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            progress: 100,
            statusCode: response.statusCode,
          });

          if (options?.onSuccess) {
            options.onSuccess(response.data);
          }

          return response.data;
        } else {
          const errorMessage = response.error || 'خطا در آپلود';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
            progress: 0,
            statusCode: response.statusCode,
          });

          if (options?.onError) {
            options.onError(errorMessage);
          }

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          progress: 0,
        });

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [uploadFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}

/**
 * Hook برای Polling (بررسی مداوم وضعیت)
 * مفید برای tracking وضعیت پردازش AI
 */
export function usePolling<T>(
  apiFunction: () => Promise<APIResponse<T>>,
  options?: {
    interval?: number; // زمان بین هر بررسی (میلی‌ثانیه)
    maxAttempts?: number; // حداکثر تعداد تلاش
    shouldStop?: (data: T) => boolean; // تابعی که تعیین می‌کند چه زمانی باید متوقف شود
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
) {
  const interval = options?.interval || 2000; // 2 ثانیه
  const maxAttempts = options?.maxAttempts || 30; // حداکثر 30 بار

  const [state, setState] = useState<APIState<T> & { attempts: number }>({
    data: null,
    loading: false,
    error: null,
    attempts: 0,
  });

  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      attempts: 0,
    }));
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setState((prev) => ({
      ...prev,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(async () => {
      setState((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
      }));

      // بررسی حداکثر تلاش
      if (state.attempts >= maxAttempts) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          error: 'زمان انتظار به پایان رسید',
        }));
        if (options?.onError) {
          options.onError('زمان انتظار به پایان رسید');
        }
        return;
      }

      // درخواست به API
      try {
        const response = await apiFunction();

        if (response.success && response.data) {
          setState((prev) => ({
            ...prev,
            data: response.data,
          }));

          // بررسی شرط توقف
          if (options?.shouldStop && options.shouldStop(response.data)) {
            stopPolling();
            if (options?.onSuccess) {
              options.onSuccess(response.data);
            }
          }
        } else {
          // در صورت خطا، متوقف می‌کنیم
          stopPolling();
          setState((prev) => ({
            ...prev,
            error: response.error || 'خطای ناشناخته',
          }));
          if (options?.onError) {
            options.onError(response.error || 'خطای ناشناخته');
          }
        }
      } catch (error) {
        stopPolling();
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        if (options?.onError) {
          options.onError(errorMessage);
        }
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [isPolling, state.attempts, apiFunction, interval, maxAttempts, options, stopPolling]);

  return {
    ...state,
    isPolling,
    startPolling,
    stopPolling,
  };
}

/**
 * Hook برای Mutation (POST, PUT, DELETE)
 * مشابه useAPI ولی برای عملیات‌های تغییر داده
 */
export function useMutation<T, P = any>(
  mutationFunction: (params: P) => Promise<APIResponse<T>>,
  options?: UseAPIOptions & {
    onMutate?: (params: P) => void; // قبل از اجرا
  }
) {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (params: P) => {
      if (options?.onMutate) {
        options.onMutate(params);
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await mutationFunction(params);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            statusCode: response.statusCode,
          });

          if (options?.onSuccess) {
            options.onSuccess(response.data);
          }

          return response.data;
        } else {
          const errorMessage = response.error || 'خطای ناشناخته';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
            statusCode: response.statusCode,
          });

          if (options?.onError) {
            options.onError(errorMessage);
          }

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [mutationFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
