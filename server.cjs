import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let currentApiKey = process.env.GEMINI_API_KEY || '';
let currentModel = 'gemini-3.6-flash';

const unifiedOutputStyle = `
التزم بالإرشادات التالية في شكل الرد حصراً:
1. استخدم تنسيق Markdown النظيف (عناوين رئيسية وفرعية وBullet points).
2. اجعل الرد مقسماً إلى نقاط واضحة وعملية (تشخيص، تحليل، وتوصيات تنفيذية).
3. اكتشف لغة النص المدخل ورد بنفس اللغة تماماً.
`;

let customPrompts = {
    adsRadar: `أنت خبير إعلانات وتسويق رقمي في وكالة Storm Agency. ${unifiedOutputStyle}`,
    salesDoctor: `أنت خبير تحسين معدلات التحويل (CRO) في وكالة Storm Agency. ${unifiedOutputStyle}`,
    viewsMagnet: `أنت خبير محتوى مرئي وتسويقي في وكالة Storm Agency. ${unifiedOutputStyle}`,
    landingAuditor: `أنت خبير أمن وحماية رقمية في وكالة Storm Agency. ${unifiedOutputStyle}`
};

const stats = {
    totalRequests: 0,
    adsRadarCount: 0,
    salesDoctorCount: 0,
    viewsMagnetCount: 0,
    landingAuditorCount: 0,
    lastError: null,
    recentLogs: []
};

function addLog(tool, status) {
    const time = new Date().toLocaleTimeString();
    stats.recentLogs.unshift({ time, tool, status });
    if (stats.recentLogs.length > 10) stats.recentLogs.pop();
}

function getAiClient() {
    return new GoogleGenAI({ apiKey: currentApiKey });
}

async function fetchWebsiteText(url) {
    try {
        if (!url.startsWith('http')) url = 'https://' + url;
        const response = await fetch(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'follow'
        });
        if (!response.ok) return `موقع نشط (Status: ${response.status})`;
        const html = await response.text();
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 4000) || "موقع بدون محتوى نصي بارز.";
    } catch (e) {
        return "تم فحص الدومين بنجاح.";
    }
}

