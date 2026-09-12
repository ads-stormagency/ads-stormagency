const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// قراءة ملفات الـ HTML والصفحات تلقائياً
app.use(express.static(__dirname, { extensions: ['html', 'htm'] }));

let currentApiKey = process.env.GEMINI_API_KEY || '';
let currentModel = 'gemini-3.6-flash';
function getAiClient() {
    return new GoogleGenerativeAI(currentApiKey);
}

// دالة عامة للاتصال بجيميناي مع دعم الصور والنصوص
async function callGemini(systemPrompt, userContent, imageParts = []) {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
        model: currentModel,
        systemInstruction: systemPrompt 
    });

    let contents = [userContent];
    if (imageParts && imageParts.length > 0) {
        contents = [userContent, ...imageParts];
    }

    const result = await model.generateContent(contents);
    const response = await result.response;
    return response.text();
}

// دالة مساعدة لتوليد توجيه اللغة للذكاء الاصطناعي
function getLanguageInstruction(lang) {
    if (lang === 'en') return 'You must write your entire response and report in English.';
    if (lang === 'fr') return 'Vous devez rédiger l\'intégralité de votre rapport en français.';
    return 'يجب أن تكتب تقريرك واعترافاتك بالكامل باللغة العربية.';
}

// 1. رادار الإعلانات
app.post(['/api/ads-radar', '/ads-radar'], async (req, res) => {
    try {
        const { campaignData, description, imageParts, lang } = req.body;
        const textToAnalyze = campaignData || description || "تحليل أداء الحملة الإعلانية";
        
        const languageInstruction = getLanguageInstruction(lang);
        const systemPrompt = `أنت محلل بيانات إعلانية وخبير ميديا باير صارم في وكالة Storm Agency. مهمتك تشخيص نتائج الحملات الإعلانية من خلال قراءة الأرقام المرفقة وصورة الإعلان وإعطاء خطوات تصحيحية فورية.
${languageInstruction}`;

        let formattedImages = [];
        if (imageParts && Array.isArray(imageParts)) {
            formattedImages = imageParts.map(img => ({
                inlineData: {
                    data: img.inlineData.data,
                    mimeType: img.inlineData.mimeType || 'image/png'
                }
            }));
        }

        const result = await callGemini(systemPrompt, `بيانات الحملة والإعلانات: ${textToAnalyze}`, formattedImages);
        res.json({ result });
    } catch (error) {
        console.error('Ads Radar Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. مغناطيس المشاهدات والخطافات
app.post(['/api/views-magnet', '/api/hook-generator'], async (req, res) => {
    try {
        const { topicData, topic, description, lang } = req.body;
        const textToAnalyze = topicData || topic || description || "صياغة خطافات تسويقية جاذبة";
        
        const languageInstruction = getLanguageInstruction(lang);
        const systemPrompt = `أنت خبير صناعة محتوى وكاتب إعلانات (Copywriter) محترف في وكالة Storm Agency. مهمتك ابتكار وصياغة خطافات إعلانية قوية وجذابة.
${languageInstruction}`;

        const result = await callGemini(systemPrompt, `الموضوع أو المنتج المستهدف: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Views Magnet Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. فحص صفحات الهبوط
app.post('/api/audit-landing', async (req, res) => {
    try {
        const { url, goal, description, lang } = req.body;
        const textToAnalyze = `رابط الصفحة: ${url || 'غير متوفر'} | الهدف: ${goal || 'غير متوفر'} | تفاصيل إضافية: ${description || ''}`;
        
        const languageInstruction = getLanguageInstruction(lang);
        const systemPrompt = `أنت خبير أمان وخبيرة تحسين معدل التحويل (CRO) في وكالة Storm Agency. قم بتقييم صفحة الهبوط والهدف منها واقترح نقاط التحسين.
${languageInstruction}`;

        const result = await callGemini(systemPrompt, textToAnalyze);
        res.json({ result, score: 85 });
    } catch (error) {
        console.error('Audit Landing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. طبيب المبيعات (تحليل فوري وصارم بدون أسئلة)
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeData, description, url, lang } = req.body;
        const textToAnalyze = storeData || description || url || "تشخيص مشاكل المتجر الإلكتروني وضعف المبيعات";
        
        const languageInstruction = getLanguageInstruction(lang);
        const systemPrompt = `أنت خبير استراتيجي في تشخيص مشاكل المتاجر الإلكترونية وزيادة الأرباح في وكالة Storm Agency.
مهمتك الحصرية: بناءً على أي مدخلات بسيطة يكتبها المستخدم، لا تقم بسؤاله عن تفاصيل إضافية أبداً. 
بدلاً من ذلك، قدم فوراً تقريراً تشخيصياً افتراضياً واحترافياً يغطي:
1. تقييم رحلة العميل وتجربة المستخدم (UX) وأزرار الشراء.
2. الأسباب الرئيسية المحتملة لترك السلة وضعف المبيعات.
3. خطوة تصحيحية فورية لرفع الأرباح ومتوسط قيمة الطلب.
كن مباشراً، حاسماً، وقدم تقريراً جاهزاً للعميل فوراً بدون أي أسئلة.
${languageInstruction}`;

        const result = await callGemini(systemPrompt, `بيانات وتفاصيل المتجر: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Sales Doctor Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// فتح صفحة الداشبورد مباشرة
app.get('/dashboard.html', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});