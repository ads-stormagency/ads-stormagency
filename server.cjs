const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// قراءة كل ملفات الـ HTML والصفحات بامتياز لتجنب أخطاء 404
app.use(express.static(__dirname, { extensions: ['html', 'htm'] }));

let currentApiKey = process.env.GEMINI_API_KEY || '';
let currentModel = 'gemini-2.5-flash';

function getAiClient() {
    return new GoogleGenAI({ apiKey: currentApiKey });
}

async function callGemini(systemPrompt, userText) {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }, { text: userText }] }
        ]
    });
    return response.text;
}

// نقطة اتصال رادار الإعلانات
app.post('/api/ads-radar', async (req, res) => {
    try {
        const { campaignData } = req.body;
        const result = await callGemini("أنت خبير إعلانات ومناطق محترف في وكالة Storm Agency.", `بيانات الحملة الإعلانية: ${campaignData}`);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});