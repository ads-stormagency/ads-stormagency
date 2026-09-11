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