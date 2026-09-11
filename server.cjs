const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// نقطة اتصال رادار الإعلانات
app.post(['/api/ads-radar', '/ads-radar'], async (req, res) => {
    try {
        const { campaignData, description } = req.body;
        const textToAnalyze = campaignData || description || "تحليل الحملة الإعلانية";
        const result = await callGemini("أنت خبير إعلانات ومناطق محترف في وكالة Storm Agency.", `بيانات الحملة الإعلانية: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post(['/api/views-magnet', '/views-magnet'], async (req, res) => {
    try {
        const { topicData, topic } = req.body;
        const textToAnalyze = topicData || topic || "صياغة خطافات تسويقية";
        const result = await callGemini("أنت خبير صناعة محتوى وخطافات تسويقية قوية ومؤثرة.", `الموضوع: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// نقطة اتصال مغناطيس المشاهدات (صياغة الخطافات والمحتوى)
app.post('/api/views-magnet', async (req, res) => {
    try {
        const { topicData } = req.body;
        const result = await callGemini("أنت خبير صناعة محتوى وخطافات تسويقية قوية ومؤثرة لزيادة المشاهدات.", `الموضوع أو التفاصيل: ${topicData}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// لو حد طلب صفحة مغناطيس المشاهدات بالاسم الجديد أو القديم، افتح له ملف hook-generator.html
app.get(['/views-magnet', '/views-magnet.html', '/hook-generator', '/hook-generator.html'], (req, res) => {
    res.sendFile(__dirname + '/hook-generator.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});