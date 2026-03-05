import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Loader2, Search, Mail, MapPin, Users, Activity, 
  CheckCircle, AlertTriangle, XCircle, Info, 
  ChevronRight, Copy, Check, Instagram, Send, Target,
  Bot, Zap, Terminal, PlayCircle
} from 'lucide-react';

const systemPrompt = `Sen yzt.digital adına çalışan bir Influencer Hunter AI botusun. Görevin Instagram profillerini analiz etmek, bölge ve anahtar kelimeye göre influencer bulmak, uygunluk skoru vermek, email taslağı oluşturmak ve tüm bulguları yapılandırılmış JSON formatında döndürmektir.

---

## KİMLİĞİN

Ajans: yzt.digital
Hizmet: Markalara ve işletmelere özel influencer bulma, dijital pazarlama ve iş birliği yönetimi
Müşteri Profili: KOBİ'ler, yerel işletmeler, SaaS ürünleri, e-ticaret markaları
Varsayılan Hedef Bölgeler: Bahçeşehir, Esenyurt, Beylikdüzü (kampanyaya göre değişkendir — kullanıcı her seferinde belirtir)
Hedef Influencer Tipi: Yerel micro ve mid-tier influencerlar (5.000 - 100.000 takipçi)

---

## GÖREVLERİN

### GÖREV 1 — PROFİL ANALİZİ VE SKORLAMA

Sana bir Instagram profili verildiğinde şu kriterlere göre 0-100 arası bir UYGUNLUK SKORU hesapla:

SKORLAMA KRİTERLERİ (toplam 100 puan):

1. BÖLGE UYUMU (25 puan)
   - Biyografide veya içeriklerde hedef bölge geçiyor mu?
   - 25p: Açıkça bölge belirtmiş
   - 15p: İstanbul genel ama hedef semte yakın
   - 5p: Belirsiz konum
   - 0p: Farklı şehir/bölge

2. NİŞ UYUMU (25 puan)
   - Aktif kampanyanın nişine uyum (kullanıcı tarafından belirtilir)
   - 25p: Tam niş örtüşmesi
   - 20p: Yakın niş (benzer kitle)
   - 10p: Genel lifestyle ama hedef kitle uyumlu
   - 5p: Uzak niş, kitlesi kısmen uygun

3. TAKİPÇİ & ETKİLEŞİM KALİTESİ (25 puan)
   - 5.000-30.000 takipçi = ideal (25p)
   - 30.001-100.000 = iyi (18p)
   - 1.000-4.999 = mikro (12p)
   - 100.000+ = makro (8p, maliyet riski var)
   - Etkileşim oranı %5 ve üzeri ise +5p bonus

4. İŞ BİRLİĞİ SİNYALLERİ (15 puan)
   - Biyografide email mevcut mu? (5p)
   - "iş birliği", "reklam", "DM", "işbirliği için" gibi ifadeler? (5p)
   - Daha önce marka içeriği paylaşmış mı? (5p)

5. İÇERİK KALİTESİ (10 puan)
   - Düzenli paylaşım ritmi
   - Özgün ve organik içerik tarzı
   - Türkçe, yerel dil kullanımı

KARAR EŞİKLERİ:
- 85-100: 🟢 ÖNCEL — Hemen mail at
- 70-84:  🟡 UYGUN — Havuza ekle, sırayla mail at
- 50-69:  🟠 ZAYIF — Havuzda tut, beklet
- 0-49:   🔴 UYGUNSUZ — Eleme

---

### GÖREV 2 — EMAIL ÇIKARMA

Verilen biyografi metninden email adresini tespit et.
- Standart formatlar: ornek@gmail.com, ornek@domain.com
- Gizlenmiş formatlar: "ornek [at] gmail [nokta] com" → normalize et
- Birden fazla email varsa iş amaçlı olanı önceliklendir
- Email yoksa: null döndür

---

### GÖREV 3 — KİŞİSELLEŞTİRİLMİŞ İŞ BİRLİĞİ MAİLİ YAZMA

Sana influencer bilgileri ve aktif kampanya notu verildiğinde, aşağıdaki kurallara göre Türkçe bir iş birliği maili yaz:

KURALLAR:
- Uzunluk: 120-160 kelime arası
- Ton: Samimi, profesyonel — ajans dili değil, insan dili
- Kişiselleştirme: İsim, niş, bölge, içerik tarzına mutlaka değin
- Kampanyayı tanıt ama pazarlama jargonu kullanma, değer odaklı konuş
- CTA: Net bir sonraki adım belirt (WhatsApp veya email reply)
- Asla şablon gibi hissettirme
- İmzayı her zaman yzt.digital olarak at

MAIL YAPISI:
1. Kişisel açılış (1 cümle) — o kişinin içeriğinden spesifik bir detaya değin
2. Kim olduğumuz (1 cümle) — yzt.digital'i kısaca tanıt
3. Neden bu kişi (1 cümle) — neden onlarla çalışmak istediğini açıkla
4. Teklif (2 cümle) — kampanya ve kazanım
5. CTA (1 cümle) — yumuşak kapanış
6. İmza: "yzt.digital Ekibi | yzt.digital"

---

SINIRLAR VE KURALLAR
Skor vermeden önce tüm kriterleri sırayla değerlendir, sonuca atlamak yok
Email yoksa mail body alanına "Email bulunamadı — DM kampanyasına ekle" yaz
Takipçi sayısı 1.000'in altındaysa analiz etme, direkt UYGUNSUZ döndür
Profil açıkça başka bir şehirdeyse bölge puanı 0
Şüpheli hesap sinyalleri (bozuk takipçi/takip oranı, bot yorumlar, sahte engagement) varsa bunu "weaknesses" içinde belirt ve skordan 20 puan düş
Aynı niş içinde birden fazla profil analiz ediyorsan aralarında karşılaştırmalı not ekle
Her kampanya için "client" alanını doldur — yzt.digital birden fazla müşteri için çalışır, kayıtlar karışmamalı
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    campaign: {
      type: Type.OBJECT,
      properties: {
        client: { type: Type.STRING },
        niche: { type: Type.STRING },
        targetRegion: { type: Type.STRING }
      }
    },
    profile: {
      type: Type.OBJECT,
      properties: {
        username: { type: Type.STRING },
        fullName: { type: Type.STRING },
        followers: { type: Type.NUMBER },
        engagementRate: { type: Type.NUMBER },
        location: { type: Type.STRING },
        niche: { type: Type.STRING },
        email: { type: Type.STRING },
        bio: { type: Type.STRING }
      }
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        decision: { type: Type.STRING },
        scoreBreakdown: {
          type: Type.OBJECT,
          properties: {
            bolgeUyumu: { type: Type.NUMBER },
            nisUyumu: { type: Type.NUMBER },
            takipciEtkilesim: { type: Type.NUMBER },
            isbirligiSinyalleri: { type: Type.NUMBER },
            icerikKalitesi: { type: Type.NUMBER }
          }
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING }
      }
    },
    email: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
        personalizationNotes: { type: Type.STRING }
      }
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        analyzedAt: { type: Type.STRING },
        agencyNote: { type: Type.STRING },
        priority: { type: Type.NUMBER }
      }
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Automation State
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoLogs, setAutoLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoLogs]);

  const [formData, setFormData] = useState({
    client: 'Local Coffee Shop',
    targetNiche: 'Food & Beverage, Lifestyle',
    targetRegion: 'Bahçeşehir',
    username: 'kahvesever_ist',
    bio: '☕️ Kahve tutkunu | 📍 Bahçeşehir\n📸 Mekan keşifleri ve günlük yaşam\n📩 İş birliği için: kahvesever@gmail.com',
    followers: '12500',
    following: '450',
    posts: '320',
    engagementRate: '4.5',
    location: 'Bahçeşehir, İstanbul'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `TARA:
