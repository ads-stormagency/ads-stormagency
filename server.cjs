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

// 1. رادار الإعلانات: تحليل نتائج الحملات (سكرين شوت النتائج + صورة الإعلان + الأرقام)
app.post(['/api/ads-radar', '/ads-radar'], async (req, res) => {
    try {
        const { campaignData, description, imageParts } = req.body;
        const textToAnalyze = campaignData || description || "تحليل أداء الحملة الإعلانية";
        
        const systemPrompt = `أنت محلل بيانات إعلانية وخبير ميديا باير صارم في وكالة Storm Agency. 
مهمتك الحصرية هي تشخيص نتائج الحملات الإعلانية من خلال قراءة الأرقام المرفقة (مثل CTR, CPC, Cost per Result, ROAS) وصورة الإعلان.
لا تقدم خططاً استراتيجية عامة، بل أعط تقريراً تشخيصياً مباشراً يوضح:
1. تقييم كفاءة الأرقام الحالية مقارنة بمعايير السوق.
2. التشخيص الفني الدقيق لمشكلة الإعلان (لماذا ترتفع التكلفة أو تقل النتائج؟).
3. تقييم الخطاف البصري (Creative & Hook).
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

// 2. مغناطيس المشاهدات والخطافات (Views Magnet): توليد خطافات وأفكار إعلانية قوية
app.post(['/api/views-magnet', '/api/hook-generator'], async (req, res) => {
    try {
        const { topicData, topic, description } = req.body;
        const textToAnalyze = topicData || topic || description || "صياغة خطافات تسويقية جاذبة";
        
        const systemPrompt = `أنت خبير صناعة محتوى وكاتب إعلانات (Copywriter) محترف في وكالة Storm Agency.
مهمتك الحصرية هي ابتكار وصياغة "خطافات (Hooks)" إعلانية قوية، جذابة، ومختصرة، بالإضافة إلى أفكار إعلانية إبداعية تكسر التمساح وتجذب انتباه المشاهد من أول ثانية لزيادة التفاعل والمشاهدات. لا تقدم تحليلاً مالياً للمتجر، بل ركز فقط على الأفكار والخطافات الإبداعية.`;

        const result = await callGemini(systemPrompt, `الموضوع أو المنتج المستهدف: ${textToAnalyze}`);
        res.json({ result });
    } catch (error) {
        console.error('Views Magnet Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. فحص أمان المواقع وصفحات الهبوط (Landing Auditor): فحص الأمان، الحماية، الثبات وتحويل الزوار
app.post('/api/audit-landing', async (req, res) => {
    try {
        const { url, goal } = req.body;
        const prompt = `أنت خبير أمان وخبيرة تحسين معدل التحويل (CRO). قم بإجراء فحص واختبار لصفحة الهبوط التالية: "${url}" بهدف أساسي هو: "${goal}". اعطني تقريراً احترافياً ومفصلاً باللغة العربية يتضمن: 1. فحص الأمان والثقة. 2. تقييم تجربة المستخدم وسرعة الصفحة. 3. نقاط التحسين لزيادة المبيعات. امنح تقييماً رقمياً من 100، وقسّم الإجابة بوضوح باستخدام Markdown.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        });

        res.json({ result: response.text, score: 88 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. طبيب المبيعات (Sales Doctor): تشخيص المتجر، رحلة العميل، وأسباب ضعف المبيعات
app.post('/api/sales-doctor', async (req, res) => {
    try {
        const { storeData, description } = req.body;
        const textToAnalyze = storeData || description || "تشخيص مشاكل المتجر الإلكتروني وضعف المبيعات";
        
        const systemPrompt = `أنت خبير استراتيجي في تشخيص مشاكل المتاجر الإلكترونية وزيادة الأرباح في وكالة Storm Agency.
مهمتك الحصرية هي فحص المتجر الإلكتروني، تحليل رحلة العميل (Customer Journey)، اكتشاف أسباب ترك سلة التسوق (Cart Abandonment)، وضعف المبيعات، وتقديم خطة عمل علاجية وفورية لرفع الأرباح ومتوسط قيمة الطلب (AOV).`;

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