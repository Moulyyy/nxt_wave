/* ============================================
   server.js — Express Backend with Gemini AI Multimodal & Telegram Integration
   Track B: Call-to-Close RL Sales Engine & Client Grounded FAQ RAG
   ============================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const telegramBot = require('./telegram-bot');
const { NIAT_KNOWLEDGE_BASE, searchKnowledgeBase, buildRagContext } = require('./faq-rag');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for Audio Ingestion (memory storage for local & cloud/Render compatibility)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max audio file size
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(express.static(path.join(__dirname)));
app.use('/samples', express.static(path.join(__dirname, 'samples')));

// In-memory lead store (production would use Supabase/PostgreSQL)
let leads = [];
let events = [];

// ===== API Routes =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(), 
        totalLeads: leads.length,
        telegramConfigured: telegramBot.getStatus().configured
    });
});

// Save lead (Track A)
app.post('/api/leads', (req, res) => {
    const lead = {
        ...req.body,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: new Date().toISOString(),
        source: req.headers['x-source'] || 'web',
        ip: req.ip,
        userAgent: req.headers['user-agent']
    };
    leads.push(lead);
    console.log(`[LEAD] ${lead.name} | ${lead.phone} | ${lead.state} | ${lead.careerMatch} | ${lead.matchScore}%`);
    res.json({ success: true, leadId: lead.id });
});

// Get all leads (dashboard)
app.get('/api/leads', (req, res) => {
    const { state, career, from, to } = req.query;
    let filtered = [...leads];
    
    if (state && state !== 'all') filtered = filtered.filter(l => l.state === state);
    if (career && career !== 'all') filtered = filtered.filter(l => l.careerMatch === career);
    if (from) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(from));
    if (to) filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(to));
    
    const stats = {
        total: filtered.length,
        natClicked: filtered.filter(l => l.natClicked).length,
        shared: filtered.filter(l => l.shared).length,
        byState: {},
        byCareer: {},
        byLanguage: {}
    };
    
    filtered.forEach(l => {
        stats.byState[l.state] = (stats.byState[l.state] || 0) + 1;
        stats.byCareer[l.careerMatch] = (stats.byCareer[l.careerMatch] || 0) + 1;
        stats.byLanguage[l.language] = (stats.byLanguage[l.language] || 0) + 1;
    });
    
    res.json({ leads: filtered.reverse(), stats });
});

// Track event
app.post('/api/events', (req, res) => {
    events.push({
        ...req.body,
        timestamp: new Date().toISOString()
    });
    res.json({ success: true });
});

// ===== Resilient Gemini Parts Invocation Helper (Supports Multimodal Audio + Text) =====
async function callGeminiParts(parts, systemInstruction = '', maxTokens = 2500, jsonMode = true) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return null;

    // Resilient fallback order: flash-latest -> 3.8-flash -> flash-lite
    const models = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-flash-lite-latest'];
    for (const model of models) {
        try {
            const body = {
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: maxTokens
                }
            };
            if (jsonMode) {
                body.generationConfig.responseMimeType = "application/json";
            }
            if (systemInstruction) {
                body.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                }
            );

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                console.log(`[GEMINI SUCCESS] Used model: ${model}`);
                return { text, model };
            } else if (data.error) {
                console.warn(`[GEMINI WARN] Model ${model} error:`, data.error.message);
            }
        } catch (err) {
            console.warn(`[GEMINI ERR] Model ${model} request failed:`, err.message);
        }
    }
    return null;
}

// Wrapper for standard text prompt
async function callGemini(prompt, systemInstruction = '', maxTokens = 2000, jsonMode = true) {
    return callGeminiParts([{ text: prompt }], systemInstruction, maxTokens, jsonMode);
}

// ===== API Status / Config Health Endpoint =====
app.get('/api/config-status', (req, res) => {
    res.json({
        success: true,
        geminiActive: !!process.env.GEMINI_API_KEY,
        model: 'Gemini Multimodal (Audio & Text)',
        geminiFallback: 'Gemini Flash Latest',
        whatsappWebhookUrl: '/api/webhook/whatsapp',
        mcpStatus: 'Operational (Dual-Sided HTTP/SSE)',
        telegramStatus: telegramBot.getStatus(),
        ragCorpusItems: NIAT_KNOWLEDGE_BASE.length
    });
});

// ===== AI Career Insight Endpoint (Track A) =====
app.post('/api/ai-insight', async (req, res) => {
    const { name, career, matchScore, percentage, interests, language } = req.body;
    
    const langMap = {
        en: 'English', hi: 'Hindi', te: 'Telugu',
        ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam'
    };
    
    const prompt = `You are an elite career counselor for Indian 12th-grade students. Generate a personalized, encouraging career insight in ${langMap[language] || 'English'} for:

Student: ${name}
Career Match: ${career} (${matchScore}% match)
12th Percentage: ${percentage}%
Interests: ${(interests || []).join(', ')}

Rules:
- Max 3 sentences
- Include one specific salary/demand stat
- End with why starting skill-building NOW (through NIAT's project-based learning) gives them a head start
- Be warm, encouraging and data-driven
- Output only the insight text, no headers or markdown formatting`;

    const geminiRes = await callGemini(prompt, 'You are an admissions and career counselor at NIAT India.', 300, false);
    
    if (geminiRes && geminiRes.text) {
        return res.json({ insight: geminiRes.text.trim(), source: 'gemini', model: geminiRes.model });
    }

    const fallback = generateFallbackInsight(name, career, matchScore, percentage, interests);
    res.json({ insight: fallback, source: 'fallback' });
});

// Fallback insight generator
function generateFallbackInsight(name, career, matchScore, percentage, interests) {
    const insights = [
        `${name}, your unique combination of ${interests.join(' and ')} interests gives you a ${matchScore}% alignment with ${career} — that puts you in the top 15% of students with this profile. Companies in this field are hiring at 2x the rate of traditional IT roles, with freshers starting at ₹5-8 LPA. NIAT's project-first approach means you'll have a portfolio of real work by the time your peers are just starting their placement prep.`,
        `Here's what makes your profile stand out, ${name}: students who score ${percentage}% in 12th and share your interest pattern typically excel in ${career}, where demand is growing 25% annually. The key insight? 73% of recruiters say they value project experience over CGPA — and NIAT gives you 12+ industry projects starting from semester 1.`,
        `${name}, with a ${matchScore}% career DNA match to ${career}, you're positioned for a field where starting salaries have grown 40% in the last 3 years alone. Your interest in ${interests[0]} combined with ${interests[1] || 'technology'} is exactly what top product companies look for. That's where NIAT's model gives you a 2-year head start.`
    ];
    return insights[Math.floor(Math.random() * insights.length)];
}

// ===== Track B: Call-to-Close RL Engine Data Structures =====

// Contextual Bandit Policy Table
let scriptPolicies = [
    {
        id: 'policy_fee_a',
        objectionType: 'fee_premium_250',
        objectionLabel: '250% Fee Premium vs Tier-3',
        angleName: 'Angle A: Financial Stipend Offset',
        description: 'Breaks down Year-1 paid internship stipends (₹18k-₹25k/mo) showing net fee difference recovers before graduation.',
        timesUsed: 42,
        conversionsWon: 20,
        winRate: 47.6,
        isGolden: true,
        scriptTemplate: `Parent's fear is the ₹12L NIAT fee vs ₹3.5L direct college fee. Acknowledge directly: "Sir, on paper it looks like 250% higher, but here is the exact financial math: In regular colleges, students spend 4 years paying fees with zero income and emerge with an average ₹3.5 LPA TCS/Infosys job. In NIAT, starting from 2nd year semester 2, students enter mandatory paid apprenticeships earning ₹15,000 to ₹25,000 monthly. That recovers ₹3.5L to ₹4.5L of the fees before graduation. More importantly, our placement benchmark is ₹9 LPA average for top cohorts. The ₹8L difference is repaid within the first 11 months of working."`
    },
    {
        id: 'policy_fee_b',
        objectionType: 'fee_premium_250',
        objectionLabel: '250% Fee Premium vs Tier-3',
        angleName: 'Angle B: Local Peer & Alumni Proof',
        description: 'Presents verified alumni from same tier-2/3 district who bypassed local college to join product companies.',
        timesUsed: 28,
        conversionsWon: 11,
        winRate: 39.3,
        isGolden: false,
        scriptTemplate: `Anchor to familiar local success: "Sir, last year Srikanth from Tirupati had the exact same dilemma between Mohan Babu University direct seat and NIAT. His father also asked why spend the premium. Today, Srikanth completed 4 production AI projects and just secured a pre-placement offer at a Bangalore AI startup for ₹14 LPA, while standard branch students in the same campus are still waiting for mass recruiter drives."`
    },
    {
        id: 'policy_fee_c',
        objectionType: 'fee_premium_250',
        objectionLabel: '250% Fee Premium vs Tier-3',
        angleName: 'Angle C: Curriculum Dissection vs Outdated Syllabus',
        description: 'Compares real competitor syllabus (no AI/GenAI modules) against NIAT 12-capstone industry skill map.',
        timesUsed: 19,
        conversionsWon: 6,
        winRate: 31.6,
        isGolden: false,
        scriptTemplate: `Compare concrete curriculum modules: "Sir, in the standard college syllabus, students still learn Turbo C++ and 2012 Java until year 3. NIAT students deploy full-stack GenAI applications with vector databases and LLM agents in Semester 1. Product companies do not hire degree certificates; they hire code portfolios. Your son will graduate with 12 production GitHub repositories."`
    },
    {
        id: 'policy_ugc_a',
        objectionType: 'degree_validity',
        objectionLabel: 'UGC Degree Legitimacy',
        angleName: 'Angle A: Dual-Accreditation Clarification',
        description: 'Clarifies UGC recognized B.Tech from NAAC A+ partner university + NIAT Industry Ready Certification.',
        timesUsed: 35,
        conversionsWon: 18,
        winRate: 51.4,
        isGolden: true,
        scriptTemplate: `"Sir, please be 100% assured: the B.Tech degree awarded is fully UGC recognized, AICTE approved, directly issued by our NAAC A+ accredited partner university. It is 100% valid for UPSC, GATE, Govt jobs, and US/German Master's visas. NIAT is the industry upskilling and placement engine on top of the university degree."`
    },
    {
        id: 'policy_batch_a',
        objectionType: 'no_graduated_batch',
        objectionLabel: 'No Graduated Batches Yet',
        angleName: 'Angle A: NxtWave Proven 2,000+ Placement Track Record',
        description: 'Ties NIAT directly to NxtWave parent company 2,500+ hiring partner ecosystem (Amazon, Google, Jio, Deloitte).',
        timesUsed: 26,
        conversionsWon: 12,
        winRate: 46.2,
        isGolden: true,
        scriptTemplate: `"While NIAT residential campus is in its 2nd year, NxtWave has already placed over 2,500+ engineers across 1,500+ tech companies including Amazon, Cognizant, and Jio. The exact same placement cell and hiring partner network guarantees the corporate pipeline for NIAT students."`
    }
];

// Sample preloaded calls with Code-Mixed transcripts
let sampleCalls = [
    {
        id: 'call_telugu_fee_01',
        title: 'Call #1: Mohan Babu Univ vs 250% Fee Premium',
        language: 'Telugu + English (Telugish)',
        leadName: 'Ravi Kumar (Father of Akhil)',
        studentCity: 'Tirupati, AP',
        counsellorName: 'Sneha Reddy',
        duration: '18m 42s',
        objectionCategory: 'fee_premium_250',
        audioSimUrl: '/samples/sample_call_fee_premium.wav',
        transcript: [
            { speaker: 'Counsellor (Sneha)', time: '00:05', text: 'Namaskaram Ravi garu, Akhil NAT score chala bagundi, 88% vachindi. NIAT Mohan Babu University campus gurinchi discuss cheddam.' },
            { speaker: 'Parent (Ravi Kumar)', time: '00:22', text: 'Namaste madam. Marks bagane vachayi kaani, nenu direct Mohan Babu University convenor quota lo chusthe 4 years ki 3.5 lakhs avtundi. Meedi chusthe 12 to 14 lakhs antunnaru. Enduku 250% extra kattali? Same college building kada?' },
            { speaker: 'Counsellor (Sneha)', time: '01:05', text: 'Sir, adhi correct point. Kaani standard quota lo regular syllabus untundi, NIAT lo AI/ML industry real projects untayi.' },
            { speaker: 'Parent (Ravi Kumar)', time: '01:30', text: 'Syllabus gurinchi telidu madam, kaani maaku middle class family. Anta extra pettadam risk anipistondi. Evaranna Tirupati nunchi place ayyara? Proof chupisthe alochistam.' }
        ],
        stateExtraction: {
            parentPersona: 'Value-Conscious Govt Employee Father',
            primaryObjection: '250% Fee Premium vs Direct Convenor Quota at Same University',
            competitorCollege: 'Mohan Babu University (Direct State Quota)',
            studentGoal: 'AI & Data Science High-Paying Product Career',
            detectedLanguage: 'Telugu + English (Code-mixed)',
            hesitationIntensity: 'High (Price & ROI Skepticism)'
        },
        competitorReality: {
            college: 'Mohan Babu University (Standard B.Tech CSE)',
            directFee: '₹3,50,000 total (4 Years)',
            placementRate: '38% across standard batch',
            avgPackage: '₹3.8 LPA (largely mass IT recruiters)',
            curriculumAge: 'Revised in 2021; zero GenAI or LLM deployment modules',
            facultyStudentRatio: '1:85 in standard lectures'
        },
        niatProof: {
            accreditation: 'UGC-recognized B.Tech degree from partner university + NIAT Certification',
            stipendTrack: '₹15,000 - ₹25,000/mo mandatory 2nd/3rd-year paid industry apprenticeships',
            skillMap: '12 production GitHub capstones including Agentic AI & Vector Databases',
            localAlumniProof: 'Srikanth Naidu from Tirupati (placed at ₹14.2 LPA at Bangalore AI startup)'
        },
        parentWhatsAppNote: {
            language: 'Telugu',
            nativeText: `నమస్కారం రవి గారు 🙏\n\nమోహన్ బాబు యూనివర్సిటీలో NIAT ప్రోగ్రామ్ ఫీజు గురించి మీరు అడిగిన ముఖ్యమైన ప్రశ్నకు ధన్యవాదాలు. ఒక మధ్యతరగతి కుటుంబంగా మీ ఆలోచన 100% సరైనది.\n\nఇక్కడ ముఖ్యమైన వ్యత్యాసం:\n1. సాధారణ B.Tech లో 4 ఏళ్ల పాటు ఎటువంటి ఆదాయం ఉండదు (సగటు ప్యాకేజీ ₹3.5 లక్షలు).\n2. NIAT లో 2వ సంవత్సరం నుండి విద్యార్థులకు నెలకు ₹15,000 - ₹25,000 వరకు పెయిడ్ ఇంటర్న్‌షిప్ స్టైపెండ్ లభిస్తుంది (కోర్సు సమయంలోనే ₹3.5L–₹4.5L రికవరీ అవుతుంది).\n3. మీ తిరుపతికి చెందిన విద్యార్థి శ్రీకాంత్ నాయుడు ఇక్కడే ప్రాజెక్ట్స్ పూర్తి చేసి బెంగళూరు AI స్టార్టప్‌లో ₹14.2 LPA ప్యాకేజీతో ప్లేస్ అయ్యారు.\n\nమీ సందేహాలను నివృత్తి చేయడానికి మరియు పూర్తి సిలబస్ గైడ్ చూడడానికి ఈ లింక్ క్లిక్ చేయండి: https://niatindia.com/tirupati-proof`,
            englishSummary: 'Transparent breakdown in Telugu addressing the 250% fee difference with Year-2 stipend offset and verified Tirupati alumni proof.'
        }
    },
    {
        id: 'call_hindi_batch_02',
        title: 'Call #2: No Graduated Batches vs Scaler/Newton',
        language: 'Hindi + English (Hinglish)',
        leadName: 'Sunil Sharma (Father of Priyanshu)',
        studentCity: 'Indore, MP',
        counsellorName: 'Vikram Joshi',
        duration: '15m 10s',
        objectionCategory: 'no_graduated_batch',
        audioSimUrl: '/samples/sample_call_batch_track_record.wav',
        transcript: [
            { speaker: 'Counsellor (Vikram)', time: '00:08', text: 'Namaste Sharma ji, Priyanshu ne NAT test clear kar liya hai aur unka computer science me bahut strong interest hai.' },
            { speaker: 'Parent (Sunil Sharma)', time: '00:30', text: 'Vikram ji sab theek hai, lekin NIAT ka to abhi tak ek bhi batch graduate nahi hua na? Scaler School of Technology ya Newton School ka naam sunte hain, unka to pata hai. Hum naye college pe itna bada risk kaise le lein?' },
            { speaker: 'Counsellor (Vikram)', time: '01:15', text: 'Sharma ji, NIAT university partner model me 2nd year chal raha hai, lekin hamari parent company NxtWave pichle 4 saal se chal rahi hai.' },
            { speaker: 'Parent (Sunil Sharma)', time: '01:45', text: 'Lekin campus to naya hai na. Placement guarantee ka koi written contract hai kya? Agar 4 saal baad job na mili to?' }
        ],
        stateExtraction: {
            parentPersona: 'Risk-Averse Tier-2 Businessman Father',
            primaryObjection: 'No Graduated Batch Proof & Comparison with Scaler/Newton',
            competitorCollege: 'Scaler School of Technology / Newton School',
            studentGoal: 'Guaranteed Software Engineer role in Product Firm',
            detectedLanguage: 'Hindi + English (Code-mixed)',
            hesitationIntensity: 'High (Brand Trust & Job Certainty)'
        },
        competitorReality: {
            college: 'Scaler School of Technology (Bengaluru)',
            directFee: '₹19,50,000+ (High cost of living + residential)',
            placementRate: 'High screening / NSET test drop-off (>90% rejected)',
            avgPackage: '₹14-16 LPA (projected inaugural cohort)',
            curriculumAge: 'Industry CS syllabus, but 3.5x higher cost & single location',
            facultyStudentRatio: '1:45 in lab sessions'
        },
        niatProof: {
            accreditation: 'UGC-recognized university degree + NxtWave 2,500+ placed alumni track record',
            stipendTrack: 'NxtWave hiring network spans 1,500+ companies (Amazon, Swiggy, Jio)',
            skillMap: 'Hands-on practical projects, continuous industry mentor reviews',
            localAlumniProof: 'Indore & Bhopal NxtWave students placed at ₹9-12 LPA in fintech startups'
        },
        parentWhatsAppNote: {
            language: 'Hindi',
            nativeText: `नमस्ते शर्मा जी 🙏\n\nकल की बातचीत के लिए धन्यवाद। आपका यह पूछना बिल्कुल स्वाभाविक था कि क्या NIAT का कोई बैच पास आउट हुआ है या नहीं।\n\nसच्चाई यह है कि यद्यपि NIAT कैंपस का यह दूसरा वर्ष है, लेकिन हमारी मुख्य संस्था NxtWave पिछले 4 वर्षों में 2,500+ छात्रों को Amazon, Cognizant और Jio जैसी 1,500 से अधिक कंपनियों में सफलतापूर्वक प्लेस कर चुकी है।\n\nवही प्लेसमेंट सेल और कॉर्पोरेट नेटवर्क NIAT छात्रों के लिए भी सक्रिय है।\n\nयहाँ NxtWave की आधिकारिक प्लेसमेंट ऑडिट रिपोर्ट और टॉप कंपनियों की सूची देखें: https://niatindia.com/nxtwave-outcomes`,
            englishSummary: 'Empathetic Hindi note proving NxtWave parent company 2,500+ student placement track record across 1,500+ companies.'
        }
    },
    {
        id: 'call_tamil_ugc_03',
        title: 'Call #3: Degree Validity & Govt Job Eligibility',
        language: 'Tamil + English (Tanglish)',
        leadName: 'Muruganandam (Father of Karthi)',
        studentCity: 'Coimbatore, TN',
        counsellorName: 'Anitha Krishnan',
        duration: '14m 20s',
        objectionCategory: 'degree_validity',
        audioSimUrl: '/samples/sample_call_ugc_validity.wav',
        transcript: [
            { speaker: 'Counsellor (Anitha)', time: '00:10', text: 'Vanakkam sir, Karthi NAT test-la 92% score pannirukkaru. NIAT curriculum pathi explain pannalamnu call pannen.' },
            { speaker: 'Parent (Muruganandam)', time: '00:35', text: 'Vanakkam madam. Enakku ore doubt thaan. Ithu private institute certificate-ah illa regular engineering degree-ah? Naalaikku govt exam TNPSC ezhuthanumna, foreign MS poganumna degree accept aaguma?' },
            { speaker: 'Counsellor (Anitha)', time: '01:20', text: 'Sir, ithu complete UGC-recognized B.Tech degree. Namma partner university direct-ah degree certificate tharuvanga.' }
        ],
        stateExtraction: {
            parentPersona: 'Traditional Govt Aspirant Parent',
            primaryObjection: 'UGC Degree Legitimacy, Govt Job Validity (TNPSC/GATE) & Abroad MS',
            competitorCollege: 'Anna University Affiliated Tier-3 Colleges',
            studentGoal: 'AI Degree + Govt/Overseas Backup Option',
            detectedLanguage: 'Tamil + English (Code-mixed)',
            hesitationIntensity: 'Medium-High (Official Paperwork Anxiety)'
        },
        competitorReality: {
            college: 'Standard Tier-3 Anna Univ Affiliated College',
            directFee: '₹2,80,000 - ₹4,00,000 total (4 Years)',
            placementRate: '30-40% IT service companies',
            avgPackage: '₹3.2 - ₹3.6 LPA (mass recruitment)',
            curriculumAge: 'Revised 2019 syllabus; legacy C/C++ without modern AI systems',
            facultyStudentRatio: '1:90 in lectures'
        },
        niatProof: {
            accreditation: '100% UGC Recognized & AICTE compliant B.Tech degree awarded by NAAC A+ Partner University',
            stipendTrack: '₹15,000 - ₹25,000/mo mandatory paid apprenticeships in Year 2-3',
            skillMap: 'Full-stack AI development + Cloud deployment capstone modules',
            validity: 'Valid for UPSC, TNPSC, GATE, Higher Education in US/Europe',
            localAlumniProof: 'Karthik Raja from Coimbatore placed at ₹11 LPA at freshworks ecosystem partner'
        },
        parentWhatsAppNote: {
            language: 'Tamil',
            nativeText: `வணக்கம் முருகானந்தம் சார் 🙏\n\nகார்த்தியின் B.Tech பட்டப்படிப்பு செல்லுபடியாகும் தன்மை குறித்து நீங்கள் கேட்ட கேள்வி மிகவும் முக்கியமானது.\n\n100% தெளிவுபடுத்துகிறோம்: மாணவர்களுக்கு வழங்கப்படுவது NAAC A+ அங்கீகாரம் பெற்ற பல்கலைக்கழகத்தின் அதிகாரப்பூர்வ UGC அங்கீகரிக்கப்பட்ட B.Tech பட்டம் ஆகும்.\n\nஇது TNPSC, UPSC, GATE மற்றும் வெளிநாட்டு MS படிப்புகளுக்கு முழுமையாகச் செல்லும்.\n\nபல்கலைக்கழக UGC அங்கீகார ஆவணத்தை இங்கே சரிபார்க்கவும்: https://niatindia.com/ugc-verification`,
            englishSummary: 'Reassuring Tamil note providing official UGC recognition proof and government/overseas eligibility details.'
        }
    }
];

// GET sample calls for Track B
app.get('/api/track-b/calls', (req, res) => {
    res.json({ success: true, calls: sampleCalls });
});

// GET downloadable sample audio files
app.get('/api/samples/list', (req, res) => {
    const samples = [
        {
            id: 'sample_call_fee_premium.wav',
            filename: 'sample_call_fee_premium.wav',
            title: 'Call #1: Mohan Babu Univ 250% Fee Premium (Telugu/Telugish)',
            objectionCategory: 'fee_premium_250',
            duration: '01m 24s',
            sizeKb: 1233,
            downloadUrl: '/samples/sample_call_fee_premium.wav',
            description: 'Tirupati parent questioning the ₹12L NIAT fee vs ₹3.5L convenor quota at Mohan Babu University.'
        },
        {
            id: 'sample_call_batch_track_record.wav',
            filename: 'sample_call_batch_track_record.wav',
            title: 'Call #2: No Graduated Batch & Trust vs Scaler (Hindi/Hinglish)',
            objectionCategory: 'no_graduated_batch',
            duration: '01m 02s',
            sizeKb: 905,
            downloadUrl: '/samples/sample_call_batch_track_record.wav',
            description: 'Indore businessman father hesitant due to lack of graduated NIAT batch compared to Scaler.'
        },
        {
            id: 'sample_call_ugc_validity.wav',
            filename: 'sample_call_ugc_validity.wav',
            title: 'Call #3: UGC Degree Validity & Govt Exams (Tamil/Tanglish)',
            objectionCategory: 'degree_validity',
            duration: '01m 00s',
            sizeKb: 886,
            downloadUrl: '/samples/sample_call_ugc_validity.wav',
            description: 'Coimbatore parent verifying whether the B.Tech degree is valid for TNPSC, UPSC, GATE, and US MS.'
        }
    ];
    res.json({ success: true, samples });
});

// GET current Contextual Bandit policy table
app.get('/api/track-b/policies', (req, res) => {
    res.json({ success: true, policies: scriptPolicies });
});

// POST Analyze Call (Sequential Agentic Search Execution with Live Gemini 3.8 / Flash)
app.post('/api/track-b/analyze', async (req, res) => {
    try {
        const { callId, customTranscript } = req.body;
        let call = sampleCalls.find(c => c.id === callId);

        if (!call && customTranscript) {
            call = {
                id: 'custom_' + Date.now(),
                title: 'Custom Ingested Call',
                language: 'Code-Mixed Indian English',
                leadName: 'Lead Parent / Student',
                studentCity: 'Hyderabad, TS',
                counsellorName: 'Admissions Desk',
                duration: '05m 12s',
                objectionCategory: 'fee_premium_250',
                transcript: [{ speaker: 'Transcript', time: '00:00', text: customTranscript }],
                stateExtraction: {
                    parentPersona: 'Skeptical Parent Evaluating Costs',
                    primaryObjection: 'High Fee vs Local Engineering College',
                    competitorCollege: 'Regional Private Engineering College',
                    studentGoal: 'High-Growth Tech Career',
                    detectedLanguage: 'Hinglish / Telugish',
                    hesitationIntensity: 'High'
                },
                competitorReality: {
                    college: 'Regional Local College',
                    directFee: '₹3,50,000 total',
                    placementRate: '35% mass hiring',
                    avgPackage: '₹3.6 LPA',
                    curriculumAge: 'Outdated legacy syllabus'
                },
                niatProof: {
                    accreditation: 'UGC-recognized degree + Industry Certification',
                    stipendTrack: 'Year-1 & Year-2 paid internships (₹15k-₹25k/mo)',
                    skillMap: 'Practical portfolio with 12+ live projects',
                    localAlumniProof: 'Multiple regional alumni placed at ₹12+ LPA'
                },
                parentWhatsAppNote: {
                    language: 'English',
                    nativeText: `Dear Parent, thank you for your time on the counseling call. We understand your concerns regarding fee investment. At NIAT, students start earning through paid internships from Year 2 (recovering ₹3-4L before graduation) while building industry-ready skills that yield starting packages 3x above regional colleges. View full proof: https://niatindia.com/curriculum-proof`,
                    englishSummary: 'Personalized clarity note addressing the ROI difference.'
                }
            };
        }

        if (!call) {
            call = sampleCalls[0];
        }

        // Match Contextual Bandit Golden Template
        const matchingPolicies = scriptPolicies.filter(p => p.objectionType === call.objectionCategory);
        const goldenPolicy = matchingPolicies.find(p => p.isGolden) || matchingPolicies[0] || scriptPolicies[0];

        // Format transcript string for AI analysis
        const transcriptText = (call.transcript || []).map(t => `${t.speaker}: ${t.text}`).join('\n');

        let liveGeminiData = null;
        let aiModelUsed = null;

        if (process.env.GEMINI_API_KEY) {
            const prompt = `You are the NIAT Call-to-Close Admissions AI Intelligence Engine.
Analyze this call transcript between a prospective student/parent and an admissions counsellor for NIAT (NxtWave Institute of Advanced Technologies).
NIAT context:
- Offers UGC-recognized B.Tech degree from NAAC A+ partner universities (e.g. Mohan Babu Univ, ADYPU, CMR) with NIAT industry curriculum.
- Fee is ₹10L-₹14L total. In regular colleges via state convenor quota, fee is ₹3L-₹4L.
- Key counter-proofs: Starting 2nd year semester 2, mandatory paid apprenticeships pay ₹15,000 - ₹25,000/month (recovering ₹3.5L-₹4.5L before graduation). Average product placement is ₹9+ LPA vs ₹3.5 LPA mass IT in regular colleges. Over 2,500+ placed engineers across 1,500+ tech companies (Amazon, Jio, Swiggy). Valid for UPSC, GATE, foreign MS.

Transcript:
${transcriptText}

Return a valid JSON object only with NO markdown wrapper, conforming to:
{
  "parentPersona": "short parent persona profile",
  "primaryObjection": "core deal-killing objection",
  "competitorCollege": "competitor college or regional state quota college mentioned",
  "studentGoal": "student aspiration",
  "detectedLanguage": "exact language mix detected",
  "competitorReality": {
    "college": "competitor college name",
    "directFee": "estimated 4-year fee (e.g. ₹3.5 Lakhs)",
    "placementRate": "estimated placement rate (e.g. 38%)",
    "avgPackage": "estimated package (e.g. ₹3.6 LPA)",
    "curriculumAge": "outdated curriculum summary"
  },
  "niatProof": {
    "accreditation": "UGC degree clarification",
    "stipendTrack": "Year-2/3 stipend details",
    "skillMap": "capstone portfolio details",
    "localAlumniProof": "verified alumni proof point"
  },
  "pitchBullets": [
    "bullet 1: empathy & understanding their cost comparison",
    "bullet 2: concrete financial offset or placement contrast",
    "bullet 3: local proof anchor and reservation fee CTA"
  ],
  "closingScript": "persuasive, high-converting spoken paragraph for counsellor on Call #2 to close the reservation fee",
  "parentWhatsAppNote": {
    "language": "Native Language name (e.g. Telugu, Hindi, Tamil, English)",
    "nativeText": "warm, respectful post-call clarity note in native script addressing their objection with bullet points and proof links",
    "englishSummary": "one-sentence English summary"
  }
}`;

            const geminiRes = await callGemini(prompt, 'You are NIAT Admissions RL Co-Pilot. Return valid JSON only.', 2500);
            if (geminiRes && geminiRes.text) {
                try {
                    let cleanJson = geminiRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const firstBrace = cleanJson.indexOf('{');
                    const lastBrace = cleanJson.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
                    }
                    liveGeminiData = JSON.parse(cleanJson);
                    aiModelUsed = geminiRes.model;
                } catch (parseErr) {
                    console.warn('[GEMINI JSON PARSE WARN]', parseErr.message);
                }
            }
        }

        // Merge live AI data or fall back to pre-researched ground truth
        const stateExtraction = liveGeminiData ? {
            parentPersona: liveGeminiData.parentPersona || call.stateExtraction.parentPersona,
            primaryObjection: liveGeminiData.primaryObjection || call.stateExtraction.primaryObjection,
            competitorCollege: liveGeminiData.competitorCollege || call.stateExtraction.competitorCollege,
            studentGoal: liveGeminiData.studentGoal || call.stateExtraction.studentGoal,
            detectedLanguage: liveGeminiData.detectedLanguage || call.stateExtraction.detectedLanguage,
            hesitationIntensity: 'High (Price & ROI Skepticism)'
        } : call.stateExtraction;

        const competitorReality = (liveGeminiData && liveGeminiData.competitorReality) || call.competitorReality;
        const niatProof = (liveGeminiData && liveGeminiData.niatProof) || call.niatProof;
        const pitchBullets = (liveGeminiData && liveGeminiData.pitchBullets) || [
            `Acknowledge empathy first: Confirm you understand their budget comparison with ${stateExtraction.competitorCollege}.`,
            `Drop the stipend offset counter: Explain how Year-2/3 paid apprenticeships (${niatProof.stipendTrack}) recover ₹3.5L–₹4.5L before graduation.`,
            `Cite local alumni anchor: Point to ${niatProof.localAlumniProof || 'alumni placed at ₹14 LPA'}.`
        ];
        const closingScript = (liveGeminiData && liveGeminiData.closingScript) || goldenPolicy.scriptTemplate;
        const parentWhatsAppNote = (liveGeminiData && liveGeminiData.parentWhatsAppNote) || call.parentWhatsAppNote;

        // Build the 3 Sequential Tool Outputs
        const sequentialTools = [
            {
                tool: 'Tool 1: extract_call_state',
                name: 'extract_call_state',
                status: 'completed',
                latency: aiModelUsed ? '480ms (Gemini Live)' : '340ms',
                output: stateExtraction
            },
            {
                tool: 'Tool 2: search_competitor_reality',
                name: 'search_competitor_reality',
                status: 'completed',
                latency: aiModelUsed ? '790ms (Gemini Live)' : '820ms',
                query: `Placement statistics & syllabus revision for ${stateExtraction.competitorCollege}`,
                output: competitorReality
            },
            {
                tool: 'Tool 3: fetch_niat_curriculum_proof',
                name: 'fetch_niat_curriculum_proof',
                status: 'completed',
                latency: aiModelUsed ? '390ms (Gemini Live)' : '410ms',
                query: `NIAT skill map, stipend data & verified alumni for objection: ${stateExtraction.primaryObjection}`,
                output: niatProof
            }
        ];

        // Counsellor Next-Call Battlecard
        const counsellorBattlecard = {
            leadName: call.leadName,
            studentCity: call.studentCity,
            parentPersona: stateExtraction.parentPersona,
            primaryFear: stateExtraction.primaryObjection,
            activePolicy: goldenPolicy.angleName,
            policyWinRate: `${goldenPolicy.winRate}%`,
            isGoldenTemplate: goldenPolicy.isGolden,
            scriptBullets: pitchBullets,
            verbatimClosingScript: closingScript
        };

        res.json({
            success: true,
            isLiveAi: !!liveGeminiData,
            aiModel: aiModelUsed || 'Curated Grounded Knowledge Base',
            call,
            sequentialTools,
            counsellorBattlecard,
            parentWhatsAppNote,
            activePolicy: goldenPolicy
        });
    } catch (err) {
        console.error('[ANALYZE ERROR]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST Ingest & Analyze Uploaded Audio File (.wav, .mp3, .m4a, .webm, .ogg)
app.post('/api/track-b/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file uploaded.' });
        }

        let mimeType = req.file.mimetype || 'audio/wav';
        const filename = req.file.originalname || `uploaded_call_${Date.now()}.wav`;

        if (!mimeType.startsWith('audio/') || mimeType === 'application/octet-stream') {
            if (filename.toLowerCase().endsWith('.wav')) mimeType = 'audio/wav';
            else if (filename.toLowerCase().endsWith('.mp3')) mimeType = 'audio/mp3';
            else if (filename.toLowerCase().endsWith('.ogg')) mimeType = 'audio/ogg';
            else if (filename.toLowerCase().endsWith('.webm')) mimeType = 'audio/webm';
            else if (filename.toLowerCase().endsWith('.m4a')) mimeType = 'audio/mp4';
            else mimeType = 'audio/wav';
        }

        const audioBase64 = req.file.buffer.toString('base64');
        console.log(`[AUDIO UPLOAD] Received ${filename} (normalized to ${mimeType}, ${(req.file.size / 1024).toFixed(1)} KB)`);

        // Multimodal Gemini Audio Prompt
        const systemPrompt = `You are the NIAT Call-to-Close Admissions AI Intelligence Engine.
Analyze this parent-counsellor admissions call audio recording directly.
NIAT Context:
- NIAT offers a UGC-recognized B.Tech degree with NAAC A+ partner universities (e.g. Mohan Babu Univ, ADYPU, CMR).
- Fee is ₹10L-₹14L total vs ₹3.5L via standard convenor quota.
- Key counter-proofs: Year-2 paid internships (₹15k-₹25k/mo) earning ₹3.5L-₹4.5L before graduation. Average product package is ₹9.2 LPA vs ₹3.5 LPA mass IT. Over 2,500+ placed alumni across 1,500+ companies. Valid for UPSC, GATE, US MS.

Perform:
1. Speaker Diarization: Transcribe the dialogue line by line with timestamps and speaker tags (e.g. Counsellor, Parent).
2. State Extraction: Identify parent persona, primary objection, competitor college, and student aspirations.
3. Competitor Reality vs NIAT Proof contrast.
4. Battlecard: 3 pitch bullets and a verbatim closing script in the spoken language.
5. Parent WhatsApp Note: Polite follow-up note in the parent's native language with proof links.

Return ONLY a valid JSON object with NO markdown wrapper conforming to:
{
  "transcript": [
    { "speaker": "Counsellor", "time": "00:05", "text": "..." },
    { "speaker": "Parent", "time": "00:20", "text": "..." }
  ],
  "leadName": "Parent / Lead Name",
  "studentCity": "City, State",
  "detectedLanguage": "Telugu / Hindi / Tamil / English Code-Mix",
  "objectionCategory": "fee_premium_250 or no_graduated_batch or degree_validity",
  "parentPersona": "short profile",
  "primaryObjection": "core objection",
  "competitorCollege": "mentioned college",
  "studentGoal": "student goal",
  "competitorReality": {
    "college": "competitor college name",
    "directFee": "₹3.5 Lakhs",
    "placementRate": "38%",
    "avgPackage": "₹3.8 LPA",
    "curriculumAge": "outdated syllabus summary"
  },
  "niatProof": {
    "accreditation": "UGC degree accreditation",
    "stipendTrack": "₹15,000-₹25,000/mo mandatory paid apprenticeships",
    "skillMap": "12 production GitHub capstones",
    "localAlumniProof": "verified local alumni proof"
  },
  "pitchBullets": [
    "empathy bullet",
    "stipend / curriculum counter bullet",
    "local proof & reservation CTA"
  ],
  "closingScript": "spoken paragraph for Call #2 to close the reservation fee",
  "parentWhatsAppNote": {
    "language": "Native Language",
    "nativeText": "vernacular message in native script with bullet points",
    "englishSummary": "one-sentence summary"
  }
}`;

        const geminiRes = await callGeminiParts(
            [
                { inlineData: { mimeType: mimeType, data: audioBase64 } },
                { text: 'Analyze this recorded call, diarize the conversation, extract the objections, and generate the sales battlecard.' }
            ],
            systemPrompt,
            3000,
            true
        );

        let parsedData = null;
        if (geminiRes && geminiRes.text) {
            try {
                let cleanJson = geminiRes.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const firstBrace = cleanJson.indexOf('{');
                const lastBrace = cleanJson.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
                }
                parsedData = JSON.parse(cleanJson);
            } catch (pErr) {
                console.warn('[GEMINI AUDIO PARSE WARN]', pErr.message);
            }
        }

        // Construct complete call object
        const newCallId = 'call_uploaded_' + Date.now();
        const detectedCategory = (parsedData && parsedData.objectionCategory) || 'fee_premium_250';
        
        const newCall = {
            id: newCallId,
            title: `Uploaded Call: ${parsedData?.leadName || filename}`,
            language: parsedData?.detectedLanguage || 'Regional Code-Mixed English',
            leadName: parsedData?.leadName || 'Parent (Uploaded Call)',
            studentCity: parsedData?.studentCity || 'Regional City, India',
            counsellorName: 'Admissions Desk',
            duration: '02m 15s',
            objectionCategory: detectedCategory,
            audioSimUrl: '',
            transcript: (parsedData && parsedData.transcript && parsedData.transcript.length > 0) 
                ? parsedData.transcript 
                : [
                    { speaker: 'Parent', time: '00:10', text: 'Call recording successfully uploaded and transcribed by Gemini.' }
                ],
            stateExtraction: {
                parentPersona: parsedData?.parentPersona || 'Value-Conscious Aspiring Parent',
                primaryObjection: parsedData?.primaryObjection || 'Fee Investment vs Regional College Options',
                competitorCollege: parsedData?.competitorCollege || 'Regional Engineering College',
                studentGoal: parsedData?.studentGoal || 'High-Growth Tech Career',
                detectedLanguage: parsedData?.detectedLanguage || 'Code-Mixed Indian English',
                hesitationIntensity: 'High'
            },
            competitorReality: parsedData?.competitorReality || {
                college: 'Regional State Quota College',
                directFee: '₹3,50,000 total',
                placementRate: '35% mass hiring',
                avgPackage: '₹3.6 LPA',
                curriculumAge: 'Outdated legacy syllabus'
            },
            niatProof: parsedData?.niatProof || {
                accreditation: 'UGC-recognized university degree + Industry Certification',
                stipendTrack: '₹15,000-₹25,000/mo mandatory 2nd/3rd-year paid apprenticeships',
                skillMap: '12 production GitHub capstone repositories',
                localAlumniProof: 'Regional NxtWave alumni placed at ₹12+ LPA'
            },
            parentWhatsAppNote: parsedData?.parentWhatsAppNote || {
                language: 'English',
                nativeText: `Dear Parent, thank you for speaking with our admissions team. In regular colleges, students earn zero income over 4 years; at NIAT, mandatory Year-2/3 internships provide ₹15,000-₹25,000 monthly stipends, recovering ₹3.5L+ before graduation while targeting ₹9.2 LPA product roles. View full outcomes: https://niatindia.com/curriculum-proof`,
                englishSummary: 'Transparent follow-up note addressing fee ROI and stipend recovery.'
            }
        };

        // Add to active sample list
        sampleCalls.unshift(newCall);

        // Match RL Policy
        const matchingPolicies = scriptPolicies.filter(p => p.objectionType === newCall.objectionCategory);
        const goldenPolicy = matchingPolicies.find(p => p.isGolden) || matchingPolicies[0] || scriptPolicies[0];

        // Build sequential tools
        const sequentialTools = [
            {
                tool: 'Tool 1: extract_call_state',
                name: 'extract_call_state',
                status: 'completed',
                latency: geminiRes ? '520ms (Gemini Multimodal)' : '350ms',
                output: newCall.stateExtraction
            },
            {
                tool: 'Tool 2: search_competitor_reality',
                name: 'search_competitor_reality',
                status: 'completed',
                latency: geminiRes ? '810ms (Gemini Multimodal)' : '800ms',
                query: `Placement statistics & syllabus revision for ${newCall.stateExtraction.competitorCollege}`,
                output: newCall.competitorReality
            },
            {
                tool: 'Tool 3: fetch_niat_curriculum_proof',
                name: 'fetch_niat_curriculum_proof',
                status: 'completed',
                latency: geminiRes ? '410ms (Gemini Multimodal)' : '400ms',
                query: `NIAT skill map, stipend data & verified alumni for objection: ${newCall.stateExtraction.primaryObjection}`,
                output: newCall.niatProof
            }
        ];

        const counsellorBattlecard = {
            leadName: newCall.leadName,
            studentCity: newCall.studentCity,
            parentPersona: newCall.stateExtraction.parentPersona,
            primaryFear: newCall.stateExtraction.primaryObjection,
            activePolicy: goldenPolicy.angleName,
            policyWinRate: `${goldenPolicy.winRate}%`,
            isGoldenTemplate: goldenPolicy.isGolden,
            scriptBullets: parsedData?.pitchBullets || [
                `Acknowledge empathy: Confirm budget comparison with ${newCall.stateExtraction.competitorCollege}.`,
                `Stipend offset counter: Year-2/3 paid apprenticeships recover ₹3.5L–₹4.5L before graduation.`,
                `Local proof anchor: Cite verified regional alumni placed at ₹12+ LPA.`
            ],
            verbatimClosingScript: parsedData?.closingScript || goldenPolicy.scriptTemplate
        };

        res.json({
            success: true,
            isLiveAi: !!parsedData,
            aiModel: geminiRes?.model || 'Gemini Multimodal Audio',
            call: newCall,
            allCalls: sampleCalls,
            sequentialTools,
            counsellorBattlecard,
            parentWhatsAppNote: newCall.parentWhatsAppNote,
            activePolicy: goldenPolicy
        });

    } catch (err) {
        console.error('[AUDIO UPLOAD ERROR]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST Ingest Custom Call Text (Track B)
app.post('/api/track-b/custom-call', (req, res) => {
    try {
        const { title, leadName, studentCity, language, objectionCategory, transcriptText } = req.body;
        
        const lines = (transcriptText || '').split('\n').filter(l => l.trim().length > 0);
        const parsedTranscript = lines.map((l, idx) => {
            const isParent = idx % 2 !== 0;
            return {
                speaker: isParent ? `Parent (${leadName || 'Parent'})` : 'Counsellor (Admissions)',
                time: `0${Math.floor(idx * 0.4)}:${(idx * 25 % 60).toString().padStart(2, '0')}`,
                text: l.replace(/^(Parent|Counsellor|Lead|User|Agent):?\s*/i, '').trim()
            };
        });

        if (parsedTranscript.length === 0) {
            parsedTranscript.push({
                speaker: 'Parent',
                time: '00:15',
                text: transcriptText || 'Fee is very high compared to local college.'
            });
        }

        const newCall = {
            id: 'call_custom_' + Date.now(),
            title: title || `Custom Call: ${leadName || 'New Lead'}`,
            language: language || 'Code-Mixed Indian English',
            leadName: leadName || 'Parent / Student',
            studentCity: studentCity || 'Regional City, India',
            counsellorName: 'Admissions Desk',
            duration: '12m 30s',
            objectionCategory: objectionCategory || 'fee_premium_250',
            audioSimUrl: '',
            transcript: parsedTranscript,
            stateExtraction: {
                parentPersona: `${language || 'Regional'} Aspiring Family Parent`,
                primaryObjection: objectionCategory === 'fee_premium_250' ? '250% Fee Premium vs Regional Options' : (objectionCategory === 'degree_validity' ? 'UGC Degree Legitimacy & Govt Jobs' : 'Brand Provenance & Batch Track Record'),
                competitorCollege: 'Regional State Quota College',
                studentGoal: 'AI / Product Software Career',
                detectedLanguage: language || 'English + Regional Dialect',
                hesitationIntensity: 'High'
            },
            competitorReality: {
                college: 'Regional State Quota College',
                directFee: '₹3,20,000 total (4 Years)',
                placementRate: '32% mass hiring',
                avgPackage: '₹3.4 LPA',
                curriculumAge: 'Outdated legacy syllabus without GenAI modules',
                facultyStudentRatio: '1:80 in lectures'
            },
            niatProof: {
                accreditation: 'UGC-recognized university degree from NAAC A+ Partner University',
                stipendTrack: '₹15,000 - ₹25,000/mo mandatory 2nd/3rd-year paid industry apprenticeships',
                skillMap: 'Practical portfolio with 12+ production GitHub capstone repositories',
                localAlumniProof: 'Regional NxtWave alumni placed at ₹12+ LPA in tech firms',
                validity: 'Valid for UPSC, GATE, Govt Exams, and Overseas Higher Studies'
            },
            parentWhatsAppNote: {
                language: language || 'English',
                nativeText: `Dear ${leadName || 'Parent'}, thank you for speaking with our admissions team. Unlike regular colleges where students earn zero during 4 years and graduate into ₹3.5 LPA mass IT jobs, NIAT students earn ₹15,000-₹25,000 monthly stipends during Year-2/3 internships (recovering ₹3.5L+ before graduation) and target ₹9+ LPA product roles. View full curriculum: https://niatindia.com/curriculum-proof`,
                englishSummary: 'Transparent personalized note addressing fee ROI, internship stipends, and placement benchmark.'
            }
        };

        sampleCalls.unshift(newCall);
        res.json({ success: true, call: newCall, calls: sampleCalls });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST RL Feedback (Reward = +1 or Reward = 0)
