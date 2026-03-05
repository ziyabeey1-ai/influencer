import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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


app.post('/api/analyze', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    const { client, targetNiche, targetRegion, username, bio, followers, following, posts, engagementRate, location } = req.body;

    const prompt = `TARA:
Kampanya: ${client}
Hedef Niş: ${targetNiche}
Hedef Bölge: ${targetRegion}

Kullanıcı adı: ${username}
Biyografi: ${bio}
Takipçi: ${followers}
Takip edilen: ${following}
Gönderi sayısı: ${posts}
Tahmini etkileşim oranı: ${engagementRate}
Konum (varsa): ${location}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

    if (!response.text) {
      return res.status(502).json({ error: 'No response received from the model.' });
    }

    return res.json(JSON.parse(response.text));
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
  }
});

app.post('/api/automate', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const sendLog = (log: any) => {
    res.write(JSON.stringify(log) + '\n');
  };

  try {
    const { client, targetNiche, targetRegion } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    // DEBUG LOG
    const key = process.env.GEMINI_API_KEY;
    sendLog({ type: 'info', message: `Debug: API Key loaded. Length: ${key.length}, Starts with: ${key.substring(0, 4)}...` });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let transporter: nodemailer.Transporter | null = null;
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }

    if (!transporter) {
      sendLog({ type: 'warning', message: 'GMAIL_USER veya GMAIL_APP_PASSWORD bulunamadı. E-postalar simüle edilecek (gerçekten gönderilmeyecek).' });
    }

    sendLog({ type: 'info', message: `Google üzerinde ${targetRegion} bölgesindeki ${targetNiche} influencerları aranıyor...` });

    const searchPrompt = `Sen bir influencer araştırmacısısın. Google Search kullanarak ${targetRegion} bölgesinde ${targetNiche} alanında içerik üreten Instagram hesaplarını bul.
En az 2, en fazla 4 adet gerçek Instagram hesabı bul.
Özellikle biyografisinde e-posta adresi olanları seçmeye çalış.
Sadece JSON formatında dön.`;

    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  username: { type: Type.STRING },
                  bio: { type: Type.STRING },
                  followers: { type: Type.NUMBER },
                  email: { type: Type.STRING },
                  location: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const discoveryData = JSON.parse(searchResponse.text || '{"profiles":[]}');
    const profiles = discoveryData.profiles || [];

    if (profiles.length === 0) {
      sendLog({ type: 'error', message: 'Uygun profil bulunamadı. Lütfen kriterleri genişletin.' });
      res.end();
      return;
    }

    sendLog({ type: 'success', message: `${profiles.length} adet potansiyel profil bulundu. Analiz başlıyor...` });

    for (const profile of profiles) {
      sendLog({ type: 'info', message: `@${profile.username} analiz ediliyor...` });
      
      const analyzePrompt = `TARA:
Kampanya: ${client}
Hedef Niş: ${targetNiche}
Hedef Bölge: ${targetRegion}

Kullanıcı adı: ${profile.username}
Biyografi: ${profile.bio}
Takipçi: ${profile.followers || 5000}
Takip edilen: 500
Gönderi sayısı: 100
Tahmini etkileşim oranı: 3.5
Konum (varsa): ${profile.location || targetRegion}`;

      const analyzeResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: analyzePrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any
        }
      });

      const analysisResult = JSON.parse(analyzeResponse.text || '{}');
      
      sendLog({ 
        type: 'result', 
        message: `@${profile.username} analizi tamamlandı. Skor: ${analysisResult.analysis?.score} (${analysisResult.analysis?.decision})`,
        data: analysisResult
      });

      const decision = analysisResult.analysis?.decision;
      const emailTo = analysisResult.email?.to || profile.email;
      
      if ((decision === 'ÖNCEL' || decision === 'UYGUN') && emailTo && emailTo.includes('@')) {
        sendLog({ type: 'info', message: `${emailTo} adresine e-posta gönderimi hazırlanıyor...` });
        
        if (transporter) {
          try {
            await transporter.sendMail({
              from: `"yzt.digital" <${process.env.GMAIL_USER}>`,
              to: emailTo,
              subject: analysisResult.email.subject,
              text: analysisResult.email.body
            });
            sendLog({ type: 'success', message: `✅ E-posta başarıyla gönderildi: ${emailTo}` });
          } catch (err: any) {
            sendLog({ type: 'error', message: `❌ E-posta gönderilemedi: ${err.message}` });
          }
        } else {
          sendLog({ type: 'warning', message: `⚠️ Gmail bilgileri eksik. E-posta gönderilmiş gibi simüle edildi: ${emailTo}` });
        }
      } else if (decision === 'ÖNCEL' || decision === 'UYGUN') {
        sendLog({ type: 'warning', message: `⚠️ @${profile.username} için geçerli bir e-posta bulunamadı. DM atılması önerilir.` });
      } else {
        sendLog({ type: 'info', message: `⏭️ @${profile.username} skoru yetersiz olduğu için pas geçildi.` });
      }
    }

    sendLog({ type: 'success', message: '🎉 Otomasyon süreci tamamlandı!' });

  } catch (error: any) {
    let errorMessage = error.message;
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (typeof error.message === 'string' && error.message.includes('API key not valid')) {
      errorMessage = "Gemini API Anahtarı geçersiz veya tanımlanmamış. Lütfen AI Studio Secrets panelinden GEMINI_API_KEY değerini kontrol edin.";
    }
    sendLog({ type: 'error', message: `Sistem Hatası: ${errorMessage}` });
  } finally {
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
