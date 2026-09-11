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
let currentModel = 'gemini-2.5-flash';

function getAiClient() {
    return new GoogleGenerativeAI(currentApiKey);
}

async function callGemini(systemPrompt, userText) {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
        model: currentModel,
        systemInstruction: systemPrompt 
    });
    const result = await model.generateContent(userText);
    const response = await result.response;
    return response.text();
}

// 1. مسار رادار الإعلانات
app.post('/api/ads-radar', async (req, res) => {
    try {
        const { campaignData } = req.body;
        const result = await callGemini("أنت خبير إعلانات ومناطق محترف في وكالة Storm Agency.", `بيانات الحملة الإعلانية: ${campaignData}`);
        res.json({ result });
    } catch (error) {
        console.error('Ads Radar Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. مسار مغناطيس المشاهدات (الخطافات)
app.post(['/api/views-magnet', '/api/hook-generator'], async (req, res) => {
    try {
        const { topicData, topic } = req.body;
        const textToAnalyze = topicData || topic || "صياغة خطافات تسويقية";
        const result = await callGemini("أنت خبير صناعة محتوى وخطافات تسويقية قوية ومؤثرة لزيادة المشاهدات.", `الموضوع: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Views Magnet Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. مسار فحص صفحات الهبوط
app.post('/api/landing-auditor', async (req, res) => {
    try {
        const { landingPageUrl } = req.body;
        const result = await callGemini("أنت خبير تحليل وتحسين صفحات هبوط لزيادة التحويل.", `تحليل الصفحة: ${landingPageUrl}`);
        res.json({ result });
    } catch (error) {
        console.error('Landing Auditor Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. مسار طبيب المبيعات
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeData } = req.body;
        const result = await callGemini("أنت خبير تشخيص مشاكل المتاجر الإلكترونية وتقديم حلول عملية لزيادة الأرباح.", `بيانات المتجر: ${storeData}`);
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