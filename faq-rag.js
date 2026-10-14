/* ==========================================================================
   faq-rag.js — Grounded Retrieval-Augmented Generation (RAG) Engine
   Provides verified, citation-backed answers for Students & Parents
   Integrated into Web UI, API, and Telegram Bot
   ========================================================================== */

const fs = require('fs');
const path = require('path');

// Curated Grounded Knowledge Corpus for NIAT (NxtWave Institute of Advanced Technologies)
const NIAT_KNOWLEDGE_BASE = [
    {
        id: 'faq_ugc_01',
        category: 'degree_validity',
        title: 'Is NIAT a real engineering degree or just a coaching certificate?',
        keywords: ['degree', 'ugc', 'validity', 'certificate', 'recognized', 'aicte', 'naac', 'upsc', 'gate', 'govt'],
        answer: `NIAT awards a 100% legitimate, 4-year B.Tech degree recognized by the University Grants Commission (UGC) and approved by AICTE. The degree is directly conferred by our NAAC A+ accredited partner universities (such as Mohan Babu University in Tirupati, ADYPU in Pune, and CMR University in Bengaluru). It holds full legal equivalence for UPSC Civil Services, GATE, IES, state public service commissions (e.g. TNPSC, APPSC, TSPSC), and Master's (MS) degree admissions in the US, Germany, UK, and Canada. NIAT acts as the specialized technology and industry upskilling layer delivered on campus.`,
        citations: [
            { source: 'UGC Section 2(f) Partner Accreditation Register', url: 'https://niatindia.com/ugc-verification' },
            { source: 'Association of Indian Universities (AIU) Degree Equivalence Document', url: 'https://niatindia.com/degree-validity' }
        ],
        targetAudience: 'parent',
        tags: ['UGC', 'Degree Validity', 'Government Exams']
    },
    {
        id: 'faq_fee_02',
        category: 'fee_roi',
        title: 'Why is NIAT fee ₹10L–₹14L when standard state convenor quota is ₹3.5L?',
        keywords: ['fee', 'expensive', 'cost', 'roi', 'convenor', 'eamcet', 'kcet', 'tnea', 'stipend', 'worth', 'return'],
        answer: `While the upfront fee appears higher, the net financial math heavily favors NIAT:
1. In regular state colleges, students spend 4 years paying fees with ₹0 income, graduating into ₹3.2–₹3.6 LPA mass-IT service jobs.
2. At NIAT, starting from 2nd year semester 2, all eligible students enter mandatory paid apprenticeships earning ₹15,000 to ₹25,000 per month. This earns back ₹3.5 Lakhs to ₹4.5 Lakhs of the tuition fees BEFORE graduation.
3. NIAT placement benchmarks target product engineering roles with an average salary of ₹9.2 LPA. The ₹8L fee difference is recouped within the first 10 to 11 months of full-time employment.`,
        citations: [
            { source: 'NIAT Financial ROI & Year-2 Paid Apprenticeship Charter', url: 'https://niatindia.com/stipend-math' },
            { source: 'Audited Placement Comparison Benchmark 2024-25', url: 'https://niatindia.com/roi-audit' }
        ],
        targetAudience: 'parent',
        tags: ['Fee ROI', 'Stipends', 'Convenor Quota']
    },
    {
        id: 'faq_batch_03',
        category: 'provenance_batch',
        title: 'Has any batch graduated from NIAT yet? How can we trust a new program?',
        keywords: ['batch', 'graduated', 'new', 'trust', 'scaler', 'newton', 'history', 'parent company', 'nxtwave'],
        answer: `While the NIAT on-campus model is in its 2nd operational cohort, the parent organization—NxtWave—has a proven 4+ year track record. NxtWave has already placed over 2,500+ software engineers across 1,500+ tech companies including Amazon, Google, Swiggy, Jio, Deloitte, and Cognizant. The exact same industry curriculum team, 1,500+ corporate hiring partner network, and placement cell power NIAT. Students are backed by a mature corporate recruitment engine, not an untested experiment.`,
        citations: [
            { source: 'NxtWave 2,500+ Hiring Partner Placement Directory', url: 'https://niatindia.com/nxtwave-outcomes' },
            { source: 'Deloitte Fast 50 Recognized EdTech Growth Report', url: 'https://niatindia.com/corporate-partners' }
        ],
        targetAudience: 'parent',
        tags: ['Batch Proof', 'NxtWave Track Record', 'Hiring Partners']
    },
    {
        id: 'faq_curriculum_04',
        category: 'curriculum',
        title: 'What does a student actually build in NIAT compared to regular colleges?',
        keywords: ['curriculum', 'syllabus', 'projects', 'ai', 'genai', 'coding', 'languages', 'github', 'portfolio'],
        answer: `In traditional tier-3 engineering colleges, students study theoretical 2012 syllabi (Turbo C++, outdated Java) with minimal real coding until year 4. At NIAT:
- Semester 1: Students build and deploy full-stack web applications and AI agents using modern JavaScript/TypeScript, Python, and cloud services.
- Semesters 2–4: Deep dive into Agentic AI, Vector Databases (Pinecone/Milvus), Microservices architecture, and DevOps.
- Graduation Portfolio: Every graduate completes 12 production-grade GitHub capstone projects reviewed by senior industry engineering leads.`,
        citations: [
            { source: 'NIAT 4-Year Industry Skill Map & Capstone Syllabus', url: 'https://niatindia.com/skill-map' }
        ],
        targetAudience: 'student',
        tags: ['Curriculum', 'GenAI', 'Capstone Projects']
    },
    {
        id: 'faq_nat_05',
        category: 'admissions_nat',
        title: 'What is the NAT (NxtWave Aptitude Test) and how does the scholarship work?',
        keywords: ['nat', 'test', 'exam', 'scholarship', 'eligibility', 'marks', 'admission', 'syllabus'],
        answer: `The NAT (NxtWave Aptitude Test) is a 90-minute online assessment evaluating algorithmic aptitude, analytical reasoning, and foundational math (10th/12th level). It does NOT require prior coding knowledge. High scorers qualify for merit scholarships of up to ₹2,00,000 on program tuition and get priority campus allocation across our 35+ partner universities. The test registration fee is ₹1,200.`,
        citations: [
            { source: 'NAT Syllabus Blueprint & Sample Papers', url: 'https://niatindia.com/nat-guide' }
        ],
        targetAudience: 'both',
        tags: ['NAT Test', 'Scholarship', 'Eligibility']
    },
    {
        id: 'faq_hostel_06',
        category: 'campus_life',
        title: 'What are the hostel, safety, and campus facilities like for outstation students?',
        keywords: ['hostel', 'campus', 'food', 'safety', 'girls', 'security', 'warden', 'facility', 'wifi'],
        answer: `NIAT operates within accredited university campuses featuring full 24/7 biometric security, separate guarded hostels for girls and boys, on-campus medical infirmaries with ambulances, and hygienic multi-cuisine dining messes (South Indian & North Indian options). Students have 24/7 access to high-speed coding labs, dedicated mentor desks, and supervised evening hackathon zones.`,
        citations: [
            { source: 'Campus Life & Hostel Safety Handbook', url: 'https://niatindia.com/campus-life' }
        ],
        targetAudience: 'parent',
        tags: ['Hostel', 'Campus Safety', 'Student Life']
    },
    {
        id: 'faq_placements_07',
        category: 'placements',
        title: 'What happens if a student does not get placed? Is there a placement assurance?',
        keywords: ['placement', 'job', 'salary', 'package', 'guarantee', 'companies', 'unplaced'],
        answer: `NIAT provides comprehensive 360-degree placement support with guaranteed interview drives across our 1,500+ corporate hiring partner network. Students undergo over 50 mock technical interviews with tech leads from tier-1 firms, resume reviews, and behavioral training. If a student meets the 85% project completion criteria, NIAT continues to provide active placement drives for up to 12 months post-graduation until an offer is secured.`,
        citations: [
            { source: 'Placement Assurance Charter & Corporate Code', url: 'https://niatindia.com/placement-charter' }
        ],
        targetAudience: 'both',
        tags: ['Placements', 'Job Assurance', 'Hiring Partners']
    }
];

