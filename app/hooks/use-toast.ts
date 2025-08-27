"use client"

// Detta är en modifierad version av toast från shadcn/ui
// Förenklad för att passa projektet utan Radix UI

// Skapa enklare versioner som i stort sett bara loggar i konsolen
import { useState, useEffect } from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export type ToastActionElement = React.ReactElement;

export const TOAST_REMOVE_DELAY = 5000;

export type ToasterToast = ToastProps & {
  id: string;
  dismiss: () => void;
};

type ToastState = {
  toasts: ToasterToast[];
};

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  // Generera ett unikt ID för varje toast
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Lägg till en toast
  const toast = ({ ...props }: ToastProps) => {
    const id = generateUniqueId();
    const newToast: ToasterToast = {
      ...props,
      id,
      dismiss: () => dismissToast(id),
    };

    console.log(`Toast created: ${newToast.id}`, newToast);

    setState(prev => ({
      toasts: [...prev.toasts, newToast],
    }));

    return newToast.id;
  };

  // Ta bort en toast genom ID
  const dismissToast = (id: string) => {
    console.log(`Dismissing toast: ${id}`);
    setState(prev => ({
      toasts: prev.toasts.filter(t => t.id !== id),
    }));
  };

  // Rensa alla toasts
  const clearToasts = () => {
    setState({ toasts: [] });
  };

  // Automatiskt ta bort toasts efter en viss tid
  useEffect(() => {
    const timer = setTimeout(() => {
      state.toasts.forEach(toast => {
        dismissToast(toast.id);
      });
    }, TOAST_REMOVE_DELAY);

    return () => clearTimeout(timer);
  }, [state.toasts]);

  // Återvänd toast-funktionalitet och state
  return {
    toast,
    dismiss: dismissToast,
    clear: clearToasts,
    toasts: state.toasts,
  };
};

// Enklare API som kan användas direkt utan hook
// Detta möjliggör användning av toast utan att använda hook i varje komponent
const toastFunctions = {
  success: (message: string) => {
    console.log('🟢 Success:', message);
  },
  error: (message: string) => {
    console.error('🔴 Error:', message);
  },
  warning: (message: string) => {
    console.warn('🟠 Warning:', message);
  },
  info: (message: string) => {
    console.info('🔵 Info:', message);
  },
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    console.log('⏳ Loading:', messages.loading);
    try {
      const data = await promise;
      console.log('🟢 Success:', messages.success);
      return data;
    } catch (error) {
      console.error('🔴 Error:', messages.error, error);
      throw error;
    }
  },
};

export const toast = toastFunctions; 