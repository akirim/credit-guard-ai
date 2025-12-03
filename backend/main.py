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
    # Zorunlu numeric feature'lar
    duration: int = Field(..., ge=1, le=120, description="Kredi süresi (ay)")
    credit_amount: float = Field(..., ge=0, description="Kredi tutarı")
    age: int = Field(..., ge=18, le=100, description="Yaş")
    
    # Zorunlu categorical feature'lar
    housing: str = Field(..., description="Konut durumu")
    savings_status: Optional[str] = Field(None, description="Tasarruf durumu")  # Veri setinde 'savings_status'
    saving_status: Optional[str] = Field(None, description="Tasarruf durumu (alternatif isim, frontend uyumluluğu için)")  # Frontend'den gelebilir
    checking_status: str = Field(..., description="Hesap durumu")
    purpose: str = Field(..., description="Kredi amacı")
    
    # Opsiyonel numeric feature'lar
    installment_commitment: Optional[int] = Field(None, ge=1, le=4, description="Taksit taahhüdü")
    residence_since: Optional[int] = Field(None, ge=1, le=4, description="İkamet süresi")
    existing_credits: Optional[int] = Field(None, ge=1, le=4, description="Mevcut krediler")
    num_dependents: Optional[int] = Field(None, ge=1, le=2, description="Bağımlı sayısı")
    
    # Opsiyonel categorical feature'lar
    credit_history: Optional[str] = Field(None, description="Kredi geçmişi")
    employment: Optional[str] = Field(None, description="İstihdam durumu")
    personal_status: Optional[str] = Field(None, description="Kişisel durum")
    other_parties: Optional[str] = Field(None, description="Diğer taraflar")
    property_magnitude: Optional[str] = Field(None, description="Mülkiyet büyüklüğü")
    other_payment_plans: Optional[str] = Field(None, description="Diğer ödeme planları")
    job: Optional[str] = Field(None, description="Meslek")
    own_telephone: Optional[str] = Field(None, description="Telefon")
    foreign_worker: Optional[str] = Field(None, description="Yabancı işçi")
    
    class Config:
        json_schema_extra = {
            "example": {
                "duration": 24,
                "credit_amount": 5000,
                "age": 35,
                "housing": "own",
                "savings_status": "100<=X<500",
                "checking_status": "0<=X<200",
                "purpose": "new car"
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
        
        # Giriş verisini dict'e çevir (None değerleri filtrele)
        input_data = {k: v for k, v in application.dict().items() if v is not None}
        
        # saving_status -> savings_status mapping (frontend uyumluluğu için)
        if 'saving_status' in input_data and 'savings_status' not in input_data:
            input_data['savings_status'] = input_data.pop('saving_status')
        
        # Temel alanların varlığını kontrol et
        required_fields = ['duration', 'credit_amount', 'age', 'housing', 'checking_status', 'purpose', 'savings_status']
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise HTTPException(status_code=400, detail=f"Eksik alanlar: {', '.join(missing_fields)}")
        
        # Tahmin yap
        result = ml_service.predict_risk(input_data)
        
        # Sonuç doğrulama
        if not result or 'risk_score' not in result:
            raise HTTPException(status_code=500, detail="Tahmin sonucu geçersiz.")
        
        return PredictionResponse(**result)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Tahmin hatası detayı: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Tahmin hatası: {str(e)}")


@app.get("/health")
async def health_check():
    """Sağlık kontrolü"""
    return {
        "status": "healthy",
        "model_trained": ml_service.trained_model is not None
    }


@app.get("/model-features")
async def get_model_features():
    """
    Model eğitimi sırasında kullanılan feature'ları ve kategorik değerlerini döndürür.
    Frontend formunu dinamik olarak oluşturmak için kullanılabilir.
    """
    try:
        if ml_service.trained_model is None:
            raise HTTPException(status_code=503, detail="Model henüz eğitilmemiş.")
        
        # Numeric ve kategorik feature'ları ayır
        numeric_features = []
        categorical_features = {}
        
        for feature in ml_service.feature_names:
            if feature in ml_service.encoders:
                # Kategorik feature
                categorical_features[feature] = {
                    "type": "categorical",
                    "values": list(ml_service.encoders[feature].classes_)
                }
            else:
                # Numeric feature
                numeric_features.append(feature)
        
        return {
            "numeric_features": numeric_features,
            "categorical_features": categorical_features,
            "all_features": ml_service.feature_names
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")


@app.get("/sample-data")
async def get_sample_data(include_target: bool = True):
    """
    Veri setinden rastgele bir örnek döndürür.
    Frontend formunu otomatik doldurmak için kullanılabilir.
    
    Args:
        include_target: True ise, gerçek risk durumunu da döndürür (default: True)
    """
    try:
        # Model eğitilmemişse eğit (lazy loading)
        if ml_service.trained_model is None:
            print("Model henüz eğitilmemiş, eğitim başlatılıyor...")
            ml_service.train_model()
            print("Model eğitimi tamamlandı!")
        
        sample = ml_service.get_sample_data(include_target=include_target)
        return sample
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")


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
        ml_service.original_dataset = None
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

