/**
 * CreditGuard AI - Kredi Başvuru Formu
 * Sol panelde gösterilen form bileşeni
 */

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { CreditApplication } from '../services/api';

interface CreditFormProps {
  onSubmit: (data: CreditApplication) => void;
  isLoading?: boolean;
}

const CreditForm: React.FC<CreditFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<CreditApplication>({
    duration: 24,
    credit_amount: 5000,
    age: 35,
    housing: 'own',
    saving_status: 'moderate',
    checking_status: 'little',
    purpose: 'car',
  });

  const handleChange = (field: keyof CreditApplication, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-100">Kredi Başvuru Formu</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kredi Süresi */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kredi Süresi (Ay): {formData.duration}
          </label>
          <input
            type="range"
            min="1"
            max="120"
            value={formData.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1 ay</span>
            <span>120 ay</span>
          </div>
        </div>

        {/* Kredi Tutarı */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kredi Tutarı: {formData.credit_amount.toLocaleString('tr-TR')} ₺
          </label>
          <input
            type="range"
            min="0"
            max="100000"
            step="1000"
            value={formData.credit_amount}
            onChange={(e) => handleChange('credit_amount', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0 ₺</span>
            <span>100.000 ₺</span>
          </div>
        </div>

        {/* Yaş */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Yaş: {formData.age}
          </label>
          <input
            type="range"
            min="18"
            max="100"
            value={formData.age}
            onChange={(e) => handleChange('age', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>18</span>
            <span>100</span>
          </div>
        </div>

        {/* Konut Durumu */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Konut Durumu
          </label>
          <select
            value={formData.housing}
            onChange={(e) => handleChange('housing', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="own">Kendi Evim</option>
            <option value="rent">Kiralık</option>
            <option value="free">Ücretsiz</option>
          </select>
        </div>

        {/* Tasarruf Durumu */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tasarruf Durumu
          </label>
          <select
            value={formData.saving_status}
            onChange={(e) => handleChange('saving_status', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="no_inf">Bilinmiyor</option>
            <option value="little">Az</option>
            <option value="moderate">Orta</option>
            <option value="rich">Yüksek</option>
            <option value="quite_rich">Çok Yüksek</option>
          </select>
        </div>

        {/* Hesap Durumu */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Hesap Durumu
          </label>
          <select
            value={formData.checking_status}
            onChange={(e) => handleChange('checking_status', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="no_inf">Bilinmiyor</option>
            <option value="little">Az Bakiye</option>
            <option value="moderate">Orta Bakiye</option>
            <option value="rich">Yüksek Bakiye</option>
          </select>
        </div>

        {/* Kredi Amacı */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kredi Amacı
          </label>
          <select
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="car">Araba</option>
            <option value="furniture">Mobilya</option>
            <option value="radio_tv">Elektronik</option>
            <option value="domestic_appliances">Beyaz Eşya</option>
            <option value="repairs">Tamirat</option>
            <option value="education">Eğitim</option>
            <option value="business">İş</option>
            <option value="vacation">Tatil</option>
            <option value="other">Diğer</option>
          </select>
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

