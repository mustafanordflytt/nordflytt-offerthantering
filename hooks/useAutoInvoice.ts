// =============================================================================
// AUTO-INVOICE HOOK
// Manages auto-invoice state and operations
// =============================================================================

import { useState, useCallback } from 'react';
import { getFortnoxIntegration, JobCompletionData, CRMJobData } from '@/lib/fortnox-integration';

interface AutoInvoiceState {
  isProcessing: boolean;
  lastProcessedJob: string | null;
  error: string | null;
  stats: {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
  };
}

export function useAutoInvoice() {
  const [state, setState] = useState<AutoInvoiceState>({
    isProcessing: false,
    lastProcessedJob: null,
    error: null,
    stats: {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0
    }
  });

  // Process job completion and create auto-invoice
  const processJobCompletion = useCallback(async (
    jobData: CRMJobData,
    completionData: JobCompletionData
  ) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const fortnox = getFortnoxIntegration();
      const result = await fortnox.createCompleteInvoice(jobData, completionData);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          lastProcessedJob: jobData.id,
          stats: {
            ...prev.stats,
            totalProcessed: prev.stats.totalProcessed + 1,
            successCount: prev.stats.successCount + 1
          }
        }));
        
        return {
          success: true,
          invoiceNumber: result.invoiceNumber
        };
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'Unknown error',
          stats: {
            ...prev.stats,
            totalProcessed: prev.stats.totalProcessed + 1,
            failureCount: prev.stats.failureCount + 1
          }
        }));
        
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        stats: {
          ...prev.stats,
          totalProcessed: prev.stats.totalProcessed + 1,
          failureCount: prev.stats.failureCount + 1
        }
      }));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // Retry failed invoice
  const retryFailedInvoice = useCallback(async (
    jobId: string,
    jobData: CRMJobData,
    completionData: JobCompletionData
  ) => {
    console.log(`Retrying invoice for job ${jobId}`);
    return processJobCompletion(jobData, completionData);
  }, [processJobCompletion]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset stats
  const resetStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      stats: {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0
      }
    }));
  }, []);

  return {
    ...state,
    processJobCompletion,
    retryFailedInvoice,
    clearError,
    resetStats
  };
}