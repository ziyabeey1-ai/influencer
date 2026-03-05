# 🚀 Influencer Hunter AI - Proje Özeti ve Kullanım Kılavuzu

Bu proje, **yzt.digital** ajansı için geliştirilmiş, yapay zeka destekli bir influencer bulma ve otomasyon aracıdır. Gemini AI'ın gücünü kullanarak Instagram profillerini analiz eder, uygunluk skorları verir ve otomatik iş birliği mailleri gönderir.

---

## 🌟 Temel Özellikler

### 1. Akıllı Profil Analizi ve Skorlama
Sistem, verilen Instagram profillerini 5 ana kriterde analiz eder ve 0-100 arası bir **Uygunluk Skoru** verir:
- **Bölge Uyumu (25p):** Hedef bölgeye (örn: Kadıköy, Bahçeşehir) ne kadar yakın?
- **Niş Uyumu (25p):** Kampanya konusuna (örn: Kahve, Moda) ne kadar uygun?
- **Takipçi Kalitesi (25p):** Micro-influencer (5k-100k) aralığında mı?
- **İş Birliği Sinyalleri (15p):** Biyografisinde email veya "iş birliği" ibaresi var mı?
- **İçerik Kalitesi (10p):** Düzenli ve özgün içerik üretiyor mu?

**Karar Mekanizması:**
- **85-100 (ÖNCEL):** Mükemmel aday, hemen mail atılır.
- **70-84 (UYGUN):** İyi aday, mail atılır.
- **0-69 (ZAYIF/UYGUNSUZ):** Elenir veya havuza atılır.

### 2. Otomatik E-posta Gönderimi (Gmail Entegrasyonu)
Sistem, uygun bulduğu ve e-posta adresi tespit ettiği profillere **senin Gmail hesabın üzerinden** otomatik olarak kişiselleştirilmiş iş birliği teklifi gönderir.
- **Altyapı:** Nodemailer + Gmail SMTP
- **Güvenlik:** Gmail Uygulama Şifresi (App Password) ile güvenli bağlantı.
- **İçerik:** Yapay zeka tarafından o kişiye özel yazılan samimi ve profesyonel bir mail.

### 3. Google Arama Entegrasyonu (Keşif Modu)
"Tam Otomasyon" sekmesinde, sadece bölge ve niş belirterek (örn: "Kadıköy", "Kahve") sistemin Google üzerinde uygun Instagram profillerini bulmasını sağlayabilirsin.

---

## 🛠️ Kurulum ve Ayarlar

Sistemin çalışması için aşağıdaki çevre değişkenlerinin (Environment Variables) `.env` dosyasında tanımlı olması gerekir:

### 1. Gemini API Anahtarı
Yapay zeka modellerini kullanmak için gereklidir.
- **Değişken:** `GEMINI_API_KEY`
- **Kaynak:** [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Gmail Ayarları (E-posta Gönderimi İçin)
Otomatik mail atabilmek için Gmail hesabının "Uygulama Şifresi" özelliği kullanılmalıdır.
- **Değişken:** `GMAIL_USER` (Senin Gmail adresin)
- **Değişken:** `GMAIL_APP_PASSWORD` (16 haneli uygulama şifresi)
  - *Nasıl Alınır?* Google Hesabım > Güvenlik > 2 Adımlı Doğrulama > Uygulama Şifreleri > "Diğer (Özel Ad)" seçip bir isim vererek oluştur.

---

## 🚀 Nasıl Kullanılır?

### Adım 1: Manuel Analiz (Tek Profil)
1. **"Profil Analizi"** sekmesine git.
2. Bir Instagram kullanıcı adı (örn: `mekanistanbul`) gir.
3. Hedef Bölge ve Niş bilgilerini seç.
4. **"Analiz Et"** butonuna bas.
5. Sonuçları, skoru ve yapay zekanın yazdığı örnek maili incele.

### Adım 2: Tam Otomasyon (Keşif & Mail)
1. **"Tam Otomasyon"** sekmesine git.
2. **Müşteri Adı:** Kampanyayı yürüten marka (örn: "Local Coffee Shop").
3. **Hedef Niş:** Aradığın influencer türü (örn: "Kahve, Mekan, Lifestyle").
4. **Hedef Bölge:** Odaklanılan semt veya şehir (örn: "Kadıköy, Moda").
5. **"Otomasyonu Başlat"** butonuna tıkla.
6. Sağ taraftaki **Terminal** ekranından süreci canlı izle:
   - 🔍 Google'da profiller aranıyor...
   - 📊 Profiller analiz ediliyor...
   - ✅ Uygun adaylara mail gönderiliyor...

---

## ⚠️ Önemli Notlar
- **Simülasyon Modu:** Eğer Gmail ayarları eksikse, sistem mail atmayı dener ama başaramazsa "Simüle Edildi" uyarısı verir.
- **Hata Ayıklama:** Terminalde "API Key not valid" hatası alırsan, `.env` dosyasındaki `GEMINI_API_KEY` değerini kontrol et.
- **Model:** Sistem şu anda kararlılık için `gemini-3-flash-preview` modelini kullanmaktadır.

---

**Geliştirici:** yzt.digital AI Asistanı
**Son Güncelleme:** 05.03.2026
