/**
 * CreditGuard AI - Türkçe Çeviri Sistemi
 * Categorical değerleri Türkçe'ye çevirir (sadece görsel, API'ye orijinal değer gönderilir)
 */

export interface TranslationMap {
  [key: string]: string; // Orijinal değer -> Türkçe çeviri
}

// Feature bazlı çeviri mapping'leri
export const translations: Record<string, TranslationMap> = {
  checking_status: {
    '0<=X<200': '0-200 TL arası',
    '>=200': '200 TL ve üzeri',
    '<0': 'Negatif bakiye',
    'no checking': 'Hesap yok',
  },
  credit_history: {
    'existing paid': 'Mevcut krediler ödeniyor',
    'all paid': 'Tüm krediler ödendi',
    'delayed previously': 'Geçmişte gecikme var',
    'critical/other existing credit': 'Kritik/Diğer mevcut kredi',
    'no credits/all paid': 'Kredi yok/Tümü ödendi',
  },
  purpose: {
    'new car': 'Yeni araba',
    'used car': 'İkinci el araba',
    'furniture/equipment': 'Mobilya/Ekipman',
    'radio/tv': 'Radyo/TV',
    'domestic appliance': 'Beyaz eşya',
    'repairs': 'Onarım',
    'education': 'Eğitim',
    'vacation': 'Tatil',
    'retraining': 'Yeniden eğitim',
    'business': 'İş',
    'other': 'Diğer',
  },
  savings_status: {
    '<100': '100 TL\'den az',
    '100<=X<500': '100-500 TL arası',
    '500<=X<1000': '500-1000 TL arası',
    '>=1000': '1000 TL ve üzeri',
    'no known savings': 'Tasarruf bilinmiyor',
  },
  employment: {
    'unemployed': 'İşsiz',
    '<1': '1 yıldan az',
    '1<=X<4': '1-4 yıl arası',
    '4<=X<7': '4-7 yıl arası',
    '>=7': '7 yıl ve üzeri',
  },
  personal_status: {
    'male div/sep': 'Erkek boşanmış/ayrılmış',
    'female div/dep/mar': 'Kadın boşanmış/bağımlı/evli',
    'male single': 'Erkek bekar',
    'male mar/wid': 'Erkek evli/dul',
    'female single': 'Kadın bekar',
  },
  other_parties: {
    'none': 'Yok',
    'co applicant': 'Müşterek başvuran',
    'guarantor': 'Kefil',
  },
  property_magnitude: {
    'real estate': 'Gayrimenkul',
    'life insurance': 'Hayat sigortası',
    'car or other': 'Araba veya diğer',
    'no known property': 'Mülkiyet bilinmiyor',
  },
  other_payment_plans: {
    'none': 'Yok',
    'bank': 'Banka',
    'stores': 'Mağazalar',
  },
  housing: {
    'own': 'Kendi evi',
    'rent': 'Kira',
    'for free': 'Ücretsiz',
  },
  job: {
    'unemp/unskilled non res': 'İşsiz/vasıfsız',
    'unskilled resident': 'Vasıfsız yerleşik',
    'skilled': 'Vasıflı',
    'high qualif/self emp/mgmt': 'Yüksek nitelikli/Serbest meslek/Yönetim',
  },
  own_telephone: {
    'none': 'Yok',
    'yes': 'Var',
  },
  foreign_worker: {
    'yes': 'Evet',
    'no': 'Hayır',
  },
};

/**
 * Orijinal değeri Türkçe'ye çevirir
 */
export function translateValue(feature: string, value: string): string {
  const featureTranslations = translations[feature];
  if (!featureTranslations) {
    return value; // Çeviri yoksa orijinal değeri döndür
  }
  return featureTranslations[value] || value;
}

/**
 * Türkçe çeviriyi orijinal değere geri çevirir (API'ye gönderim için)
 */
export function getOriginalValue(feature: string, translatedValue: string): string {
  const featureTranslations = translations[feature];
  if (!featureTranslations) {
    return translatedValue; // Çeviri yoksa olduğu gibi döndür
  }
  
  // Türkçe çeviriyi bul
  for (const [original, translated] of Object.entries(featureTranslations)) {
    if (translated === translatedValue) {
      return original;
    }
  }
  
  // Bulunamazsa orijinal değeri döndür (zaten orijinal olabilir)
  return translatedValue;
}

/**
 * Feature etiketlerini Türkçe'ye çevirir
 */
export const featureLabels: Record<string, string> = {
  // Numeric features
  duration: 'Kredi Süresi',
  credit_amount: 'Kredi Tutarı',
  age: 'Yaş',
  installment_commitment: 'Taksit Taahhüdü',
  residence_since: 'İkamet Süresi',
  existing_credits: 'Mevcut Krediler',
  num_dependents: 'Bağımlı Sayısı',
  
  // Categorical features
  checking_status: 'Hesap Durumu',
  credit_history: 'Kredi Geçmişi',
  purpose: 'Kredi Amacı',
  savings_status: 'Tasarruf Durumu',
  employment: 'İstihdam Durumu',
  personal_status: 'Kişisel Durum',
  other_parties: 'Diğer Taraflar',
  property_magnitude: 'Mülkiyet Büyüklüğü',
  other_payment_plans: 'Diğer Ödeme Planları',
  housing: 'Konut Durumu',
  job: 'Meslek',
  own_telephone: 'Telefon Sahipliği',
  foreign_worker: 'Yabancı İşçi',
};

/**
 * Feature açıklamaları (tooltip için)
 */
export const featureDescriptions: Record<string, string> = {
  duration: 'Kredinin kaç ay süreceğini belirtin',
  credit_amount: 'Talep ettiğiniz kredi tutarını girin',
  age: 'Başvuranın yaşını girin',
  installment_commitment: 'Aylık taksit taahhüdünüzü seçin',
  residence_since: 'Mevcut adresinizde ne kadar süredir ikamet ettiğinizi seçin',
  existing_credits: 'Şu anda sahip olduğunuz kredi sayısını seçin',
  num_dependents: 'Size bağımlı kişi sayısını seçin',
  checking_status: 'Banka hesabınızın mevcut durumunu seçin',
  credit_history: 'Geçmiş kredi ödeme geçmişinizi seçin',
  purpose: 'Krediyi hangi amaçla kullanacağınızı seçin',
  savings_status: 'Tasarruf hesabınızın durumunu seçin',
  employment: 'İş tecrübenizi seçin',
  personal_status: 'Medeni durumunuzu seçin',
  other_parties: 'Krediye dahil olan diğer tarafları seçin',
  property_magnitude: 'Sahip olduğunuz mülkiyet türünü seçin',
  other_payment_plans: 'Diğer ödeme planlarınızı seçin',
  housing: 'Konut durumunuzu seçin',
  job: 'Mesleğinizi seçin',
  own_telephone: 'Telefon sahipliğinizi seçin',
  foreign_worker: 'Yabancı işçi statüsünü seçin',
};

