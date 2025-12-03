/**
 * CreditGuard AI - Kredi Başvuru Formu
 * Sol panelde gösterilen form bileşeni
 * Model feature'larına göre dinamik olarak oluşturulur
 */

import { useState, useEffect } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import { CreditApplication, apiService, ModelFeaturesResponse } from '../services/api';

interface CreditFormProps {
  onSubmit: (data: CreditApplication) => void;
  isLoading?: boolean;
}

const CreditForm: React.FC<CreditFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [modelFeatures, setModelFeatures] = useState<ModelFeaturesResponse | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  // Model feature'larını yükle
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        setLoadingFeatures(true);
        const features = await apiService.getModelFeatures();
        setModelFeatures(features);
        
        // Varsayılan değerleri ayarla
        const defaults: Record<string, any> = {};
        
        // Numeric feature'lar için varsayılan değerler
        features.numeric_features.forEach(feature => {
          if (feature === 'duration') defaults[feature] = 24;
          else if (feature === 'credit_amount') defaults[feature] = 5000;
          else if (feature === 'age') defaults[feature] = 35;
          else if (feature === 'installment_commitment') defaults[feature] = 3;
          else if (feature === 'residence_since') defaults[feature] = 2;
          else if (feature === 'existing_credits') defaults[feature] = 1;
          else if (feature === 'num_dependents') defaults[feature] = 1;
          else defaults[feature] = 0;
        });
        
        // Categorical feature'lar için varsayılan değerler (ilk değer)
        Object.keys(features.categorical_features).forEach(feature => {
          const values = features.categorical_features[feature].values;
          if (values && values.length > 0) {
            defaults[feature] = values[0];
          }
        });
        
        setFormData(defaults);
      } catch (error) {
        console.error('Feature yükleme hatası:', error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    loadFeatures();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CreditApplication);
  };

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      const sampleData = await apiService.getSampleData();
      setFormData(sampleData);
    } catch (error) {
      console.error('Örnek veri yükleme hatası:', error);
      alert('Örnek veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoadingSample(false);
    }
  };

  if (loadingFeatures) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-4 text-slate-300">Model feature'ları yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!modelFeatures) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
        <div className="text-center py-12 text-rose-500">
          <p>Model feature'ları yüklenemedi. Lütfen sayfayı yenileyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-100">Kredi Başvuru Formu</h2>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={loadingSample || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSample ? 'animate-spin' : ''}`} />
          {loadingSample ? 'Yükleniyor...' : 'Hazır Veri Seç'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Numeric Feature'lar - Dinamik */}
          {modelFeatures.numeric_features.map((feature) => {
            const value = formData[feature] || 0;
            // Feature'a göre max, min, step değerleri
            const config: Record<string, { min: number; max: number; step: number; label: string }> = {
              'duration': { min: 1, max: 120, step: 1, label: 'Kredi Süresi (Ay)' },
              'credit_amount': { min: 0, max: 100000, step: 1000, label: 'Kredi Tutarı' },
              'age': { min: 18, max: 100, step: 1, label: 'Yaş' },
              'installment_commitment': { min: 1, max: 4, step: 1, label: 'Taksit Taahhüdü' },
              'residence_since': { min: 1, max: 4, step: 1, label: 'İkamet Süresi' },
              'existing_credits': { min: 1, max: 4, step: 1, label: 'Mevcut Krediler' },
              'num_dependents': { min: 1, max: 2, step: 1, label: 'Bağımlı Sayısı' },
            };
            
            const featureConfig = config[feature] || { min: 0, max: 10, step: 1, label: feature };
            
            return (
              <div key={feature}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {featureConfig.label}: {feature === 'credit_amount' ? value.toLocaleString('tr-TR') + ' ₺' : value}
                </label>
                <input
                  type="range"
                  min={featureConfig.min}
                  max={featureConfig.max}
                  step={featureConfig.step}
                  value={value}
                  onChange={(e) => handleChange(feature, feature === 'credit_amount' ? parseFloat(e.target.value) : parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{featureConfig.min}</span>
                  <span>{featureConfig.max}</span>
                </div>
              </div>
            );
          })}

          {/* Categorical Feature'lar - Dinamik */}
          {Object.keys(modelFeatures.categorical_features).map((feature) => {
            const values = modelFeatures.categorical_features[feature].values;
            const value = formData[feature] || values[0];
            
            // Feature isimlerini Türkçe'ye çevir
            const featureLabels: Record<string, string> = {
              'checking_status': 'Hesap Durumu',
              'credit_history': 'Kredi Geçmişi',
              'purpose': 'Kredi Amacı',
              'savings_status': 'Tasarruf Durumu',
              'employment': 'İstihdam Durumu',
              'personal_status': 'Kişisel Durum',
              'other_parties': 'Diğer Taraflar',
              'property_magnitude': 'Mülkiyet Büyüklüğü',
              'other_payment_plans': 'Diğer Ödeme Planları',
              'housing': 'Konut Durumu',
              'job': 'Meslek',
              'own_telephone': 'Telefon',
              'foreign_worker': 'Yabancı İşçi',
            };
            
            return (
              <div key={feature}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {featureLabels[feature] || feature}
                </label>
                <select
                  value={value}
                  onChange={(e) => handleChange(feature, e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {values.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analiz Yapılıyor...</span>
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              <span>Risk Analizi Yap</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreditForm;

