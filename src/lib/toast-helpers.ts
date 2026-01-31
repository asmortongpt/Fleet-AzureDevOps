import toast from 'svelte-sonner';

export const toastHelpers = {
  info: (message: string, options?: { description?: string; duration?: number }) => {
    toast(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  success: (message: string, options?: { description?: string; duration?: number }) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  error: (message: string, options?: { description?: string; duration?: number }) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    });
  },

  warning: (message: string, options?: { description?: string; duration?: number }) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

export default toastHelpers;