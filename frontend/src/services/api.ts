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
  timeout: 30000, // 30 saniye timeout (model eğitimi uzun sürebilir)
});

// Request interceptor - hata yönetimi için
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }
    if (error.response) {
      // Backend'den gelen hata mesajı
      throw new Error(error.response.data?.detail || error.response.data?.message || 'Bir hata oluştu');
    }
    if (error.request) {
      // İstek gönderildi ama yanıt alınamadı
      throw new Error('Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.');
    }
    throw error;
  }
);

export interface CreditApplication {
  // Numeric features
  duration: number;
  credit_amount: number;
  installment_commitment?: number;
  residence_since?: number;
  age: number;
  existing_credits?: number;
  num_dependents?: number;
  // Categorical features
  checking_status: string;
  credit_history?: string;
  purpose: string;
  savings_status: string;
  employment?: string;
  personal_status?: string;
  other_parties?: string;
  property_magnitude?: string;
  other_payment_plans?: string;
  housing: string;
  job?: string;
  own_telephone?: string;
  foreign_worker?: string;
  // Sample data metadata (optional)
  actual_risk?: string;
  actual_risk_label?: string;
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

export interface ModelFeaturesResponse {
  numeric_features: string[];
  categorical_features: {
    [key: string]: {
      type: string;
      values: string[];
    };
  };
  all_features: string[];
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

  /**
   * Model feature'larını getirir
   */
  async getModelFeatures(): Promise<ModelFeaturesResponse> {
    const response = await apiClient.get<ModelFeaturesResponse>('/model-features');
    return response.data;
  },

  /**
   * Veri setinden rastgele bir örnek getirir (formu otomatik doldurmak için)
   */
  async getSampleData(includeTarget: boolean = false): Promise<CreditApplication> {
    const response = await apiClient.get<CreditApplication>('/sample-data', {
      params: { include_target: includeTarget }
    });
    return response.data;
  },
};

