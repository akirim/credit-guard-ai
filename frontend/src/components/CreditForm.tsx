/**
 * CreditGuard AI - Kredi Başvuru Formu
 * Sol panelde gösterilen form bileşeni
 * Model feature'larına göre dinamik olarak oluşturulur
 * Türkçe çeviri ve gelişmiş UI ile
 */

import { useState, useEffect } from 'react';
import { 
  Calculator, 
  RefreshCw, 
  User, 
  DollarSign, 
  Calendar, 
  Home, 
  Target, 
  Briefcase, 
  MapPin, 
  CreditCard,
  Users,
  HelpCircle,
  Building2,
  Phone,
  Globe
} from 'lucide-react';
import { CreditApplication, apiService, ModelFeaturesResponse } from '../services/api';
import { 
  translateValue, 
  featureLabels, 
  featureDescriptions 
} from '../utils/translations';

interface CreditFormProps {
  onSubmit: (data: CreditApplication) => void;
  isLoading?: boolean;
}

// Feature ikonları
const featureIcons: Record<string, React.ReactNode> = {
  age: <User className="w-4 h-4" />,
  credit_amount: <DollarSign className="w-4 h-4" />,
  duration: <Calendar className="w-4 h-4" />,
  housing: <Home className="w-4 h-4" />,
  purpose: <Target className="w-4 h-4" />,
  employment: <Briefcase className="w-4 h-4" />,
  residence_since: <MapPin className="w-4 h-4" />,
  existing_credits: <CreditCard className="w-4 h-4" />,
  num_dependents: <Users className="w-4 h-4" />,
  job: <Briefcase className="w-4 h-4" />,
  own_telephone: <Phone className="w-4 h-4" />,
  foreign_worker: <Globe className="w-4 h-4" />,
};

// Form gruplama
const formGroups = {
  personal: {
    title: 'Kişisel Bilgiler',
    features: ['age', 'personal_status', 'job', 'num_dependents'],
  },
  financial: {
    title: 'Finansal Durum',
    features: ['credit_amount', 'checking_status', 'savings_status', 'housing', 'property_magnitude'],
  },
  credit: {
    title: 'Kredi Bilgileri',
    features: ['duration', 'purpose', 'installment_commitment', 'credit_history', 'existing_credits'],
  },
  additional: {
    title: 'Ek Bilgiler',
    features: ['employment', 'residence_since', 'other_parties', 'other_payment_plans', 'own_telephone', 'foreign_worker'],
  },
};

const CreditForm: React.FC<CreditFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [modelFeatures, setModelFeatures] = useState<ModelFeaturesResponse | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [tooltipField, setTooltipField] = useState<string | null>(null);

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
    // API'ye gönderirken orijinal değerleri kullan (zaten formData'da orijinal değerler var)
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

  // Feature'ları gruplara göre filtrele
  const getFeaturesInGroup = (groupFeatures: string[]) => {
    if (!modelFeatures) return { numeric: [], categorical: [] };
    
    const numeric = modelFeatures.numeric_features.filter(f => groupFeatures.includes(f));
    const categorical = Object.keys(modelFeatures.categorical_features).filter(f => groupFeatures.includes(f));
    
    return { numeric, categorical };
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
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-emerald-500/50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSample ? 'animate-spin' : ''}`} />
          {loadingSample ? 'Yükleniyor...' : 'Hazır Veri Seç'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Form Grupları */}
        {Object.entries(formGroups).map(([groupKey, group]) => {
          const { numeric, categorical } = getFeaturesInGroup(group.features);
          const hasFeatures = numeric.length > 0 || categorical.length > 0;
          
          if (!hasFeatures) return null;

          return (
            <div key={groupKey} className="space-y-4">
              {/* Grup Başlığı */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-emerald-400">{group.title}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numeric Feature'lar */}
                {numeric.map((feature) => {
                  const value = formData[feature] || 0;
                  const config: Record<string, { min: number; max: number; step: number }> = {
                    'duration': { min: 1, max: 120, step: 1 },
                    'credit_amount': { min: 0, max: 20000, step: 500 },
                    'age': { min: 18, max: 100, step: 1 },
                    'installment_commitment': { min: 1, max: 4, step: 1 },
                    'residence_since': { min: 1, max: 4, step: 1 },
                    'existing_credits': { min: 1, max: 4, step: 1 },
                    'num_dependents': { min: 1, max: 2, step: 1 },
                  };
                  
                  const featureConfig = config[feature] || { min: 0, max: 10, step: 1 };
                  const label = featureLabels[feature] || feature;
                  const description = featureDescriptions[feature] || '';
                  const icon = featureIcons[feature] || null;
                  
                  return (
                    <div key={feature} className="space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <label 
                          className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer"
                          onMouseEnter={() => setTooltipField(feature)}
                          onMouseLeave={() => setTooltipField(null)}
                        >
                          {icon}
                          <span>{label}</span>
                          {description && (
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors" />
                          )}
                        </label>
                      </div>
                      {tooltipField === feature && description && (
                        <div className="absolute z-10 top-8 left-0 px-3 py-2 text-xs bg-slate-900 text-slate-200 rounded-lg shadow-lg border border-slate-700 max-w-xs">
                          {description}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={featureConfig.min}
                          max={featureConfig.max}
                          step={featureConfig.step}
                          value={value}
                          onChange={(e) => handleChange(feature, feature === 'credit_amount' ? parseFloat(e.target.value) : parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-colors"
                        />
                        <span className="text-sm font-semibold text-emerald-400 min-w-[80px] text-right">
                          {feature === 'credit_amount' 
                            ? `${value.toLocaleString('tr-TR')} ₺` 
                            : feature === 'duration'
                            ? `${value} ay`
                            : value}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{featureConfig.min}</span>
                        <span>{featureConfig.max}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Categorical Feature'lar */}
                {categorical.map((feature) => {
                  const values = modelFeatures.categorical_features[feature].values;
                  const value = formData[feature] || values[0];
                  const label = featureLabels[feature] || feature;
                  const description = featureDescriptions[feature] || '';
                  const icon = featureIcons[feature] || null;
                  
                  return (
                    <div key={feature} className="space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <label 
                          className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer"
                          onMouseEnter={() => setTooltipField(feature)}
                          onMouseLeave={() => setTooltipField(null)}
                        >
                          {icon}
                          <span>{label}</span>
                          {description && (
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors" />
                          )}
                        </label>
                      </div>
                      {tooltipField === feature && description && (
                        <div className="absolute z-10 top-8 left-0 px-3 py-2 text-xs bg-slate-900 text-slate-200 rounded-lg shadow-lg border border-slate-700 max-w-xs">
                          {description}
                        </div>
                      )}
                      <select
                        value={value}
                        onChange={(e) => handleChange(feature, e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-slate-500"
                      >
                        {values.map((val) => (
                          <option key={val} value={val}>
                            {translateValue(feature, val)}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/50 transform hover:scale-[1.02] disabled:transform-none"
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
        </div>
      </form>
    </div>
  );
};

export default CreditForm;