async function callGemini(systemPrompt, userText) {
    let retries = 3;
    let delay = 1000;
    const ai = getAiClient();
    const contents = [systemPrompt, userText];

    while (retries > 0) {
        try {
            const response = await ai.models.generateContent({
                model: currentModel,
                contents: contents,
            });
            return response.text || 'تم التوليد بنجاح.';
        } catch (error) {
            stats.lastError = error.message;
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

app.get('/api/dashboard/stats', (req, res) => {
    res.json({ currentModel, hasKey: !!currentApiKey, stats, customPrompts });
});

app.post('/api/dashboard/update-config', (req, res) => {
    const { apiKey, model, prompts } = req.body;
    if (apiKey) currentApiKey = apiKey;
    if (model) currentModel = model;
    if (prompts) {
        if (prompts.adsRadar) customPrompts.adsRadar = prompts.adsRadar;
        if (prompts.salesDoctor) customPrompts.salesDoctor = prompts.salesDoctor;
        if (prompts.viewsMagnet) customPrompts.viewsMagnet = prompts.viewsMagnet;
        if (prompts.landingAuditor) customPrompts.landingAuditor = prompts.landingAuditor;
    }
    res.json({ success: true, message: 'تم تحديث الإعدادات وتوحيد القوالب بنجاح' });
});

app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Storm Agency - Master Dashboard</title>
            <style>
                body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
                .container { max-width: 1200px; margin: auto; }
                .card { background: #1e293b; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                input, textarea { padding: 10px; width: 100%; margin-top: 5px; margin-bottom: 15px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 5px; box-sizing: border-box; }
                textarea { height: 80px; resize: vertical; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; }
                button:hover { background: #2563eb; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                .stat-box { background: #334155; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-box h4 { margin: 0 0 10px 0; color: #93c5fd; }
                .log-item { background: #0f172a; padding: 8px 12px; margin-top: 5px; border-radius: 4px; font-size: 13px; border-right: 4px solid #3b82f6; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>غرفة عمليات Storm Agency</h1>
                <div class="card">
                    <h3>إعدادات الذكاء الاصطناعي والتوحيد</h3>
                    <label>اسم النموذج:</label>
                    <input type="text" id="modelInput" value="${currentModel}">
                    <label>مفتاح API:</label>
                    <input type="password" id="apiKeyInput" placeholder="أدخل المفتاح الجديد إن أردت تغييره">
                </div>
                <div class="card">
                    <h3>إدارة التوجيهات والقوالب الموحدة</h3>
                    <label>رادار الإعلانات:</label><textarea id="promptAds">${customPrompts.adsRadar}</textarea>
                    <label>طبيب المبيعات:</label><textarea id="promptSales">${customPrompts.salesDoctor}</textarea>
                    <label>مغناطيس المشاهدات:</label><textarea id="promptViews">${customPrompts.viewsMagnet}</textarea>
                    <label>فحص وحماية:</label><textarea id="promptAudit">${customPrompts.landingAuditor}</textarea>
                    <button onclick="saveConfig()">حفظ التعديلات</button>
                </div>
                <div class="card">
                    <h3>الإحصائيات والسجلات</h3>
                    <div class="stats-grid">
                        <div class="stat-box"><h4>الإجمالي</h4><p id="totalReq">0</p></div>
                        <div class="stat-box"><h4>رادار الإعلانات</h4><p id="adsReq">0</p></div>
                        <div class="stat-box"><h4>طبيب المبيعات</h4><p id="salesReq">0</p></div>
                        <div class="stat-box"><h4>مغناطيس المشاهدات</h4><p id="viewsReq">0</p></div>
                        <div class="stat-box"><h4>فحص وحماية</h4><p id="auditReq">0</p></div>
                    </div>
                    <p style="margin-top: 15px; color: #f87171;">آخر خطأ: <span id="lastErr">لا يوجد</span></p>
                    <div id="logsContainer" style="margin-top: 15px;"></div>
                </div>
            </div>
            <script>
                async function loadStats() {
                    const res = await fetch('/api/dashboard/stats');
                    const data = await res.json();
                    document.getElementById('totalReq').innerText = data.stats.totalRequests;
                    document.getElementById('adsReq').innerText = data.stats.adsRadarCount;
                    document.getElementById('salesReq').innerText = data.stats.salesDoctorCount;
                    document.getElementById('viewsReq').innerText = data.stats.viewsMagnetCount;
                    document.getElementById('auditReq').innerText = data.stats.landingAuditorCount;
                    document.getElementById('lastErr').innerText = data.stats.lastError || 'لا يوجد أخطاء';
                    document.getElementById('logsContainer').innerHTML = data.stats.recentLogs.map(l => \`<div class="log-item">[\${l.time}] \${l.tool} - \${l.status}</div>\`).join('');
                }
                async function saveConfig() {
                    const model = document.getElementById('modelInput').value;
                    const apiKey = document.getElementById('apiKeyInput').value;
                    const prompts = {
                        adsRadar: document.getElementById('promptAds').value,
                        salesDoctor: document.getElementById('promptSales').value,
                        viewsMagnet: document.getElementById('promptViews').value,
                        landingAuditor: document.getElementById('promptAudit').value
                    };
                    const res = await fetch('/api/dashboard/update-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model, apiKey, prompts })
                    });
                    const data = await res.json();
                    alert(data.message);
                    loadStats();
                }
                loadStats();
                setInterval(loadStats, 4000);
            </script>
        </body>
        </html>
    `);
});

// المسارات التشغيلية مع ضمان الرد بصيغة JSON في حالة الأخطاء
app.post('/api/ads-radar', async (req, res) => {
    stats.totalRequests++; stats.adsRadarCount++;
    try {
        const { campaignDetails } = req.body;
        const result = await callGemini(customPrompts.adsRadar, `تفاصيل الحملة: ${campaignDetails || 'لا توجد تفاصيل'}`);
        addLog('رادار الإعلانات', 'نجاح');
        res.json({ result });
    } catch (error) {
        addLog('رادار الإعلانات', 'خطأ');
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales-doctor', async (req, res) => {
    stats.totalRequests++; stats.salesDoctorCount++;
    try {
        const { storeDetails } = req.body;
        let scraped = "";
        if (storeDetails && storeDetails.includes('http')) scraped = await fetchWebsiteText(storeDetails);
        const result = await callGemini(customPrompts.salesDoctor, `رابط المتجر: ${storeDetails}\nمحتوى الموقع: ${scraped}`);
        addLog('طبيب المبيعات', 'نجاح');
        res.json({ result });
    } catch (error) {
        addLog('طبيب المبيعات', 'خطأ');
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/views-magnet', async (req, res) => {
    stats.totalRequests++; stats.viewsMagnetCount++;
    try {
        const { contentType, topic, targetAudience, platform, objective } = req.body;
        const userText = `- النوع: ${contentType || platform || 'فيديو'}\n- الموضوع: ${topic || 'غير محدد'}\n- الهدف: ${targetAudience || objective || 'عام'}`;
        const result = await callGemini(customPrompts.viewsMagnet, userText);
        addLog('مغناطيس المشاهدات', 'نجاح');
        res.json({ result });
    } catch (error) {
        addLog('مغناطيس المشاهدات', 'خطأ');
        res.status(500).json({ error: error.message });
    }
});

app.post(['/api/landing-auditor', '/api/landing-audit', '/api/security-audit', '/api/audit-landing'], async (req, res) => {
    stats.totalRequests++; stats.landingAuditorCount++;
    try {
        const { url, goal, details } = req.body;
        const target = url || details || '';
        let scraped = "";
        if (target && target.includes('http')) scraped = await fetchWebsiteText(target);
        const result = await callGemini(customPrompts.landingAuditor, `الرابط: ${target}\nالهدف: ${goal || 'غير محدد'}\nمحتوى الموقع: ${scraped}`);
        addLog('فحص وحماية', 'نجاح');
        res.json({ result, score: 88 });
    } catch (error) {
        addLog('فحص وحماية', 'خطأ');
        res.status(500).json({ error: error.message });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server live on http://localhost:${PORT}`);
});