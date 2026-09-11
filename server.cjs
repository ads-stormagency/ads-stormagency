const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(process.cwd(), { extensions: ['html', 'htm'] }));

let currentApiKey = process.env.GEMINI_API_KEY || '';
let currentModel = 'gemini-3.6';

const unifiedOutputStyle = `التزم بتنسيق Markdown النظيف، واقسّم الرد إلى نقاط تشخيص، تحليل، وتوصيات تنفيذية سريعة.`;

let customPrompts = {
    adsRadar: `أنت خبير إعلانات وسائط محترف في وكالة Storm Agency. ${unifiedOutputStyle}`,
    salesDoctor: `أنت خبير تحسين معدلات التحويل (CRO) في وكالة Storm Agency. ${unifiedOutputStyle}`,
    viewsMagnet: `أنت خبير محتوى مرئي وإبداعي في وكالة Storm Agency. ${unifiedOutputStyle}`,
    landingAuditor: `أنت خبير أمن وحماية وفحص صفحات الهبوط في وكالة Storm Agency. ${unifiedOutputStyle}`
};

function getAiClient() {
    return new GoogleGenAI({ apiKey: currentApiKey });
}

async function callGemini(systemPrompt, userText) {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: currentModel,
        contents: [systemPrompt, userText],
    });
    return response.text || 'تم التوليد بنجاح.';
}

// مسارات الأدوات (API Endpoints)
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeDetails } = req.body;
        const result = await callGemini(customPrompts.salesDoctor, `تفاصيل المتجر أو صفحة الهبوط: ${storeDetails}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ads-radar', async (req, res) => {
    try {
        const { campaignData } = req.body;
        const result = await callGemini(customPrompts.adsRadar, `بيانات الحملة الإعلانية: ${campaignData}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/landing-auditor', async (req, res) => {
    try {
        const { landingUrl } = req.body;
        const result = await callGemini(customPrompts.landingAuditor, `رابط أو تفاصيل صفحة الهبوط للفحص الأمني والتقني: ${landingUrl}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/views-magnet', async (req, res) => {
    try {
        const { promptData } = req.body;
        const result = await callGemini(customPrompts.viewsMagnet, `بيانات مغناطيس المشاهدات: ${promptData}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// توجيهات مسارات صفحات HTML (حل مشكلة الـ 404 نهائياً)
app.get('/views-magnet', (req, res) => {
    res.sendFile(process.cwd() + '/hooks-generator.html');
});
app.get('/views-magnet.html', (req, res) => {
    res.sendFile(process.cwd() + '/hooks-generator.html');
});
app.get('/hooks-generator', (req, res) => {
    res.sendFile(process.cwd() + '/hooks-generator.html');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server live on port ${PORT}`);
});