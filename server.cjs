const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const cheerio = require('cheerio');
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

// 1. رادار الإعلانات
app.post(['/api/ads-radar', '/ads-radar'], async (req, res) => {
    try {
        const { campaignData, description, imageParts } = req.body;
        const textToAnalyze = campaignData || description || "تحليل أداء الحملة الإعلانية";
        
        const systemPrompt = `أنت محلل بيانات إعلانية وخبير ميديا باير صارم في وكالة Storm Agency. 
مهمتك الحصرية هي تشخيص نتائج الحملات الإعلانية من خلال قراءة الأرقام المرفقة وصورة الإعلان.
لا تقدم خططاً استراتيجية عامة، بل أعط تقريراً تشخيصياً مباشراً يوضح:
1. تقييم كفاءة الأرقام الحالية مقارنة بمعايير السوق.
2. التشخيص الفني الدقيق لمشكلة الإعلان.
3. تقييم الخطاف البصري.
4. خطوات تصحيحية فورية لإنقاذ الحملة وخفض التكلفة.`;

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
        const { topicData, topic, description } = req.body;
        const textToAnalyze = topicData || topic || description || "صياغة خطافات تسويقية جاذبة";
        
        const systemPrompt = `أنت خبير صناعة محتوى وكاتب إعلانات (Copywriter) محترف في وكالة Storm Agency.
مهمتك الحصرية هي ابتكار وصياغة "خطافات (Hooks)" إعلانية قوية، جذابة، ومختصرة، بالإضافة إلى أفكار إعلانية إبداعية تكسر النمط وتجذب انتباه المشاهد من أول ثانية لزيادة التفاعل والمشاهدات.`;

        const result = await callGemini(systemPrompt, `الموضوع أو المنتج المستهدف: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Views Magnet Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. فحص أمان المواقع وصفحات الهبوط (باستخدام Scraping خفيف وآمن)
app.post('/api/audit-landing', async (req, res) => {
    try {
        const { url, goal } = req.body;
        
        // سحب محتوى الصفحة بسرعة وخفة
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
        });
        
        // استخراج النصوص المهمة فقط وحذف الأكواد البرمجية
        const $ = cheerio.load(response.data);
        $('script, style, noscript, iframe, img, svg, video').remove();
        let pageText = $('body').text().replace(/\s+/g, ' ').trim();
        
        // تقليل النص لتجنب تجاوز الحد المسموح به في الذكاء الاصطناعي
        if (pageText.length > 4000) {
            pageText = pageText.substring(0, 4000) + '... (تم اقتصاص الباقي)';
        }

        const systemPrompt = `أنت خبير أمان وخبيرة تحسين معدل التحويل (CRO) في وكالة Storm Agency.`;
        const userPrompt = `قم بتحليل محتوى صفحة الهبوط المستخرج من الرابط التالي: (${url})
الهدف الأساسي للصفحة هو: "${goal}".

النصوص المستخرجة من الصفحة:
"""
${pageText}
"""

أعطني تقريراً احترافياً ومفصلاً باللغة العربية يتضمن: 
1. فحص الأمان والثقة والمصداقية (بناءً على النصوص وتوفر سياسات واضحة). 
2. تقييم قوة الرسالة التسويقية وهيكل الصفحة. 
3. نقاط التحسين لزيادة المبيعات. 
قسّم الإجابة بوضوح باستخدام Markdown.`;

        const result = await callGemini(systemPrompt, userPrompt);
        res.json({ result, score: 88 }); // يمكنك لاحقاً جعل الـ AI يعطي التقييم الرقمي

    } catch (error) {
        console.error('Audit Landing Error:', error);
        res.status(500).json({ error: 'فشل في قراءة الرابط. تأكد من أن الرابط صحيح وأن الموقع يسمح بالوصول الخارجي.' });
    }
});

// 4. طبيب المبيعات (Sales Doctor)
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeData, description } = req.body;
        const textToAnalyze = storeData || description || "تشخيص مشاكل المتجر الإلكتروني وضعف المبيعات";
        
        const systemPrompt = `أنت خبير استراتيجي في تشخيص مشاكل المتاجر الإلكترونية وزيادة الأرباح في وكالة Storm Agency.
مهمتك الحصرية هي فحص المتجر الإلكتروني، تحليل رحلة العميل، اكتشاف أسباب ترك سلة التسوق وضعف المبيعات، وتقديم خطة عمل علاجية لرفع الأرباح ومتوسط قيمة الطلب.`;

        const result = await callGemini(systemPrompt, `بيانات وتفاصيل المتجر: ${textToAnalyze}`);
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