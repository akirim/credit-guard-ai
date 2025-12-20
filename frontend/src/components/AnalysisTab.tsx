/**
 * CreditGuard AI - Analysis Tab
 * Risk analizi sonuçlarını gösterir - Yeniden düzenlenmiş versiyon
 */

import { CheckCircle2, XCircle, AlertTriangle, CheckCircle, X, TrendingUp, Target, Activity, Shield } from 'lucide-react';
import { PredictionResponse } from '../services/api';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import AnimatedNumber from './AnimatedNumber';

interface AnalysisTabProps {
  predictionResult: PredictionResponse | null;
  actualRiskLabel?: string | null;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ predictionResult, actualRiskLabel }) => {
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
          icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
          text: 'ONAYLANDI',
          bgGradient: 'from-emerald-500/20 via-emerald-600/15 to-transparent',
          borderColor: 'border-emerald-500',
          shadowColor: 'shadow-emerald-500/50',
          textColor: 'text-emerald-400',
        };
      case 'REJECT':
        return {
          icon: <XCircle className="w-16 h-16 text-rose-500" />,
          text: 'REDDEDİLDİ',
          bgGradient: 'from-rose-500/20 via-rose-600/15 to-transparent',
          borderColor: 'border-rose-500',
          shadowColor: 'shadow-rose-500/50',
          textColor: 'text-rose-400',
        };
      case 'REVIEW':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
          text: 'İNCELEME GEREKLİ',
          bgGradient: 'from-amber-500/20 via-amber-600/15 to-transparent',
          borderColor: 'border-amber-500',
          shadowColor: 'shadow-amber-500/50',
          textColor: 'text-amber-400',
        };
      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-gray-500" />,
          text: 'BEKLENİYOR',
          bgGradient: 'from-gray-500/20 via-gray-600/15 to-transparent',
          borderColor: 'border-gray-500',
          shadowColor: 'shadow-gray-500/50',
          textColor: 'text-gray-400',
        };
    }
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

  if (!predictionResult) {
    return (
      <div className="text-center py-12 text-slate-400">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <p>Analiz yapmak için sol panelden formu doldurun ve "Risk Analizi Yap" butonuna tıklayın.</p>
      </div>
    );
  }

  const decisionDisplay = getDecisionDisplay(predictionResult.decision);

  return (
    <div className="space-y-6">
      {/* 1. ÜST: 4 Kompakt Özet Kartı */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Risk Skoru Kartı */}
        <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <div className="text-xs text-slate-400 font-medium">Risk Skoru</div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: getRiskColor(predictionResult.risk_level) }}>
            <AnimatedNumber value={predictionResult.risk_score} duration={1500} />
            <span className="text-lg text-slate-500">/100</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${predictionResult.risk_score}%`, 
                backgroundColor: getRiskColor(predictionResult.risk_level)
              }}
            ></div>
          </div>
          {predictionResult.explanation && (
            <div className="mt-2 text-xs text-slate-400 line-clamp-2">
              {predictionResult.explanation}
            </div>
          )}
        </div>

        {/* Karar Durumu Kartı */}
        <div className={`bg-gradient-to-br ${decisionDisplay.bgGradient} rounded-lg p-4 border-2 ${decisionDisplay.borderColor} hover:shadow-lg hover:scale-105 transition-all duration-300`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-4 h-4 ${decisionDisplay.textColor}`} />
            <div className="text-xs text-slate-400 font-medium">Karar</div>
          </div>
          <div className={`text-xl font-bold ${decisionDisplay.textColor} mb-1`}>
            {predictionResult.decision}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {decisionDisplay.text}
          </div>
        </div>

        {/* Risk Olasılığı Kartı */}
        <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-slate-400 font-medium">Olasılık</div>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            <AnimatedNumber value={predictionResult.risk_probability * 100} duration={1500} decimals={1} suffix="%" />
          </div>
          <div className="text-xs text-slate-500 mt-1">Model tahmini</div>
        </div>

        {/* Risk Seviyesi Kartı */}
        <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: getRiskColor(predictionResult.risk_level) }} />
            <div className="text-xs text-slate-400 font-medium">Seviye</div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: getRiskColor(predictionResult.risk_level) }}>
            {predictionResult.risk_level === 'Low' ? 'Düşük' : predictionResult.risk_level === 'Medium' ? 'Orta' : 'Yüksek'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Risk seviyesi</div>
        </div>
      </div>

      {/* 2. MERKEZ: Büyük Gauge Chart + Büyük Karar Kartı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Büyük Gauge Chart */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg p-6 border border-slate-700 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Risk Skoru Görselleştirme
          </h3>
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  innerRadius="55%"
                  outerRadius="90%"
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    fill={gaugeData[0]?.fill || '#6b7280'}
                    max={100}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <div className="text-5xl font-bold mb-1" style={{ color: getRiskColor(predictionResult.risk_level) }}>
                  <AnimatedNumber value={predictionResult.risk_score} duration={1500} />
                </div>
                <div className="text-sm text-slate-400">Risk Skoru (0-100)</div>
                <div className="text-xs text-slate-500 mt-1">
                  {predictionResult.risk_level === 'Low' 
                    ? 'Düşük risk seviyesi' 
                    : predictionResult.risk_level === 'Medium' 
                    ? 'Orta risk seviyesi' 
                    : 'Yüksek risk seviyesi'}
                </div>
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
        </div>

        {/* Büyük ve Görsel Karar Kartı */}
        <div className={`bg-gradient-to-br ${decisionDisplay.bgGradient} rounded-lg p-6 md:p-8 border-2 ${decisionDisplay.borderColor} shadow-2xl ${decisionDisplay.shadowColor} hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] md:min-h-[350px]`}>
          <div className="mb-4 animate-pulse">
            {decisionDisplay.icon}
          </div>
          <div className="text-center">
            <div className={`text-3xl md:text-4xl font-bold mb-2 ${decisionDisplay.textColor}`}>
              {decisionDisplay.text}
            </div>
            <div className="text-lg text-slate-300 mb-4">
              Risk Seviyesi: {predictionResult.risk_level === 'Low' ? 'Düşük' : predictionResult.risk_level === 'Medium' ? 'Orta' : 'Yüksek'}
            </div>
            <div className="text-sm text-slate-400">
              {predictionResult.decision === 'APPROVE' 
                ? '✅ Bu başvuru onaylandı'
                : predictionResult.decision === 'REJECT'
                ? '❌ Bu başvuru reddedildi'
                : '⚠️ İnceleme gerekiyor'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALT: Detaylı Bilgiler */}
      
      {/* Risk Skoru Karar Tablosu (Kompakt) */}
      <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-emerald-400" />
          Risk Skoru Karar Tablosu
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-2 px-3 text-slate-300">Risk Skoru</th>
                <th className="text-left py-2 px-3 text-slate-300">Risk Seviyesi</th>
                <th className="text-left py-2 px-3 text-slate-300">Karar</th>
                <th className="text-left py-2 px-3 text-slate-300">Anlamı</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b border-slate-700/50 ${predictionResult.risk_score <= 35 ? 'bg-emerald-500/10' : ''}`}>
                <td className="py-2 px-3 text-slate-300 font-medium">0 - 35</td>
                <td className="py-2 px-3">
                  <span className="text-emerald-400 font-medium">Düşük Risk</span>
                </td>
                <td className="py-2 px-3">
                  <span className="text-emerald-400 font-semibold">✅ ONAYLANDI</span>
                </td>
                <td className="py-2 px-3 text-slate-400 text-xs">Müşteri çok güvenilir. Krediyi %90 ihtimalle öder.</td>
              </tr>
              <tr className={`border-b border-slate-700/50 ${predictionResult.risk_score > 35 && predictionResult.risk_score <= 55 ? 'bg-amber-500/10' : ''}`}>
                <td className="py-2 px-3 text-slate-300 font-medium">36 - 55</td>
                <td className="py-2 px-3">
                  <span className="text-amber-400 font-medium">Orta Risk</span>
                </td>
                <td className="py-2 px-3">
                  <span className="text-amber-400 font-semibold">⚠️ İNCELEME</span>
                </td>
                <td className="py-2 px-3 text-slate-400 text-xs">Sınırda. Bankacı gözüyle bakılmalı. Şartlı onay verilebilir.</td>
              </tr>
              <tr className={`${predictionResult.risk_score > 55 ? 'bg-rose-500/10' : ''}`}>
                <td className="py-2 px-3 text-slate-300 font-medium">56 - 100</td>
                <td className="py-2 px-3">
                  <span className="text-rose-400 font-medium">Yüksek Risk</span>
                </td>
                <td className="py-2 px-3">
                  <span className="text-rose-400 font-semibold">❌ REDDEDİLDİ</span>
                </td>
                <td className="py-2 px-3 text-slate-400 text-xs">Müşterinin batırma ihtimali çok yüksek. Banka parasını riske atamaz.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Mevcut Risk Skorunuz:</span>
            <span className={`text-lg font-bold ${
              predictionResult.risk_score <= 30 
                ? 'text-emerald-400' 
                : predictionResult.risk_score <= 60 
                ? 'text-amber-400' 
                : 'text-rose-400'
            }`}>
              {predictionResult.risk_score} → {predictionResult.decision}
            </span>
          </div>
          {predictionResult.explanation && (
            <div className="mt-2 pt-2 border-t border-slate-600">
              <div className="text-xs text-slate-400 mb-1">Sebep:</div>
              <div className="text-sm text-slate-300">
                {predictionResult.explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gerçek Durum vs Model Tahmini Karşılaştırması */}
      {actualRiskLabel && (
        <div className="bg-gradient-to-r from-slate-700/50 via-slate-800/50 to-slate-700/50 rounded-lg p-6 border-2 border-slate-600">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Gerçek Durum vs Model Tahmini
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Gerçek Durum */}
            <div className={`p-5 rounded-lg border-2 transition-all duration-300 hover:scale-[1.02] ${
              actualRiskLabel === 'Riskli' 
                ? 'bg-rose-500/10 border-rose-500 shadow-rose-500/20' 
                : 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {actualRiskLabel === 'Riskli' ? (
                  <XCircle className="w-6 h-6 text-rose-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                )}
                <span className="text-sm font-semibold text-slate-300">Gerçek Durum (Etiketli Veri)</span>
              </div>
              <div className={`text-3xl font-bold mb-2 ${
                actualRiskLabel === 'Riskli' ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {actualRiskLabel}
              </div>
              <div className="text-xs text-slate-400">Veri setindeki etiket</div>
            </div>

            {/* Model Tahmini */}
            <div className={`p-5 rounded-lg border-2 transition-all duration-300 hover:scale-[1.02] ${
              predictionResult.decision === 'REJECT' 
                ? 'bg-rose-500/10 border-rose-500 shadow-rose-500/20' 
                : predictionResult.decision === 'APPROVE'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500 shadow-amber-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {predictionResult.decision === 'REJECT' ? (
                  <XCircle className="w-6 h-6 text-rose-400" />
                ) : predictionResult.decision === 'APPROVE' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                )}
                <span className="text-sm font-semibold text-slate-300">Model Tahmini</span>
              </div>
              <div className={`text-3xl font-bold mb-2 ${
                predictionResult.decision === 'REJECT' 
                  ? 'text-rose-400' 
                  : predictionResult.decision === 'APPROVE'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {decisionDisplay.text}
              </div>
              <div className="text-xs text-slate-400">
                Risk Skoru: {predictionResult.risk_score}
              </div>
            </div>
          </div>

          {/* Doğruluk Göstergesi */}
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Tahmin Doğruluğu:</span>
              {(() => {
                const isCorrect = 
                  (actualRiskLabel === 'Riskli' && predictionResult.decision === 'REJECT') ||
                  (actualRiskLabel === 'Güvenli' && predictionResult.decision === 'APPROVE');
                
                return (
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Doğru Tahmin ✅</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5 text-rose-400" />
                        <span className="text-rose-400 font-semibold">Yanlış Tahmin ❌</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {(() => {
                const isCorrect = 
                  (actualRiskLabel === 'Riskli' && predictionResult.decision === 'REJECT') ||
                  (actualRiskLabel === 'Güvenli' && predictionResult.decision === 'APPROVE');
                
                if (isCorrect) {
                  return 'Model bu örnek için doğru tahmin yaptı.';
                } else if (actualRiskLabel === 'Riskli' && predictionResult.decision === 'APPROVE') {
                  return '⚠️ Model riskli müşteriyi kaçırdı (False Negative - En tehlikeli durum)';
                } else if (actualRiskLabel === 'Güvenli' && predictionResult.decision === 'REJECT') {
                  return 'Model güvenli müşteriyi yanlış reddetti (False Positive)';
                } else {
                  return 'Model inceleme gerektirdi.';
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTab;
