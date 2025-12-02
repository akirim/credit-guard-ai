"""
CreditGuard AI - FastAPI Backend
Kredi risk skoru tahmini ve model performans API'leri.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import ml_service

app = FastAPI(
    title="CreditGuard AI API",
    description="Kredi Risk Skoru Tahmin ve Model Performans API",
    version="1.0.0"
)

# CORS ayarları (Frontend ile iletişim için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response modelleri
class CreditApplication(BaseModel):
    duration: int = Field(..., ge=1, le=120, description="Kredi süresi (ay)")
    credit_amount: float = Field(..., ge=0, description="Kredi tutarı")
    age: int = Field(..., ge=18, le=100, description="Yaş")
    housing: str = Field(..., description="Konut durumu")
    saving_status: str = Field(..., description="Tasarruf durumu")
    checking_status: str = Field(..., description="Hesap durumu")
    purpose: str = Field(..., description="Kredi amacı")
    
    class Config:
        json_schema_extra = {
            "example": {
                "duration": 24,
                "credit_amount": 5000,
                "age": 35,
                "housing": "own",
                "saving_status": "moderate",
                "checking_status": "little",
                "purpose": "car"
            }
        }


class PredictionResponse(BaseModel):
    risk_score: int
    decision: str
    risk_level: str
    risk_probability: float


class ModelPerformanceResponse(BaseModel):
    metrics: dict
    confusion_matrix: list
    dataset_info: str


@app.get("/")
async def root():
    """API durum kontrolü"""
    return {
        "message": "CreditGuard AI API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/model-performance", response_model=ModelPerformanceResponse)
async def get_model_performance():
    """
    Eğitilmiş modelin performans metriklerini döndürür.
    Frontend dashboard'da gösterilmek üzere accuracy, precision, recall, f1 ve confusion matrix içerir.
    """
    try:
        # Model eğitilmemişse eğit (lazy loading)
        if ml_service.trained_model is None:
            print("Model henüz eğitilmemiş, eğitim başlatılıyor...")
            ml_service.train_model()
            print("Model eğitimi tamamlandı!")
        
        metrics = ml_service.get_model_metrics()
        return ModelPerformanceResponse(**metrics)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Beklenmeyen hata: {str(e)}")


@app.post("/predict", response_model=PredictionResponse)
async def predict_credit_risk(application: CreditApplication):
    """
    Kredi başvurusu için risk skoru hesaplar.
    
    Giriş parametreleri:
    - duration: Kredi süresi (ay)
    - credit_amount: Kredi tutarı
    - age: Yaş
    - housing: Konut durumu (own, rent, free)
    - saving_status: Tasarruf durumu
    - checking_status: Hesap durumu
    - purpose: Kredi amacı
    """
    try:
        # Model eğitilmemişse eğit (lazy loading)
        if ml_service.trained_model is None:
            print("Model henüz eğitilmemiş, eğitim başlatılıyor...")
            ml_service.train_model()
            print("Model eğitimi tamamlandı!")
        
        # Giriş verisini dict'e çevir
        input_data = application.dict()
        
        # Tahmin yap
        result = ml_service.predict_risk(input_data)
        
        return PredictionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tahmin hatası: {str(e)}")


@app.get("/health")
async def health_check():
    """Sağlık kontrolü"""
    return {
        "status": "healthy",
        "model_trained": ml_service.trained_model is not None
    }


@app.post("/retrain-model")
async def retrain_model():
    """
    Modeli yeniden eğitir (class_weight='balanced' ile).
    Kullanım: Model performansını iyileştirmek için.
    """
    try:
        print("Model yeniden eğitiliyor...")
        # Modeli sıfırla
        ml_service.trained_model = None
        ml_service.model_metrics = {}
        # Yeniden eğit
        ml_service.train_model()
        return {
            "message": "Model başarıyla yeniden eğitildi",
            "metrics": ml_service.get_model_metrics()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model eğitimi hatası: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

