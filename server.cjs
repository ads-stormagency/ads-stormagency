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
let currentModel = 'gemini-1.5-pro'; // استخدام نموذج يدعم الصور بكفاءة عالية
function getAiClient() {
    return new GoogleGenerativeAI(currentApiKey);
}

// دالة محسنة للتعامل مع النصوص والصور معاً
async function callGemini(systemPrompt, userContent, imageParts = []) {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
        model: currentModel,
        systemInstruction: systemPrompt 
    });

    // تجهيز المحتوى للنموذج (نصوص + صور إن وجدت)
    let contents = [userContent];
    if (imageParts && imageParts.length > 0) {
        contents = [userContent, ...imageParts];
    }

    const result = await model.generateContent(contents);
    const response = await result.response;
    return response.text();
}

// 1. مسار رادار الإعلانات (يدعم النصوص والصور المرفوعة)
app.post(['/api/ads-radar', '/ads-radar'], async (req, res) => {
    try {
        const { campaignData, description, imageParts } = req.body;
        const textToAnalyze = campaignData || description || "تحليل الحملة الإعلانية وإيراداتها";
        
        const systemPrompt = "أنت خبير إعلانات وميديا باير محترف في وكالة Storm Agency. قم بتشخيص الحملة الإعلانية بدقة بناءً على البيانات والصور المرفقة، واقترح حلولاً لخفض التكلفة ورفع العائد (ROAS).";
        
        // تجهيز الصور إن وجدت بصيغة Generative AI
        let formattedImages = [];
        if (imageParts && Array.isArray(imageParts)) {
            formattedImages = imageParts.map(img => ({
                inlineData: {
                    data: img.inlineData.data,
                    mimeType: img.inlineData.mimeType || 'image/png'
                }
            }));
        }

        const result = await callGemini(systemPrompt, `بيانات الحملة الإعلانية: ${textToAnalyze}`, formattedImages);
        res.json({ result });
    } catch (error) {
        console.error('Ads Radar Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. مسار مغناطيس المشاهدات (الخطافات)
app.post(['/api/views-magnet', '/api/hook-generator'], async (req, res) => {
    try {
        const { topicData, topic, description } = req.body;
        const textToAnalyze = topicData || topic || description || "صياغة خطافات تسويقية جاذبة";
        const result = await callGemini("أنت خبير صناعة محتوى وخطافات تسويقية قوية ومؤثرة لزيادة المشاهدات وتثبيت الانتباه.", `الموضوع أو التفاصيل المقدمة: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Views Magnet Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. مسار فحص صفحات الهبوط
app.post('/api/landing-auditor', async (req, res) => {
    try {
        const { landingPageUrl, description, storeData } = req.body;
        const textToAnalyze = landingPageUrl || description || storeData || "تحليل صفحة الهبوط وتقييم سرعة التحويل والأمان";
        const result = await callGemini("أنت خبير تحليل وتحسين صفحات هبوط وزيادة معدل التحويل (Conversion Rate).", `تفاصيل الصفحة أو الرابط: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Landing Auditor Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. مسار طبيب المبيعات
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeData, description } = req.body;
        const textToAnalyze = storeData || description || "تشخيص مشاكل المتجر الإلكتروني وضعف المبيعات";
        const result = await callGemini("أنت خبير تشخيص مشاكل المتاجر الإلكترونية وتقديم حلول عملية لزيادة الأرباح ورحلة العميل.", `بيانات وتفاصيل المتجر: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Sales Doctor Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});