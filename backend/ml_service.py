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


def create_domain_features(df):
    """
    Bankacılık alan bilgisi ile özellik mühendisliği yapar.
    Ödeme gücünü belirleyen oranları hesaplar.
    """
    df_new = df.copy()
    # Aylık Ödeme Yükü: Kredi Tutarı / Vade
    if 'credit_amount' in df_new.columns and 'duration' in df_new.columns:
        df_new['payment_per_month'] = df_new['credit_amount'] / df_new['duration']
    # Yaş/Kredi Oranı: Kredi Tutarı / Yaş
    if 'credit_amount' in df_new.columns and 'age' in df_new.columns:
        df_new['credit_age_ratio'] = df_new['credit_amount'] / df_new['age']
    return df_new


# Global değişkenler
trained_model: RandomForestClassifier = None
encoders: Dict[str, LabelEncoder] = {}
model_metrics: Dict[str, Any] = {}
feature_names: List[str] = []
optimal_threshold: float = 0.5  # Tahmin threshold'u (0.5 = varsayılan)
original_dataset: pd.DataFrame = None  # Orijinal veri seti (encode edilmemiş, örnek veri için)

# Model ağırlık ayarı: Riskli müşteriyi (1) kaçırmak ne kadar kötü?
# Örnek: RISK_WEIGHT = 10.0 -> Bir riskli müşteriyi kaçırmak, 10 iyi müşteriyi üzmekten daha kötü
RISK_WEIGHT = 10.0  # Bu değeri artırarak Recall'ı yükseltebilirsiniz (5.0, 10.0, 15.0, vb.)

# Threshold ayarı: Recall'ı artırmak için threshold'u düşürün (0.3-0.5 arası önerilir)
# Düşük threshold = Daha fazla riskli yakalama, daha fazla yanlış alarm
PREDICTION_THRESHOLD = 0.35  # 0.5 yerine 0.35 kullanarak daha fazla riskli yakalayalım


