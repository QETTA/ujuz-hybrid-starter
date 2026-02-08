/**
 * UJUz - useAdmissionScore Hook
 * 입소 점수 예측 훅
 */

import { useCallback } from 'react';
import { useAdmissionStore } from '../stores/admissionStore';
import { api } from '../services/api/client';
import type {
  AdmissionScoreInput,
  AdmissionScoreResult,
  AdmissionHistory,
} from '../types/admission';

export function useAdmissionScore() {
  const {
    lastResult,
    history,
    isCalculating,
    error,
    setLastResult,
    addToHistory,
    setHistory,
    setCalculating,
    setError,
  } = useAdmissionStore();

  const calculateScore = useCallback(
    async (input: AdmissionScoreInput) => {
      setCalculating(true);
      setError(null);

      try {
        const result = await api.post<AdmissionScoreResult>('/api/ujuz/admission/calculate', input);
        setLastResult(result);
        addToHistory(result);
        return { result, error: null };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : '분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
        setError(message);
        return { result: null, error: message };
      } finally {
        setCalculating(false);
      }
    },
    [setCalculating, setError, setLastResult, addToHistory]
  );

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.get<AdmissionHistory>('/api/ujuz/admission/history');
      setHistory(data.results);
    } catch {
      // Silent fail for history fetch
    }
  }, [setHistory]);

  return {
    lastResult,
    history,
    isCalculating,
    error,
    calculateScore,
    fetchHistory,
  };
}
