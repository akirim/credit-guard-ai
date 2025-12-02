"""
CreditGuard AI - Machine Learning Service
Model eğitimi, tahmin ve performans metriklerini yönetir.
"""

import pandas as pd
import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, List, Any
import warnings

warnings.filterwarnings('ignore')

# Global değişkenler
trained_model: RandomForestClassifier = None
encoders: Dict[str, LabelEncoder] = {}
model_metrics: Dict[str, Any] = {}
feature_names: List[str] = []


def train_model():
    """
    German Credit Data ile model eğitir ve performans metriklerini hesaplar.
    """
    global trained_model, encoders, model_metrics, feature_names
    
    # Eğer model zaten eğitilmişse tekrar eğitme
    if trained_model is not None:
        print("Model zaten eğitilmiş, tekrar eğitiliyor...")
    
    print("Veri seti yükleniyor... (Bu işlem birkaç saniye sürebilir)")
    # German Credit Data'yı yükle (data_id=31 kullanarak daha güvenilir)
    data = None
    last_error = None
    
    # Önce data_id=31 ile deneyelim (daha güvenilir)
    try:
        print("  -> data_id=31 ile deneniyor...")
        data = fetch_openml(data_id=31, as_frame=True, parser='auto')
        print("  -> Veri seti başarıyla yüklendi (data_id=31)")
    except Exception as e1:
        last_error = e1
        print(f"  -> data_id=31 başarısız, name ile deneniyor...")
        try:
            # Alternatif: name ile version olmadan
            data = fetch_openml(name='credit-g', as_frame=True, parser='auto')
            print("  -> Veri seti başarıyla yüklendi (name='credit-g')")
        except Exception as e2:
            last_error = e2
            print(f"  -> name ile yükleme başarısız, data_id=42402 deneniyor...")
            try:
                # Son alternatif: farklı data_id
                data = fetch_openml(data_id=42402, as_frame=True, parser='auto')
                print("  -> Veri seti başarıyla yüklendi (data_id=42402)")
            except Exception as e3:
                last_error = e3
                raise Exception(f"Veri seti yüklenemedi. Tüm yöntemler başarısız oldu. Son hata: {str(e3)}")
    
    if data is None:
        raise Exception(f"Veri seti yüklenemedi: {str(last_error)}")
    
    df = data.frame
    
    print(f"Veri seti yüklendi: {len(df)} örnek, {len(df.columns)} özellik")
    
    # Target değişkenini hazırla: 'bad' -> 1 (Riskli), 'good' -> 0 (Güvenli)
    df['target'] = df['class'].map({'bad': 1, 'good': 0})
    
    # Kategorik sütunları belirle
    categorical_columns = df.select_dtypes(include=['object', 'category']).columns.tolist()
    if 'class' in categorical_columns:
        categorical_columns.remove('class')
    
    # Kategorik verileri encode et
    encoders = {}
    df_encoded = df.copy()
    
    for col in categorical_columns:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    # Özellikleri ve hedefi ayır
    feature_columns = [col for col in df_encoded.columns if col not in ['target', 'class']]
    X = df_encoded[feature_columns]
    y = df_encoded['target']
    
    feature_names = feature_columns
    
    # Veriyi %80 eğitim, %20 test olarak ayır
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Eğitim seti: {len(X_train)} örnek")
    print(f"Test seti: {len(X_test)} örnek")
    
    # Model eğitimi
    print("Model eğitiliyor...")
    print("  -> class_weight='balanced' kullanılıyor (Riskli müşterileri daha iyi yakalamak için)")
    trained_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'  # Riskli müşterileri (minority class) daha fazla önemlendir
    )
    trained_model.fit(X_train, y_train)
    
    print("Model eğitimi tamamlandı. Test seti üzerinde değerlendiriliyor...")
    
    # Test seti üzerinde tahmin yap
    y_pred = trained_model.predict(X_test)
    y_pred_proba = trained_model.predict_proba(X_test)[:, 1]
    
    # Metrikleri hesapla
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    # Metrikleri global değişkende sakla
    model_metrics = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
        'confusion_matrix': cm,
        'test_samples': int(len(X_test)),
        'train_samples': int(len(X_train)),
        'total_samples': int(len(df))
    }
    
    print(f"Model Performans Metrikleri:")
    print(f"  Doğruluk (Accuracy): {accuracy:.4f}")
    print(f"  Keskinlik (Precision): {precision:.4f}")
    print(f"  Duyarlılık (Recall): {recall:.4f}")
    print(f"  F1 Skoru: {f1:.4f}")
    print(f"  Karışıklık Matrisi:\n{np.array(cm)}")
    
    return model_metrics


def predict_risk(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Yeni bir kredi başvurusu için risk skoru hesaplar.
    
    Args:
        input_data: Kredi başvuru bilgileri
        
    Returns:
        Risk skoru, karar ve risk seviyesi
    """
    global trained_model, encoders, feature_names
    
    if trained_model is None:
        raise ValueError("Model henüz eğitilmemiş. Önce train_model() çağrılmalı.")
    
    # Giriş verisini DataFrame'e çevir
    input_df = pd.DataFrame([input_data])
    
    # Kategorik değişkenleri encode et
    for col, encoder in encoders.items():
        if col in input_df.columns:
            try:
                # Eğer değer encoder'da yoksa, en sık kullanılan değeri kullan
                if input_df[col].iloc[0] in encoder.classes_:
                    input_df[col] = encoder.transform([input_df[col].iloc[0]])[0]
                else:
                    # Bilinmeyen değer için varsayılan (en sık kullanılan)
                    input_df[col] = 0
            except:
                input_df[col] = 0
    
    # Eksik özellikleri 0 ile doldur
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = 0
    
    # Sadece eğitim sırasında kullanılan özellikleri seç
    X_input = input_df[feature_names]
    
    # Tahmin yap
    risk_proba = trained_model.predict_proba(X_input)[0, 1]  # Riskli olma olasılığı
    risk_score = int(risk_proba * 100)
    
    # Karar ve risk seviyesi
    if risk_score >= 70:
        decision = "REJECT"
        risk_level = "High"
    elif risk_score >= 40:
        decision = "REVIEW"
        risk_level = "Medium"
    else:
        decision = "APPROVE"
        risk_level = "Low"
    
    return {
        "risk_score": risk_score,
        "decision": decision,
        "risk_level": risk_level,
        "risk_probability": float(risk_proba)
    }


def get_model_metrics() -> Dict[str, Any]:
    """
    Eğitilmiş modelin performans metriklerini döndürür.
    """
    global model_metrics
    
    if not model_metrics:
        raise ValueError("Model henüz eğitilmemiş veya metrikler hesaplanmamış.")
    
    return {
        "metrics": {
            "accuracy": model_metrics['accuracy'],
            "precision": model_metrics['precision'],
            "recall": model_metrics['recall'],
            "f1": model_metrics['f1']
        },
        "confusion_matrix": model_metrics['confusion_matrix'],
        "dataset_info": f"German Credit Data ({model_metrics['total_samples']} Samples)"
    }


# Model eğitimi lazy loading ile yapılacak (ilk API çağrısında)
# Uygulama başlatıldığında modeli eğitme - sadece test için
if __name__ == "__main__":
    train_model()
# Modül import edildiğinde modeli eğitme - lazy loading kullanılacak