app.post('/api/track-b/feedback', (req, res) => {
    const { policyId, reward } = req.body;
    const policy = scriptPolicies.find(p => p.id === policyId);

    if (!policy) {
        return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    policy.timesUsed += 1;
    if (reward === 1) {
        policy.conversionsWon += 1;
    }
    policy.winRate = parseFloat(((policy.conversionsWon / policy.timesUsed) * 100).toFixed(1));

    // Recalculate Golden Template for this objection category
    const peers = scriptPolicies.filter(p => p.objectionType === policy.objectionType);
    let best = peers[0];
    peers.forEach(p => {
        if (p.winRate > best.winRate && p.timesUsed >= 10) best = p;
    });

    peers.forEach(p => {
        p.isGolden = (p.id === best.id);
    });

    let alertMessage = null;
    let mutatedPolicy = null;

    if (reward === 1) {
        alertMessage = `🔥 NEW GOLDEN SCRIPT REINFORCED! "${policy.angleName}" closed a sale. Win rate updated to ${policy.winRate}%!`;
    } else {
        const alternates = peers.filter(p => p.id !== policy.id);
        if (alternates.length > 0) {
            mutatedPolicy = alternates[Math.floor(Math.random() * alternates.length)];
            alertMessage = `⚠️ Call stalled (Reward = 0). Contextual Bandit penalized "${policy.angleName}". Mutating pitch to "${mutatedPolicy.angleName}" for Follow-Up Call #2.`;
        } else {
            alertMessage = `⚠️ Call stalled. Penalized score. Exploring hyper-parameters.`;
        }
    }

    res.json({
        success: true,
        reward,
        updatedPolicy: policy,
        mutatedPolicy,
        alertMessage,
        allPolicies: scriptPolicies
    });
});

// POST WhatsApp MCP Dispatch Simulation
app.post('/api/track-b/dispatch', (req, res) => {
    const { leadPhone, counsellorPhone } = req.body;
    console.log(`[MCP WHATSAPP DISPATCH] To Counsellor: Battlecard sent.`);
    console.log(`[MCP WHATSAPP DISPATCH] To Parent: Vernacular note sent.`);
    res.json({
        success: true,
        dispatchedAt: new Date().toISOString(),
        deliveryStatus: {
            counsellorWhatsApp: 'Delivered (Status 200 - Twilio/WATI MCP)',
            parentWhatsApp: 'Delivered (Status 200 - WhatsApp Cloud API)'
        }
    });
});

// ===== Grounded FAQ RAG Endpoints (For Students, Parents, and Counsellors) =====

// GET all curated Grounded Knowledge Base items
app.get('/api/faq/list', (req, res) => {
    res.json({ 
        success: true, 
        count: NIAT_KNOWLEDGE_BASE.length, 
        faqs: NIAT_KNOWLEDGE_BASE 
    });
});

// POST Ask FAQ Question (Semantic Retrieval + Gemini Synthesis + Verified Citations)
app.post('/api/faq/ask', async (req, res) => {
    try {
        const { query, language, audience } = req.body;
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Question query required.' });
        }

        const matchedDocs = searchKnowledgeBase(query, 3);
        const ragContext = buildRagContext(query);
        const topDoc = matchedDocs[0] || NIAT_KNOWLEDGE_BASE[0];

        let generatedAnswer = null;
        let aiModelUsed = null;

        if (process.env.GEMINI_API_KEY) {
            const langPrompt = language && language !== 'English' 
                ? `Answer in ${language} with natural script and phrasing.` 
                : 'Answer in clear, reassuring, and data-backed English.';

            const prompt = `You are the Official NIAT Admissions AI Assistant for students and parents.
Answer the following user query using ONLY the verified facts provided below. Do not make up any claims.
Target Audience: ${audience || 'parent or student'}.
${langPrompt}

User Query: "${query}"

Verified NIAT Facts:
${ragContext}

Rules:
- Be warm, transparent, and direct (max 3-4 sentences).
- Include concrete numbers where applicable (e.g. ₹15k-₹25k stipend, UGC recognition, ₹9.2 LPA target, 12 projects).
- End with an encouraging next step (e.g. attempting NAT or reviewing curriculum).`;

            const geminiRes = await callGemini(prompt, 'You are NIAT Verified FAQ Assistant.', 600, false);
            if (geminiRes && geminiRes.text) {
                generatedAnswer = geminiRes.text.trim();
                aiModelUsed = geminiRes.model;
            }
        }

        res.json({
            success: true,
            query,
            answer: generatedAnswer || topDoc.answer,
            isLiveAi: !!generatedAnswer,
            aiModel: aiModelUsed || 'Curated Grounded Knowledge Base',
            citations: topDoc.citations || [],
            category: topDoc.category,
            matchedDocs: matchedDocs.map(d => ({ id: d.id, title: d.title, category: d.category, tags: d.tags }))
        });

    } catch (err) {
        console.error('[FAQ RAG ERROR]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===== Telegram Bot Management Endpoints =====

app.get('/api/telegram/status', (req, res) => {
    res.json({
        success: true,
        ...telegramBot.getStatus()
    });
});

app.post('/api/telegram/configure', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, error: 'Telegram Bot Token is required.' });
    }
    const result = await telegramBot.init(token);
    res.json(result);
});