Kampanya: ${formData.client}
Hedef Niş: ${formData.targetNiche}
Hedef Bölge: ${formData.targetRegion}

Kullanıcı adı: ${formData.username}
Biyografi: ${formData.bio}
Takipçi: ${formData.followers}
Takip edilen: ${formData.following}
Gönderi sayısı: ${formData.posts}
Tahmini etkileşim oranı: ${formData.engagementRate}
Konum (varsa): ${formData.location}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          temperature: 0.2,
        }
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
      } else {
        setError("No response received from the model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const startAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoRunning(true);
    setAutoLogs([]);

    try {
      const response = await fetch('/api/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: formData.client,
          targetNiche: formData.targetNiche,
          targetRegion: formData.targetRegion
        })
      });

      if (!response.body) throw new Error('Sunucudan yanıt alınamadı.');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            setAutoLogs(prev => [...prev, log]);
          } catch (e) {
            console.error('Log parse hatası:', line);
          }
        }
      }
    } catch (err: any) {
      setAutoLogs(prev => [...prev, { type: 'error', message: err.message }]);
    } finally {
      setAutoRunning(false);
    }
  };

  const copyEmail = () => {
    if (result?.email?.body) {
      navigator.clipboard.writeText(result.email.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ÖNCEL': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UYGUN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ZAYIF': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'UYGUNSUZ': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ÖNCEL': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'UYGUN': return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      case 'ZAYIF': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'UYGUNSUZ': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">yzt.digital <span className="text-neutral-500 font-normal">Influencer Hunter</span></h1>
          </div>
          <div className="text-sm text-neutral-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            AI Engine Ready
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-neutral-200 pb-px">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Manuel Profil Analizi
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'auto' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            Tam Otomasyon (Keşif & Mail)
          </button>
        </div>

        {activeTab === 'manual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Input Forms */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleAnalyze} className="space-y-6">
              
              {/* Campaign Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Kampanya Bilgileri
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Müşteri / Marka</label>
                    <input 
                      type="text" name="client" value={formData.client} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Hedef Niş</label>
                    <input 
                      type="text" name="targetNiche" value={formData.targetNiche} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Hedef Bölge</label>
                    <input 
                      type="text" name="targetRegion" value={formData.targetRegion} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Influencer Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  Influencer Profili
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Kullanıcı Adı</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">@</span>
                      <input 
                        type="text" name="username" value={formData.username} onChange={handleChange} required
                        className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Takipçi</label>
                      <input 
                        type="number" name="followers" value={formData.followers} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Etkileşim Oranı (%)</label>
                      <input 
                        type="number" step="0.1" name="engagementRate" value={formData.engagementRate} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Takip Edilen</label>
                      <input 
                        type="number" name="following" value={formData.following} onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Gönderi Sayısı</label>
                      <input 
                        type="number" name="posts" value={formData.posts} onChange={handleChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Konum</label>
                    <input 
                      type="text" name="location" value={formData.location} onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Biyografi</label>
                    <textarea 
                      name="bio" value={formData.bio} onChange={handleChange} rows={4} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Profili Analiz Et
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                <Search className="w-12 h-12 mb-4 text-neutral-300" />
                <h3 className="text-lg font-medium text-neutral-900 mb-1">Analiz Bekleniyor</h3>
                <p className="max-w-sm">Sol taraftaki formu doldurarak influencer profilini analiz edin. Sonuçlar burada görüntülenecektir.</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-neutral-200 bg-white rounded-2xl flex flex-col items-center justify-center text-neutral-500 p-8">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="font-medium animate-pulse">Yapay zeka profili değerlendiriyor...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Score Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative flex-shrink-0">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-100" />
                      <circle 
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={351.8} 
                        strokeDashoffset={351.8 - (351.8 * result.analysis.score) / 100}
                        className={
                          result.analysis.score >= 85 ? 'text-emerald-500' : 
                          result.analysis.score >= 70 ? 'text-yellow-500' : 
                          result.analysis.score >= 50 ? 'text-orange-500' : 'text-red-500'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-neutral-900">{result.analysis.score}</span>
                      <span className="text-xs text-neutral-500 font-medium">/ 100</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-neutral-900">@{result.profile.username}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getDecisionColor(result.analysis.decision)}`}>
                        {getDecisionIcon(result.analysis.decision)}
                        {result.analysis.decision}
                      </span>
                    </div>
                    <p className="text-neutral-600 mb-4">{result.analysis.summary}</p>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{result.profile.followers.toLocaleString()} Takipçi</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4" />
                        <span>%{result.profile.engagementRate} Etkileşim</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{result.profile.location || 'Bilinmiyor'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Score Breakdown */}
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Puan Dağılımı</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Bölge Uyumu', value: result.analysis.scoreBreakdown.bolgeUyumu, max: 25 },
                        { label: 'Niş Uyumu', value: result.analysis.scoreBreakdown.nisUyumu, max: 25 },
                        { label: 'Takipçi & Etkileşim', value: result.analysis.scoreBreakdown.takipciEtkilesim, max: 25 },
                        { label: 'İş Birliği Sinyalleri', value: result.analysis.scoreBreakdown.isbirligiSinyalleri, max: 15 },
                        { label: 'İçerik Kalitesi', value: result.analysis.scoreBreakdown.icerikKalitesi, max: 10 },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span className="text-neutral-700">{item.label}</span>
                            <span className="text-neutral-500">{item.value} / {item.max}</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full" 
                              style={{ width: `${(item.value / item.max) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Güçlü Yönler
                      </h3>
                      <ul className="space-y-1.5">
                        {result.analysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {result.analysis.weaknesses.length > 0 && (
                      <div className="pt-4 border-t border-neutral-100">
                        <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Zayıf Yönler
                        </h3>
                        <ul className="space-y-1.5">
                          {result.analysis.weaknesses.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Draft */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-500" />
                      İş Birliği Mail Taslağı
                    </h3>
                    <button 
                      onClick={copyEmail}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-500 font-medium w-12">Kime:</span>
                        <span className="text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-xs font-mono">
                          {result.email.to || 'Email bulunamadı (DM atılacak)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-500 font-medium w-12">Konu:</span>
                        <span className="text-neutral-900 font-medium">{result.email.subject}</span>
                      </div>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 whitespace-pre-wrap text-sm text-neutral-800 font-sans leading-relaxed">
                      {result.email.body}
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                      <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <p><span className="font-semibold text-indigo-700">Kişiselleştirme Notu:</span> {result.email.personalizationNotes}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Automation Left Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  Otomasyon Ayarları
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Yapay zeka belirttiğiniz bölge ve nişteki profilleri Google üzerinden bulur, analiz eder ve uygun olanlara otomatik mail atar.
                </p>
                
                <form onSubmit={startAutomation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Müşteri / Marka</label>
                    <input 
                      type="text" name="client" value={formData.client} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Hedef Niş</label>
                    <input 
                      type="text" name="targetNiche" value={formData.targetNiche} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Hedef Bölge</label>
                    <input 
                      type="text" name="targetRegion" value={formData.targetRegion} onChange={handleChange} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={autoRunning}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {autoRunning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Otomasyon Çalışıyor...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        Otomasyonu Başlat
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Automation Right Column (Terminal) */}
            <div className="lg:col-span-8">
              <div className="bg-neutral-900 rounded-2xl shadow-lg border border-neutral-800 overflow-hidden flex flex-col h-[600px]">
                <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-mono text-neutral-400">yzt.digital/automation-terminal</span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto font-mono text-sm space-y-2">
                  {autoLogs.length === 0 && !autoRunning && (
                    <div className="text-neutral-500 italic">Sistem hazır. Otomasyonu başlatmak için sol taraftaki formu kullanın.</div>
                  )}
                  
                  {autoLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-neutral-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      {log.type === 'info' && <span className="text-blue-400">{log.message}</span>}
                      {log.type === 'success' && <span className="text-emerald-400">{log.message}</span>}
                      {log.type === 'warning' && <span className="text-yellow-400">{log.message}</span>}
                      {log.type === 'error' && <span className="text-red-400">{log.message}</span>}
                      {log.type === 'result' && (
                        <div className="text-neutral-300">
                          {log.message}
                          {log.data && (
                            <pre className="mt-2 p-2 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-400 overflow-x-auto">
                              {JSON.stringify(log.data.analysis, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
