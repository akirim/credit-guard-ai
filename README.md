# CreditGuard AI

Banka müşterileri için kredi risk skoru hesaplayan, karar veren ve kendi başarısını istatistiksel olarak kanıtlayan profesyonel bir dashboard uygulaması.

## 🚀 Özellikler

- **Akıllı Risk Analizi**: Machine Learning tabanlı kredi risk skoru hesaplama
- **Model Şeffaflığı**: Model performans metriklerini görselleştirme (Accuracy, Precision, Recall, F1)
- **Karışıklık Matrisi**: Modelin doğruluk analizini detaylı gösterim
- **Modern Dashboard**: Kurumsal fintech teması ile responsive tasarım
- **Gerçek Zamanlı Tahmin**: Anlık kredi başvuru değerlendirmesi

## 📁 Proje Yapısı

```
credit-guard-ai/
├── backend/          # FastAPI backend servisi
│   ├── main.py      # API endpoints
│   ├── ml_service.py # ML model eğitimi ve tahmin
│   └── requirements.txt
├── frontend/        # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreditForm.tsx      # Kredi başvuru formu
│   │   │   └── RiskDashboard.tsx   # Risk analizi ve model performans
│   │   ├── services/
│   │   │   └── api.ts              # API servis katmanı
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🛠️ Kurulum

### Backend Kurulumu

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Kurulumu

```bash
cd frontend
npm install
```

## ▶️ Çalıştırma

### 1. Backend'i Başlat

```bash
cd backend
uvicorn main:app --reload
```

Backend `http://localhost:8000` adresinde çalışacaktır.

API dokümantasyonu: `http://localhost:8000/docs`

### 2. Frontend'i Başlat

Yeni bir terminal penceresinde:

```bash
cd frontend
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacaktır.

## 📊 Model Bilgileri

- **Veri Seti**: German Credit Data (OpenML)
- **Model**: RandomForestClassifier
- **Eğitim/Test Split**: %80 / %20
- **Özellikler**: Kredi süresi, tutar, yaş, konut durumu, tasarruf durumu, hesap durumu, kredi amacı

## 🎨 Teknolojiler

### Backend
- FastAPI
- scikit-learn
- pandas
- numpy

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide Icons

## 📝 API Endpoints

- `GET /model-performance`: Model performans metriklerini döndürür
- `POST /predict`: Kredi risk skoru tahmini yapar
- `GET /health`: Sağlık kontrolü

## 🎯 Kullanım

1. Uygulamayı başlattıktan sonra, sol paneldeki formu doldurun
2. "Risk Analizi Yap" butonuna tıklayın
3. Sağ panelde risk skoru, karar ve model performans metriklerini görüntüleyin

## 📈 Model Performans Metrikleri

Dashboard'da gösterilen metrikler:
- **Doğruluk (Accuracy)**: Genel doğru tahmin oranı
- **Keskinlik (Precision)**: Riskli olarak tahmin edilenlerin gerçekten riskli olma oranı
- **Duyarlılık (Recall)**: Gerçek risklilerin yakalanma oranı
- **F1 Skoru**: Precision ve Recall'un harmonik ortalaması

## 🔒 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