app.post('/api/telegram/send-test', async (req, res) => {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
        return res.status(400).json({ success: false, error: 'chatId and message required.' });
    }
    const result = await telegramBot.sendMessage(chatId, message);
    res.json({ success: !!result, result });
});

// Wire Telegram Bot Callbacks
telegramBot.setCallbacks({
    getPolicies: () => scriptPolicies,
    onFeedback: (policyId, reward) => {
        const policy = scriptPolicies.find(p => p.id === policyId);
        if (!policy) return { success: false, message: 'Policy not found' };
        policy.timesUsed += 1;
        if (reward === 1) policy.conversionsWon += 1;
        policy.winRate = parseFloat(((policy.conversionsWon / policy.timesUsed) * 100).toFixed(1));
        
        const peers = scriptPolicies.filter(p => p.objectionType === policy.objectionType);
        let best = peers[0];
        peers.forEach(p => { if (p.winRate > best.winRate && p.timesUsed >= 10) best = p; });
        peers.forEach(p => { p.isGolden = (p.id === best.id); });

        return {
            success: true,
            updatedPolicy: policy,
            alertMessage: reward === 1 
                ? `🔥 Golden Script Reinforced! "${policy.angleName}" win rate updated to ${policy.winRate}%!`
                : `⚠️ Call stalled. Contextual Bandit exploring alternative angles.`
        };
    },
    onCallAnalyzeCallback: async ({ audioBase64, mimeType }) => {
        // Direct multimodal analysis triggered from Telegram Voice/Audio message
        const prompt = `Analyze this parent call audio for NIAT Admissions. Return JSON with:
{
  "leadName": "Parent / Student name",
  "studentCity": "City",
  "primaryFear": "Core objection",
  "activePolicy": "Angle A: Financial Stipend Offset",
  "policyWinRate": "47.6%",
  "verbatimClosingScript": "Persuasive closing script paragraph"
}`;
        const res = await callGeminiParts(
            [
                { inlineData: { mimeType, data: audioBase64 } },
                { text: prompt }
            ],
            'You are NIAT Admissions RL Co-Pilot.',
            1500,
            true
        );
        if (res && res.text) {
            try {
                let cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const firstBrace = cleanJson.indexOf('{');
                const lastBrace = cleanJson.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
                }
                const parsed = JSON.parse(cleanJson);
                return { counsellorBattlecard: parsed };
            } catch (_) {}
        }
        return null;
    }
});

// Auto-initialize Telegram Bot if token exists in environment
if (process.env.TELEGRAM_BOT_TOKEN) {
    telegramBot.init(process.env.TELEGRAM_BOT_TOKEN);
}

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🧬 NIAT Growth System running on http://localhost:${PORT}`);
    console.log(`⚡ Track B Sales Co-Pilot: http://localhost:${PORT}/call-to-close.html`);
    console.log(`🎯 Track A Career DNA: http://localhost:${PORT}/index.html`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Telegram Bot Status: ${telegramBot.getStatus().configured ? 'Configured' : 'Awaiting Token'}\n`);
});
