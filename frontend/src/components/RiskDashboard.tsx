/**
 * CreditGuard AI - Risk Dashboard
 * Sağ panelde gösterilen analiz sonuçları ve model performans bileşeni
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { apiService, ModelPerformanceResponse, PredictionResponse } from '../services/api';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import AnimatedNumber from './AnimatedNumber';
import { DashboardSkeleton } from './LoadingSkeleton';

interface RiskDashboardProps {
  predictionResult: PredictionResponse | null;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ predictionResult }) => {
  const [modelPerformance, setModelPerformance] = useState<ModelPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Uygulama açıldığında model performansını yükle
    const loadModelPerformance = async () => {
      try {
        setLoading(true);
        const data = await apiService.getModelPerformance();
        setModelPerformance(data);
        setError(null);
      } catch (err) {
        setError('Model performans verileri yüklenemedi.');
        console.error('Model performance error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadModelPerformance();
  }, []);

  // Risk seviyesine göre renk belirleme
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return '#22c55e'; // emerald-500
      case 'Medium':
        return '#f59e0b'; // amber-500
      case 'High':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Karar durumuna göre ikon ve renk
  const getDecisionDisplay = (decision: string) => {
    switch (decision) {
      case 'APPROVE':
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
          text: 'ONAYLANDI',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500',
        };
      case 'REJECT':
        return {
          icon: <XCircle className="w-12 h-12 text-rose-500" />,
          text: 'REDDEDİLDİ',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500',
        };
      case 'REVIEW':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          text: 'İNCELEME GEREKLİ',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500',
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-gray-500" />,
          text: 'BEKLENİYOR',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500',
        };
    }
  };

  // Confusion Matrix için renkler
  const getConfusionMatrixColor = (row: number, col: number, value: number) => {
    // Sol üst (TN) ve Sağ alt (TP) - Yeşil
    if ((row === 0 && col === 0) || (row === 1 && col === 1)) {
      return 'bg-emerald-500/20 border-emerald-500';
    }
    // Sağ üst (FP) ve Sol alt (FN) - Kırmızı
    return 'bg-rose-500/20 border-rose-500';
  };

  // Gauge chart için veri hazırlama
  const gaugeData = predictionResult
    ? [
        {
          value: predictionResult.risk_score,
          fill: getRiskColor(predictionResult.risk_level),
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bölüm A: Analiz Sonucu */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 hover:shadow-2xl hover:border-slate-600 transition-all duration-300">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          Analiz Sonucu
        </h2>

        {predictionResult ? (
          <div className="space-y-6">
            {/* Risk Skoru Gauge */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    innerRadius="60%"
                    outerRadius="90%"
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={gaugeData[0]?.fill || '#6b7280'}
                      max={100}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <div className="text-4xl font-bold" style={{ color: getRiskColor(predictionResult.risk_level) }}>
                    <AnimatedNumber value={predictionResult.risk_score} duration={1500} />
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Risk Skoru (0-100)</div>
                  {predictionResult.explanation && (
                    <div className="mt-3 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="text-xs text-slate-400 mb-1">Sebep:</div>
                      <div className="text-sm text-slate-300">
                        {predictionResult.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Karar Kartı */}
            <div
              className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-[1.02] ${getDecisionDisplay(predictionResult.decision).bgColor} ${getDecisionDisplay(predictionResult.decision).borderColor}`}
            >
              <div className="flex items-center justify-center gap-4">
                {getDecisionDisplay(predictionResult.decision).icon}
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-100">
                    {getDecisionDisplay(predictionResult.decision).text}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Risk Seviyesi: {predictionResult.risk_level === 'Low' ? 'Düşük' : predictionResult.risk_level === 'Medium' ? 'Orta' : 'Yüksek'}
                  </div>
                  {predictionResult.explanation && (
                    <div className="text-xs text-slate-500 mt-2 px-2">
                      {predictionResult.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p>Analiz yapmak için sol panelden formu doldurun ve "Risk Analizi Yap" butonuna tıklayın.</p>
          </div>
        )}
      </div>

      {/* Bölüm B: Model Güvenilirliği */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 hover:shadow-2xl hover:border-slate-600 transition-all duration-300">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          Model Güvenilirliği
        </h2>

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="text-center py-12 text-rose-500">
            <XCircle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : modelPerformance ? (
          <div className="space-y-6">
            {/* Metrik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'accuracy', label: 'Doğruluk', color: '#22c55e', value: modelPerformance.metrics.accuracy },
                { key: 'precision', label: 'Keskinlik', color: '#3b82f6', value: modelPerformance.metrics.precision },
                { key: 'recall', label: 'Duyarlılık', color: '#f59e0b', value: modelPerformance.metrics.recall },
                { key: 'f1', label: 'F1 Skoru', color: '#a855f7', value: modelPerformance.metrics.f1 },
              ].map((metric) => (
                <div 
                  key={metric.key}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 hover:bg-slate-700/70 transition-all duration-300 hover:scale-105"
                >
                  <div className="text-sm text-slate-400 mb-2">{metric.label}</div>
                  <div className="text-2xl font-bold mb-2" style={{ color: metric.color }}>
                    <AnimatedNumber value={metric.value * 100} duration={1500} decimals={1} suffix="%" />
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${metric.value * 100}%`, backgroundColor: metric.color }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 capitalize">{metric.key}</div>
                </div>
              ))}
            </div>

            {/* Karışıklık Matrisi */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-slate-200">Karışıklık Matrisi</h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 cursor-help transition-colors" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-3 bg-slate-900 text-xs text-slate-200 rounded-lg shadow-lg border border-slate-700">
                    <p className="mb-2"><strong>TN (True Negative):</strong> Güvenli müşteriyi doğru onayladık</p>
                    <p className="mb-2"><strong>TP (True Positive):</strong> Riskli müşteriyi doğru reddettik</p>
                    <p className="mb-2"><strong>FP (False Positive):</strong> Güvenli müşteriyi yanlış reddettik</p>
                    <p><strong>FN (False Negative):</strong> Riskli müşteriyi kaçırdık (En tehlikeli)</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {modelPerformance.confusion_matrix.map((row, rowIndex) =>
                  row.map((value, colIndex) => {
                    const labels = [
                      ['TN (Doğru Onay)', 'FP (Yanlış Alarm)'],
                      ['FN (Kaçan Risk)', 'TP (Doğru Red)']
                    ];
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`p-4 rounded-lg border-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg ${getConfusionMatrixColor(rowIndex, colIndex, value)}`}
                      >
                        <div className="text-2xl font-bold text-slate-100">
                          <AnimatedNumber value={value} duration={1000} />
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {labels[rowIndex][colIndex]}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-4 text-center text-sm text-slate-400">
                {modelPerformance.dataset_info}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RiskDashboard;

