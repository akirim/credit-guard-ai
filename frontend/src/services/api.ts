/**
 * CreditGuard AI - API Service
 * Backend API ile iletişim için servis katmanı
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreditApplication {
  duration: number;
  credit_amount: number;
  age: number;
  housing: string;
  saving_status: string;
  checking_status: string;
  purpose: string;
}

export interface PredictionResponse {
  risk_score: number;
  decision: string;
  risk_level: string;
  risk_probability: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ModelPerformanceResponse {
  metrics: ModelMetrics;
  confusion_matrix: number[][];
  dataset_info: string;
}

export const apiService = {
  /**
   * Model performans metriklerini getirir
   */
  async getModelPerformance(): Promise<ModelPerformanceResponse> {
    const response = await apiClient.get<ModelPerformanceResponse>('/model-performance');
    return response.data;
  },

  /**
   * Kredi risk skoru tahmini yapar
   */
  async predictRisk(application: CreditApplication): Promise<PredictionResponse> {
    const response = await apiClient.post<PredictionResponse>('/predict', application);
    return response.data;
  },
};

