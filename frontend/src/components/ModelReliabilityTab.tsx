/**
 * CreditGuard AI - Model Reliability Tab
 * Model performans metrikleri ve grafikleri
 */

import { useEffect, useState } from 'react';
import { XCircle, Info, TrendingUp, Target, Zap, Activity, Award } from 'lucide-react';
import { apiService, ModelPerformanceResponse } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AnimatedNumber from './AnimatedNumber';
import { DashboardSkeleton } from './LoadingSkeleton';

const ModelReliabilityTab: React.FC = () => {
  const [modelPerformance, setModelPerformance] = useState<ModelPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  // Confusion Matrix için renkler
  const getConfusionMatrixColor = (row: number, col: number) => {
    if ((row === 0 && col === 0) || (row === 1 && col === 1)) {
      return 'bg-emerald-500/20 border-emerald-500';
    }
    return 'bg-rose-500/20 border-rose-500';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-rose-500">
        <XCircle className="w-12 h-12 mx-auto mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (!modelPerformance) {
    return null;
  }

  // Metrikler karşılaştırma grafiği için veri
  const metricsChartData = [
    {
      name: 'Doğruluk',
      value: modelPerformance.metrics.accuracy * 100,
      color: '#22c55e',
    },
    {
      name: 'Keskinlik',
      value: modelPerformance.metrics.precision * 100,
      color: '#3b82f6',
    },
    {
      name: 'Duyarlılık',
      value: modelPerformance.metrics.recall * 100,
      color: '#f59e0b',
    },
    {
      name: 'F1 Skoru',
      value: modelPerformance.metrics.f1 * 100,
      color: '#a855f7',
    },
  ];

  // Confusion Matrix heatmap için veri
  const confusionMatrixData = [
    {
      label: 'TN',
      value: modelPerformance.confusion_matrix[0][0],
      color: '#22c55e',
      description: 'Doğru Onay',
    },
    {
      label: 'FP',
      value: modelPerformance.confusion_matrix[0][1],
      color: '#ef4444',
      description: 'Yanlış Alarm',
    },
    {
      label: 'FN',
      value: modelPerformance.confusion_matrix[1][0],
      color: '#ef4444',
      description: 'Kaçan Risk',
    },
    {
      label: 'TP',
      value: modelPerformance.confusion_matrix[1][1],
      color: '#22c55e',
      description: 'Doğru Red',
    },
  ];

  // Precision-Recall balance için veri
  const precisionRecallData = [
    {
      name: 'Model Performansı',
      precision: modelPerformance.metrics.precision * 100,
      recall: modelPerformance.metrics.recall * 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrik Kartları - İyileştirilmiş Tasarım */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            key: 'accuracy', 
            label: 'Doğruluk', 
            color: '#22c55e', 
            value: modelPerformance.metrics.accuracy,
            icon: <Target className="w-5 h-5" />,
            gradient: 'from-emerald-500/20 to-emerald-600/10'
          },
          { 
            key: 'precision', 
            label: 'Keskinlik', 
            color: '#3b82f6', 
            value: modelPerformance.metrics.precision,
            icon: <Zap className="w-5 h-5" />,
            gradient: 'from-blue-500/20 to-blue-600/10'
          },
          { 
            key: 'recall', 
            label: 'Duyarlılık', 
            color: '#f59e0b', 
            value: modelPerformance.metrics.recall,
            icon: <Activity className="w-5 h-5" />,
            gradient: 'from-amber-500/20 to-amber-600/10'
          },
          { 
            key: 'f1', 
            label: 'F1 Skoru', 
            color: '#a855f7', 
            value: modelPerformance.metrics.f1,
            icon: <Award className="w-5 h-5" />,
            gradient: 'from-purple-500/20 to-purple-600/10'
          },
        ].map((metric) => (
          <div
            key={metric.key}
            className={`bg-gradient-to-br ${metric.gradient} rounded-lg p-5 border-2 border-slate-600/50 hover:border-slate-500 hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: metric.color }} className="group-hover:scale-110 transition-transform">
                {metric.icon}
              </div>
              <div className="text-sm font-semibold text-slate-300">{metric.label}</div>
            </div>
            <div className="text-3xl font-bold mb-3" style={{ color: metric.color }}>
              <AnimatedNumber value={metric.value * 100} duration={1500} decimals={1} suffix="%" />
            </div>
            <div className="w-full bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${metric.value * 100}%`, 
                  backgroundColor: metric.color,
                  boxShadow: `0 0 10px ${metric.color}40`
                }}
              ></div>
            </div>
            <div className="text-xs text-slate-500 mt-2 capitalize opacity-70">{metric.key}</div>
          </div>
        ))}
      </div>

      {/* Metrikler Karşılaştırma Grafiği */}
      <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-slate-200">Metrikler Karşılaştırması</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metricsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#e2e8f0',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {metricsChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Precision-Recall Balance Chart */}
      <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-slate-200">Precision-Recall Dengesi</h3>
          <div className="group relative ml-auto">
            <Info className="w-4 h-4 text-slate-400 hover:text-emerald-400 cursor-help transition-colors" />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-3 bg-slate-900 text-xs text-slate-200 rounded-lg shadow-lg border border-slate-700">
              <p className="mb-2"><strong>Precision:</strong> Reddettiğimiz müşterilerin ne kadarının gerçekten riskli olduğu</p>
              <p><strong>Recall:</strong> Riskli müşterilerin ne kadarını yakaladığımız</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Precision</span>
                <span className="text-sm font-bold text-blue-400">
                  <AnimatedNumber value={modelPerformance.metrics.precision * 100} duration={1500} decimals={1} suffix="%" />
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${modelPerformance.metrics.precision * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Recall</span>
                <span className="text-sm font-bold text-amber-400">
                  <AnimatedNumber value={modelPerformance.metrics.recall * 100} duration={1500} decimals={1} suffix="%" />
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${modelPerformance.metrics.recall * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                <AnimatedNumber value={modelPerformance.metrics.f1 * 100} duration={1500} decimals={1} suffix="%" />
              </div>
              <div className="text-sm text-slate-400">F1 Skoru (Denge)</div>
              <div className="text-xs text-slate-500 mt-1">
                {modelPerformance.metrics.precision > modelPerformance.metrics.recall
                  ? 'Precision ağırlıklı'
                  : modelPerformance.metrics.recall > modelPerformance.metrics.precision
                  ? 'Recall ağırlıklı'
                  : 'Dengeli'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Heatmap */}
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
        
        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {modelPerformance.confusion_matrix.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const labels = [
                ['TN (Doğru Onay)', 'FP (Yanlış Alarm)'],
                ['FN (Kaçan Risk)', 'TP (Doğru Red)'],
              ];
              const isGood = (rowIndex === 0 && colIndex === 0) || (rowIndex === 1 && colIndex === 1);
              const maxValue = Math.max(...modelPerformance.confusion_matrix.flat());
              const intensity = value / maxValue;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`p-6 rounded-lg border-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg ${getConfusionMatrixColor(rowIndex, colIndex)}`}
                  style={{
                    backgroundColor: isGood
                      ? `rgba(34, 197, 94, ${0.1 + intensity * 0.2})`
                      : `rgba(239, 68, 68, ${0.1 + intensity * 0.2})`,
                  }}
                >
                  <div className="text-3xl font-bold text-slate-100 mb-2">
                    <AnimatedNumber value={value} duration={1000} />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {labels[rowIndex][colIndex]}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {((value / modelPerformance.confusion_matrix.flat().reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
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
  );
};

export default ModelReliabilityTab;