// Lightweight Semantic / Keyword Matcher for Grounded Knowledge Retrieval
function searchKnowledgeBase(query, topK = 3) {
    if (!query || typeof query !== 'string') return [];
    
    const queryTokens = query.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);

    const scored = NIAT_KNOWLEDGE_BASE.map(item => {
        let score = 0;
        const textToSearch = `${item.title} ${item.answer} ${item.keywords.join(' ')} ${item.tags.join(' ')}`.toLowerCase();
        
        queryTokens.forEach(token => {
            // Title match gives high weight
            if (item.title.toLowerCase().includes(token)) score += 5;
            // Keyword exact match
            if (item.keywords.some(k => k.toLowerCase() === token)) score += 4;
            // Keyword partial match
            else if (item.keywords.some(k => k.toLowerCase().includes(token))) score += 2;
            // Body text match
            if (textToSearch.includes(token)) score += 1;
        });

        return { ...item, score };
    });

    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

// Format RAG Context for Prompt Injection
function buildRagContext(query) {
    const matched = searchKnowledgeBase(query, 3);
    if (matched.length === 0) {
        // Fallback to core summary
        return NIAT_KNOWLEDGE_BASE.slice(0, 2).map(item => `[FACT: ${item.title}]\n${item.answer}`).join('\n\n');
    }
    return matched.map(item => `[VERIFIED FACT: ${item.title}]\n${item.answer}\nCitations: ${item.citations.map(c => c.source).join(', ')}`).join('\n\n');
}

module.exports = {
    NIAT_KNOWLEDGE_BASE,
    searchKnowledgeBase,
    buildRagContext
};
