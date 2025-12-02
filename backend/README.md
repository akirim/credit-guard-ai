# CreditGuard AI - Backend

Kredi risk skoru tahmini için FastAPI backend servisi.

## Kurulum

```bash
pip install -r requirements.txt
```

## Çalıştırma

```bash
uvicorn main:app --reload
```

API `http://localhost:8000` adresinde çalışacaktır.

API dokümantasyonu: `http://localhost:8000/docs`

## Endpoints

- `GET /model-performance`: Model performans metriklerini döndürür
- `POST /predict`: Kredi risk skoru tahmini yapar
- `GET /health`: Sağlık kontrolü

## Model

- Veri Seti: German Credit Data (OpenML)
- Model: RandomForestClassifier
- Eğitim/Test Split: %80 / %20

