/**
 * CreditGuard AI - Ana Uygulama Bileşeni
 * Kredi risk analizi dashboard'u
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, TrendingUp, Target, Shield, Activity, Zap } from 'lucide-react';
import Header from './components/Header';
import ToastProvider from './components/ToastProvider';
import CreditForm from './components/CreditForm';
import Tabs, { Tab } from './components/Tabs';
import AnalysisTab from './components/AnalysisTab';
import ModelReliabilityTab from './components/ModelReliabilityTab';
import { DashboardSkeleton } from './components/LoadingSkeleton';
import { apiService, CreditApplication, PredictionResponse } from './services/api';
import AnimatedNumber from './components/AnimatedNumber';

function App() {
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualRiskLabel, setActualRiskLabel] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Form reset için key

  const handleFormReset = () => {
    setPredictionResult(null);
    setActualRiskLabel(null);
    setError(null);
    setFormKey(prev => prev + 1); // Form'u yeniden render et
    toast.success('Form temizlendi. Yeni analiz yapabilirsiniz.');
  };

  const handleFormSubmit = async (formData: CreditApplication) => {
    try {
      setIsLoading(true);
      setError(null);
      setPredictionResult(null); // Önceki sonucu temizle
      
      // Form validasyonu
      if (!formData.duration || !formData.credit_amount || !formData.age) {
        const errorMsg = 'Lütfen tüm alanları doldurun.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }
      
      // Gerçek risk durumunu sakla (eğer varsa)
      if (formData.actual_risk_label) {
        setActualRiskLabel(formData.actual_risk_label);
      }
      
      // API'ye gönderirken actual_risk_label'i çıkar
      const { actual_risk_label, actual_risk, ...apiData } = formData;
      const result = await apiService.predictRisk(apiData);
      setPredictionResult(result);
      toast.success('Risk analizi başarıyla tamamlandı!');
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.detail || 'Tahmin yapılırken bir hata oluştu.';
      setError(errorMessage);
      setPredictionResult(null); // Hata durumunda sonucu temizle
      toast.error(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <ToastProvider />
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 animate-fade-in">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500 rounded-lg text-rose-500 animate-slide-in">
            <p>{error}</p>
          </div>
        )}

        {/* Üst Özet Paneli - Hızlı Erişim */}
        {predictionResult && !isLoading && (
          <div className="mb-6 bg-gradient-to-r from-slate-800/90 via-slate-800/80 to-slate-800/90 rounded-lg p-5 border border-slate-700 shadow-xl animate-slide-in">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-100">Hızlı Özet</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Risk Skoru</span>
                </div>
                <div className={`text-2xl font-bold ${
                  predictionResult.risk_score <= 35 
                    ? 'text-emerald-400' 
                    : predictionResult.risk_score <= 55 
                    ? 'text-amber-400' 
                    : 'text-rose-400'
                }`}>
                  <AnimatedNumber value={predictionResult.risk_score} duration={1000} />/100
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Karar</span>
                </div>
                <div className="text-xl font-bold text-slate-200">
                  {predictionResult.decision}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Olasılık</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  <AnimatedNumber value={predictionResult.risk_probability * 100} duration={1000} decimals={1} suffix="%" />
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Seviye</span>
                </div>
                <div className={`text-xl font-bold ${
                  predictionResult.risk_level === 'Low' 
                    ? 'text-emerald-400' 
                    : predictionResult.risk_level === 'Medium' 
                    ? 'text-amber-400' 
                    : 'text-rose-400'
                }`}>
                  {predictionResult.risk_level === 'Low' ? 'Düşük' : predictionResult.risk_level === 'Medium' ? 'Orta' : 'Yüksek'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sol Panel - Form (40%) */}
          <div className="lg:col-span-2">
            <CreditForm 
              key={formKey}
              onSubmit={handleFormSubmit} 
              isLoading={isLoading}
              onSampleDataLoad={setActualRiskLabel}
              onReset={handleFormReset}
            />
          </div>

          {/* Sağ Panel - Dashboard with Tabs (60%) */}
          <div className="lg:col-span-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 hover:shadow-2xl hover:border-slate-600 transition-all duration-300">
              {isLoading ? (
                <DashboardSkeleton />
              ) : (
                <Tabs
                  tabs={[
                    {
                      id: 'analysis',
                      label: 'Risk Analizi',
                      icon: <BarChart3 className="w-4 h-4" />,
                      content: <AnalysisTab predictionResult={predictionResult} actualRiskLabel={actualRiskLabel} />,
                    },
                    {
                      id: 'model',
                      label: 'Model Güvenilirliği',
                      icon: <TrendingUp className="w-4 h-4" />,
                      content: <ModelReliabilityTab />,
                    },
                  ]}
                  defaultTab="analysis"
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center text-slate-400 text-sm">
          <p>CreditGuard AI - Profesyonel Kredi Risk Analizi Sistemi</p>
          <p className="mt-2">© 2024 - Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

