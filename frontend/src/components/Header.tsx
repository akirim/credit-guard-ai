/**
 * CreditGuard AI - Header Component
 * Gradient background, logo animasyonu, backend durum göstergesi, glassmorphism
 */

import { useState, useEffect } from 'react';
import { Shield, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../services/api';

const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Backend durumunu kontrol et
    const checkBackendStatus = async () => {
      try {
        await apiService.getModelPerformance();
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendStatus();
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700/50 shadow-2xl backdrop-blur-sm bg-slate-800/80">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 animate-pulse"></div>
      
      <div className="container mx-auto px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo ve Başlık */}
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-emerald-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-emerald-400 animate-pulse" />
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                CreditGuard AI
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Kredi Risk Analizi Dashboard</p>
            </div>
          </div>

          {/* Backend Durum Göstergesi */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 backdrop-blur-sm border border-slate-600/50">
              {backendStatus === 'checking' && (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-300">Bağlanıyor...</span>
                </>
              )}
              {backendStatus === 'connected' && (
                <>
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Bağlı</span>
                </>
              )}
              {backendStatus === 'disconnected' && (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-400 font-medium">Bağlantı Yok</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

