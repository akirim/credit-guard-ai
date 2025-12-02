/**
 * CreditGuard AI - Ana Uygulama Bileşeni
 * Kredi risk analizi dashboard'u
 */

import { useState } from 'react';
import { Shield } from 'lucide-react';
import CreditForm from './components/CreditForm';
import RiskDashboard from './components/RiskDashboard';
import { apiService, CreditApplication, PredictionResponse } from './services/api';

function App() {
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: CreditApplication) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiService.predictRisk(formData);
      setPredictionResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Tahmin yapılırken bir hata oluştu.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-slate-100">CreditGuard AI</h1>
            <span className="ml-auto text-sm text-slate-400">Kredi Risk Analizi Dashboard</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500 rounded-lg text-rose-500">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Panel - Form */}
          <div>
            <CreditForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>

          {/* Sağ Panel - Dashboard */}
          <div>
            <RiskDashboard predictionResult={predictionResult} />
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

