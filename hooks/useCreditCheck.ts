"use client";

import { useState, useCallback } from 'react';

interface CreditCheckResult {
  status: 'approved' | 'rejected';
  checkId: string;
  rejectCode?: string;
  rejectReason?: string;
  depositAmount?: number;
  alternativePaymentOptions?: Array<{
    type: 'direct_payment' | 'swish' | 'contact';
    amount?: number;
    description: string;
  }>;
}

interface CreditCheckState {
  status: 'idle' | 'authenticating' | 'checking' | 'complete' | 'error';
  result: CreditCheckResult | null;
  error: string | null;
}

export function useCreditCheck() {
  const [state, setState] = useState<CreditCheckState>({
    status: 'idle',
    result: null,
    error: null,
  });
  const [personalNumber, setPersonalNumber] = useState<string>('');

  const startCreditCheck = useCallback((pn: string) => {
    setPersonalNumber(pn);
    setState({
      status: 'authenticating',
      result: null,
      error: null,
    });
  }, []);

  const handleAuthSuccess = useCallback((authData: any) => {
    setState({
      status: 'checking',
      result: null,
      error: null,
    });

    // Simulate credit check
    setTimeout(() => {
      // Mock credit check result - 70% approval rate
      const isApproved = Math.random() > 0.3;
      
      if (isApproved) {
        setState({
          status: 'complete',
          result: {
            status: 'approved',
            checkId: `CHK-${Date.now()}`,
          },
          error: null,
        });
      } else {
        setState({
          status: 'complete',
          result: {
            status: 'rejected',
            checkId: `CHK-${Date.now()}`,
            rejectCode: 'LOW_CREDIT_SCORE',
            rejectReason: 'low_credit_score',
            alternativePaymentOptions: [
              {
                type: 'swish',
                amount: 0, // Will be filled with actual amount
                description: 'Betala hela beloppet i förväg med Swish',
              },
            ],
          },
          error: null,
        });
      }
    }, 2000);
  }, []);

  const handleAuthError = useCallback((error: string) => {
    setState({
      status: 'error',
      result: null,
      error,
    });
  }, []);

  const handleAuthCancel = useCallback(() => {
    setState({
      status: 'idle',
      result: null,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      result: null,
      error: null,
    });
    setPersonalNumber('');
  }, []);

  return {
    state,
    personalNumber,
    startCreditCheck,
    handleAuthSuccess,
    handleAuthError,
    handleAuthCancel,
    reset,
  };
}