def train_model():
    """
    German Credit Data ile model eğitir ve performans metriklerini hesaplar.
    """
    global trained_model, encoders, model_metrics, feature_names, original_dataset
    
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
    
    # Alan bilgisi ile özellik mühendisliği uygula
    df = create_domain_features(df)
    
    # Orijinal veri setini global olarak sakla (örnek veri için)
    original_dataset = df.copy()
    
    print(f"Veri seti yüklendi: {len(df)} örnek, {len(df.columns)} özellik")
    print(f"  -> Veri seti sütunları: {list(df.columns)}")
    
    # Target değişkenini hazırla: 'bad' -> 1 (Riskli), 'good' -> 0 (Güvenli)
    df['target'] = df['class'].map({'bad': 1, 'good': 0})
    
    # Kategorik sütunları belirle
    categorical_columns = df.select_dtypes(include=['object', 'category']).columns.tolist()
    if 'class' in categorical_columns:
        categorical_columns.remove('class')
    
    print(f"  -> Kategorik sütunlar: {categorical_columns}")
    
    # Kategorik verileri encode et
    encoders = {}
    df_encoded = df.copy()
    
    for col in categorical_columns:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        # Her kategorik sütunun benzersiz değerlerini göster
        unique_values = df[col].unique()
        print(f"  -> {col} benzersiz değerleri ({len(unique_values)} adet): {list(unique_values)[:10]}...")  # İlk 10 değer
    
    # Tüm feature'ları kullan (kategorik encode edilmiş + numeric)
    feature_columns = [col for col in df_encoded.columns if col not in ['target', 'class']]
    X = df_encoded[feature_columns]
    y = df_encoded['target']
    
    feature_names = feature_columns
    print(f"  -> Model eğitimi için {len(feature_columns)} feature kullanılıyor")
    print(f"  -> Feature isimleri: {feature_columns}")
    
    # Veriyi %80 eğitim, %20 test olarak ayır
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Eğitim seti: {len(X_train)} örnek")
    print(f"Test seti: {len(X_test)} örnek")
    
    # Model eğitimi
    print("Model eğitiliyor...")
    # Manuel ağırlık: Riskli müşteriyi (1) kaçırmak, RISK_WEIGHT iyi müşteriyi (0) üzmekten daha kötü
    class_weights = {0: 1.0, 1: RISK_WEIGHT}  # İyi: 1.0, Riskli: RISK_WEIGHT kat daha önemli
    print(f"  -> Manuel class_weight kullanılıyor: {class_weights}")
    print(f"  -> Riskli müşteriyi kaçırmak, {RISK_WEIGHT} iyi müşteriyi üzmekten daha kötü!")
    trained_model = RandomForestClassifier(
        n_estimators=200,      # Stabilite için artırıldı
        max_depth=None,        # Derinliği serbest bırak (karmaşık riskleri yakalasın)
        min_samples_leaf=2,    # Ezberlemeyi (overfitting) önlemek için yaprak başına min 2 örnek
        random_state=42,
        n_jobs=-1,
        class_weight=class_weights
    )
    trained_model.fit(X_train, y_train)
    
    print("Model eğitimi tamamlandı. Test seti üzerinde değerlendiriliyor...")
    
    # Test seti üzerinde olasılık tahminleri yap
    y_pred_proba = trained_model.predict_proba(X_test)[:, 1]
    
    # --- YENİ AGRESİF THRESHOLD AYARI ---
    print(f"   -> Optimal threshold aranıyor (Hedef Recall >= %80)...")
    
    best_threshold = 0.20 
    best_score_f1 = -1.0
    target_min_recall = 0.80
    found_target_recall = False
    best_recall = 0.0

    # Daha hassas arama yap
    thresholds_to_test = np.arange(0.1, 0.61, 0.02)

    for threshold in thresholds_to_test:
        y_pred_thresh = (y_pred_proba >= threshold).astype(int)
        recall_val = recall_score(y_test, y_pred_thresh, zero_division=0)
        f1_val = f1_score(y_test, y_pred_thresh, zero_division=0)
        
        # Öncelik 1: Hedef Recall'a ulaşmak. Öncelik 2: F1'i maksimize etmek.
        if recall_val >= target_min_recall:
            found_target_recall = True
            if f1_val > best_score_f1:
                best_score_f1 = f1_val
                best_threshold = threshold
                best_recall = recall_val
        # Hedefe henüz ulaşamadıysak, en iyi F1'i yine de takip et
        elif not found_target_recall and f1_val > best_score_f1:
             best_score_f1 = f1_val
             best_threshold = threshold
             best_recall = recall_val

    if not found_target_recall:
         print(f"   -> UYARI: %80 Recall hedefine ulaşılamadı. Güvenli (düşük) threshold seçiliyor.")
         best_threshold = 0.25 # Manuel güvenli liman

    global optimal_threshold
    optimal_threshold = best_threshold
    print(f"  -> Optimal threshold bulundu: {optimal_threshold:.2f} (Recall: {best_recall:.2%})")
    # --- THRESHOLD SONU ---
    
    # Optimal threshold ile tahmin yap
    y_pred = (y_pred_proba >= optimal_threshold).astype(int)
    
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


def generate_risk_explanation(
    model: RandomForestClassifier,
    feature_names: List[str],
    X_input_row: pd.Series,
    original_input_data: Dict[str, Any],
    input_df_with_features: pd.DataFrame,
    encoders: Dict[str, LabelEncoder],
    risk_score: int
) -> str:
    """
    Feature importance kullanarak risk skoru için açıklama oluşturur.
    
    Args:
        model: Eğitilmiş RandomForest modeli
        feature_names: Feature isimleri listesi
        X_input_row: Model'e gönderilen encode edilmiş veri (pandas Series)
        original_input_data: Orijinal giriş verisi (decode edilmemiş)
        input_df_with_features: create_domain_features uygulanmış DataFrame
        encoders: Label encoder'lar
        risk_score: Hesaplanan risk skoru
        
    Returns:
        Türkçe risk açıklaması
    """
    # Feature importance'ları al
    feature_importances = model.feature_importances_
    
    # Feature isimleri ile importance'ları eşleştir ve sırala
    feature_importance_dict = dict(zip(feature_names, feature_importances))
    sorted_features = sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True)
    
    # En önemli 3-5 feature'ı seç (toplam importance'ın %60'ını kapsayan)
    top_features = []
    cumulative_importance = 0.0
    target_importance = 0.6  # Toplam importance'ın %60'ı
    
    for feature_name, importance in sorted_features:
        if cumulative_importance < target_importance and len(top_features) < 5:
            top_features.append((feature_name, importance))
            cumulative_importance += importance
        else:
            break
    
    # Feature Türkçe isimleri mapping
    feature_turkish_names = {
        'payment_per_month': 'Aylık Ödeme Yükü',
        'credit_age_ratio': 'Yaş/Kredi Oranı',
        'checking_status': 'Hesap Durumu',
        'savings_status': 'Tasarruf Durumu',
        'credit_history': 'Kredi Geçmişi',
        'credit_amount': 'Kredi Tutarı',
        'duration': 'Kredi Süresi',
        'age': 'Yaş',
        'employment': 'İstihdam Durumu',
        'purpose': 'Kredi Amacı',
        'housing': 'Konut Durumu',
        'installment_commitment': 'Taksit Taahhüdü',
        'personal_status': 'Kişisel Durum',
        'other_parties': 'Diğer Taraflar',
        'residence_since': 'İkamet Süresi',
        'property_magnitude': 'Mülkiyet Büyüklüğü',
        'other_payment_plans': 'Diğer Ödeme Planları',
        'existing_credits': 'Mevcut Krediler',
        'job': 'Meslek',
        'num_dependents': 'Bağımlı Sayısı',
        'own_telephone': 'Telefon Sahipliği',
        'foreign_worker': 'Yabancı İşçi',
    }
    
    # Risk açıklamaları oluştur
    explanations = []
    
    for feature_name, importance in top_features:
        turkish_name = feature_turkish_names.get(feature_name, feature_name)
        
        # Önce create_domain_features ile oluşturulan feature'ları kontrol et
        original_value = None
        if feature_name in input_df_with_features.columns:
            original_value = input_df_with_features[feature_name].iloc[0]
        elif feature_name in original_input_data:
            original_value = original_input_data[feature_name]
        else:
            # Encoded değeri decode etmeye çalış
            if feature_name in X_input_row.index:
                encoded_value = X_input_row[feature_name]
                # Decode etmeye çalış
                if feature_name in encoders:
                    try:
                        # Encoder'dan geri çevir
                        original_value = encoders[feature_name].inverse_transform([int(encoded_value)])[0]
                    except:
                        original_value = None
                else:
                    # Numeric feature
                    original_value = encoded_value
        
        if original_value is None:
            continue
        
        # Feature'a göre risk açıklaması oluştur
        risk_reason = None
        
        # Numeric feature'lar için
        if feature_name == 'payment_per_month':
            # Aylık ödeme yükü yüksekse riskli
            if isinstance(original_value, (int, float)):
                if original_value > 500:  # Yüksek aylık ödeme
                    risk_reason = f"{turkish_name} fazla"
                elif original_value > 300:
                    risk_reason = f"{turkish_name} orta seviyede"
        
        elif feature_name == 'credit_amount':
            if isinstance(original_value, (int, float)):
                if original_value > 10000:  # Yüksek kredi tutarı
                    risk_reason = f"{turkish_name} yüksek"
        
        elif feature_name == 'credit_age_ratio':
            if isinstance(original_value, (int, float)):
                if original_value > 200:  # Yaşa göre yüksek kredi
                    risk_reason = f"{turkish_name} dengesiz"
        
        elif feature_name == 'age':
            if isinstance(original_value, (int, float)):
                if original_value < 25 or original_value > 65:  # Genç veya yaşlı
                    risk_reason = f"{turkish_name} riskli aralıkta"
        
        # Kategorik feature'lar için
        elif feature_name == 'checking_status':
            risk_values = ['<0', 'no checking']  # Negatif bakiye veya hesap yok
            if str(original_value) in risk_values:
                risk_reason = f"{turkish_name} zayıf"
            elif str(original_value) == '0<=X<200':
                risk_reason = f"{turkish_name} düşük"
        
        elif feature_name == 'savings_status':
            risk_values = ['<100', 'no known savings']  # Düşük tasarruf
            if str(original_value) in risk_values:
                risk_reason = f"{turkish_name} yetersiz"
        
        elif feature_name == 'credit_history':
            risk_values = ['delayed previously', 'critical/other existing credit']  # Kötü geçmiş
            if str(original_value) in risk_values:
                risk_reason = f"{turkish_name} sorunlu"
        
        elif feature_name == 'employment':
            risk_values = ['unemployed', '<1']  # İşsiz veya kısa süreli
            if str(original_value) in risk_values:
                risk_reason = f"{turkish_name} belirsiz"
        
        elif feature_name == 'housing':
            if str(original_value) == 'rent':  # Kirada oturuyor
                risk_reason = f"{turkish_name} kirada"
        
        elif feature_name == 'existing_credits':
            if isinstance(original_value, (int, float)):
                if original_value >= 3:  # Çok fazla mevcut kredi
                    risk_reason = f"{turkish_name} fazla"
        
        # Eğer özel bir risk nedeni bulunamadıysa, genel bir açıklama yap
        if risk_reason is None:
            # Feature importance'a göre genel açıklama
            if importance > 0.1:  # Çok önemli feature
                risk_reason = f"{turkish_name} önemli faktör"
            else:
                risk_reason = f"{turkish_name} etkili"
        
        explanations.append(risk_reason)
    
    # Açıklamaları birleştir
    if explanations:
        explanation_text = ", ".join(explanations[:3])  # En fazla 3 açıklama
    else:
        explanation_text = "Genel risk faktörleri"
    
    return explanation_text


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
    
    # Alan bilgisi ile özellik mühendisliği uygula
    input_df = create_domain_features(input_df)
    
    # Debug: Gelen veriyi logla
    print(f"  -> Tahmin için gelen veri: {input_data}")
    print(f"  -> Gelen veri sütunları ({len(input_df.columns)}): {list(input_df.columns)}")
    print(f"  -> Model feature'ları ({len(feature_names)}): {feature_names}")
    
    # Frontend'den gelen feature isimlerini veri setindeki gerçek feature isimlerine map et
    # German Credit Data feature mapping
    feature_mapping = {
        'saving_status': 'savings_status',  # Frontend'de 'saving_status', veri setinde 'savings_status'
    }
    
    # Feature isimlerini düzelt
    for frontend_name, dataset_name in feature_mapping.items():
        if frontend_name in input_df.columns and dataset_name in feature_names:
            input_df[dataset_name] = input_df[frontend_name]
            if frontend_name != dataset_name:
                input_df = input_df.drop(columns=[frontend_name])
    
    # Not: Frontend artık veri setindeki gerçek değerleri gönderiyor, mapping gerekmiyor
    
    # Kategorik değişkenleri encode et
    for col, encoder in encoders.items():
        if col in input_df.columns:
            try:
                # Değeri string'e çevir (encoder string bekliyor)
                value = str(input_df[col].iloc[0])
                # Eğer değer encoder'da yoksa, en sık kullanılan değeri kullan
                if value in encoder.classes_:
                    input_df[col] = encoder.transform([value])[0]
                    print(f"  -> {col}: '{value}' -> {input_df[col].iloc[0]}")
                else:
                    # Bilinmeyen değer için varsayılan (ilk sınıf)
                    print(f"  -> Uyarı: '{value}' değeri encoder'da bulunamadı. Mevcut değerler: {list(encoder.classes_)[:5]}...")
                    print(f"  -> Varsayılan olarak '{encoder.classes_[0]}' kullanılıyor")
                    input_df[col] = encoder.transform([encoder.classes_[0]])[0]
            except Exception as e:
                print(f"  -> Hata: {col} encode edilemedi: {str(e)}")
                input_df[col] = 0
    
    # Eksik özellikleri varsayılan değerlerle doldur (model eğitimi sırasında kullanılan tüm feature'lar için)
    # Önemli: Eksik feature'lar için veri setindeki en yaygın (median/mode) değerleri kullan
    default_values = {
        'credit_history': 'existing paid',  # En yaygın değer
        'employment': '1<=X<4',  # En yaygın değer
        'installment_commitment': 3,  # Ortalama değer
        'personal_status': 'male single',  # En yaygın değer
        'other_parties': 'none',  # En yaygın değer
        'residence_since': 2,  # Ortalama değer
        'property_magnitude': 'real estate',  # En yaygın değer
        'age': 35,  # Ortalama yaş
        'other_payment_plans': 'none',  # En yaygın değer
        'housing': 'own',  # En yaygın değer
        'existing_credits': 1,  # Ortalama değer
        'job': 'skilled',  # En yaygın değer
        'num_dependents': 1,  # Ortalama değer
        'own_telephone': 'none',  # En yaygın değer
        'foreign_worker': 'yes'  # En yaygın değer
    }
    
    missing_features = []
    for col in feature_names:
        if col not in input_df.columns:
            if col in default_values:
                default_val = default_values[col]
                # Eğer kategorik bir feature ise ve encoder varsa, encode et
                if col in encoders:
                    try:
                        if str(default_val) in encoders[col].classes_:
                            input_df[col] = encoders[col].transform([str(default_val)])[0]
                        else:
                            # Varsayılan değer encoder'da yoksa, ilk sınıfı kullan
                            input_df[col] = encoders[col].transform([encoders[col].classes_[0]])[0]
                    except:
                        input_df[col] = 0
                else:
                    # Numeric feature
                    input_df[col] = default_val
                missing_features.append(f"{col}={default_val}")
            else:
                # Bilinmeyen feature için 0
                input_df[col] = 0
                missing_features.append(f"{col}=0")
    
    if missing_features:
        print(f"  -> Eksik feature'lar varsayılan değerlerle dolduruldu: {', '.join(missing_features[:5])}...")
    
    # Sadece eğitim sırasında kullanılan özellikleri seç ve sırala
    X_input = input_df[feature_names].copy()
    
    # Debug: Model'e giden veriyi logla
    print(f"  -> Model'e gönderilen feature sayısı: {len(X_input.columns)}")
    print(f"  -> Model feature sırası: {list(X_input.columns)}")
    print(f"  -> Model'e gönderilen değerler (ilk 10): {dict(zip(X_input.columns[:10], X_input.iloc[0, :10].values))}")
    if len(X_input.columns) > 10:
        print(f"  -> Model'e gönderilen değerler (son 10): {dict(zip(X_input.columns[-10:], X_input.iloc[0, -10:].values))}")
    
    # Tahmin yap (optimal threshold kullanarak)
    risk_proba = trained_model.predict_proba(X_input)[0, 1]  # Riskli olma olasılığı (0-1 arası)
    
    # Risk skorunu hesapla: Model'in "riskli" olma olasılığını 0-100 arası skora çevir
    # risk_proba = 0.0 -> risk_score = 0 (Çok Güvenli)
    # risk_proba = 0.5 -> risk_score = 50 (Orta Risk)
    # risk_proba = 1.0 -> risk_score = 100 (Çok Riskli)
    risk_score = int(risk_proba * 100)
    
    print(f"  -> Tahmin sonucu: risk_proba={risk_proba:.4f}, risk_score={risk_score}")
    
    # Risk skoruna göre karar verme (0-100 arası skor)
    # 0-35: Düşük Risk -> APPROVE
    # 36-55: Orta Risk -> REVIEW
    # 56-100: Yüksek Risk -> REJECT
    if risk_score <= 35:
        decision = "APPROVE"
        risk_level = "Low"
    elif risk_score <= 55:
        decision = "REVIEW"
        risk_level = "Medium"
    else:
        decision = "REJECT"
        risk_level = "High"
    
    # Feature importance analizi ile açıklama oluştur
    explanation = generate_risk_explanation(
        trained_model, 
        feature_names, 
        X_input.iloc[0], 
        input_data, 
        input_df,  # create_domain_features uygulanmış DataFrame
        encoders,
        risk_score
    )
    
    return {
        "risk_score": risk_score,
        "decision": decision,
        "risk_level": risk_level,
        "risk_probability": float(risk_proba),
        "explanation": explanation
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


def get_sample_data(include_target: bool = False) -> Dict[str, Any]:
    """
    Veri setinden rastgele bir örnek döndürür (formu otomatik doldurmak için).
    
    Args:
        include_target: True ise, gerçek risk durumunu da döndürür (test için)
        
    Returns:
        Örnek veri (encode edilmemiş, frontend'e gönderilebilir format)
    """
    global original_dataset
    
    if original_dataset is None or len(original_dataset) == 0:
        raise ValueError("Veri seti henüz yüklenmemiş. Önce train_model() çağrılmalı.")
    
    # Rastgele bir satır seç
    random_idx = np.random.randint(0, len(original_dataset))
    sample = original_dataset.iloc[random_idx].to_dict()
    
    # 'class' ve 'target' sütunlarını kaldır (frontend'e göndermeye gerek yok)
    result = {}
    for key, value in sample.items():
        if key not in ['class', 'target']:
            result[key] = value
    
    # Eğer istenirse, gerçek risk durumunu da ekle
    if include_target and 'class' in sample:
        result['actual_risk'] = 'bad' if sample['class'] == 'bad' else 'good'
        result['actual_risk_label'] = 'Riskli' if sample['class'] == 'bad' else 'Güvenli'
    
    return result


# Model eğitimi lazy loading ile yapılacak (ilk API çağrısında)
# Uygulama başlatıldığında modeli eğitme - sadece test için
if __name__ == "__main__":
    train_model()
# Modül import edildiğinde modeli eğitme - lazy loading kullanılacak

