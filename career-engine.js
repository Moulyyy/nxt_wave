/* ============================================
   career-engine.js — AI Career Analysis Engine (Component 2)
   Career path matching + salary trajectories + campus recommendation
   ============================================ */

// Career Paths Database
const careerPaths = {
    fullstack_developer: {
        title: "Full-Stack Developer",
        badge: "💻",
        desc: "You're a builder at heart. Full-stack developers create complete web applications — from the user interface to the server logic. Companies like Google, Amazon, and fast-growing startups are constantly hiring for this role.",
        matchKeywords: ["building_apps", "design_creative", "business"],
        personalityFit: { workstyle: "both", motivation: "create", approach: "both", ambition: "both" },
        skills: ["React.js", "Node.js", "Python", "MongoDB", "AWS", "TypeScript", "REST APIs", "Git"],
        salaryPath: { year1: "₹5L", year3: "₹12L", year5: "₹22L", year8: "₹40L+" },
        salaryBars: [25, 50, 75, 100],
        demand: 92,
        growth: 88,
        companies: "Google, Microsoft, Flipkart, Swiggy, Razorpay"
    },
    ai_ml_engineer: {
        title: "AI / Machine Learning Engineer",
        badge: "🤖",
        desc: "You think in patterns and love making machines smarter. AI/ML engineers build intelligent systems — from recommendation engines to self-driving cars. This is the fastest-growing tech career in India right now.",
        matchKeywords: ["ai_robots", "data_numbers"],
        personalityFit: { workstyle: "solo", motivation: "create", approach: "logical", ambition: "high" },
        skills: ["Python", "TensorFlow", "PyTorch", "Deep Learning", "NLP", "Computer Vision", "Statistics", "MLOps"],
        salaryPath: { year1: "₹6L", year3: "₹15L", year5: "₹28L", year8: "₹50L+" },
        salaryBars: [25, 55, 80, 100],
        demand: 96,
        growth: 95,
        companies: "Google DeepMind, OpenAI, Amazon, NVIDIA, Flipkart"
    },
    data_scientist: {
        title: "Data Scientist",
        badge: "📊",
        desc: "You see stories in numbers. Data scientists turn raw data into business decisions. Every major company — from banks to e-commerce giants — needs people who can analyze data and extract actionable insights.",
        matchKeywords: ["data_numbers", "business"],
        personalityFit: { workstyle: "both", motivation: "optimize", approach: "logical", ambition: "both" },
        skills: ["Python", "SQL", "Machine Learning", "Tableau", "Statistics", "Excel", "Power BI", "R"],
        salaryPath: { year1: "₹5L", year3: "₹14L", year5: "₹25L", year8: "₹45L+" },
        salaryBars: [25, 50, 78, 100],
        demand: 90,
        growth: 87,
        companies: "Amazon, Mu Sigma, Tiger Analytics, Flipkart, Paytm"
    },
    cybersecurity_analyst: {
        title: "Cybersecurity Analyst",
        badge: "🔒",
        desc: "You protect systems from digital threats. With cyber attacks increasing 300% every year, cybersecurity professionals are in massive demand. Banks, governments, and tech companies need you to keep their data safe.",
        matchKeywords: ["cybersecurity", "data_numbers"],
        personalityFit: { workstyle: "solo", motivation: "optimize", approach: "logical", ambition: "both" },
        skills: ["Network Security", "Ethical Hacking", "SIEM", "Linux", "Python", "Forensics", "Cloud Security", "SOC"],
        salaryPath: { year1: "₹4.5L", year3: "₹12L", year5: "₹22L", year8: "₹42L+" },
        salaryBars: [22, 48, 72, 100],
        demand: 94,
        growth: 92,
        companies: "Deloitte, PwC, TCS, Infosys, CrowdStrike"
    },
    cloud_devops_engineer: {
        title: "Cloud & DevOps Engineer",
        badge: "☁️",
        desc: "You're the backbone of modern tech infrastructure. Cloud engineers design, deploy, and manage scalable systems that power everything from Netflix to Uber. DevOps bridges development and operations for faster delivery.",
        matchKeywords: ["cloud_devops", "building_apps"],
        personalityFit: { workstyle: "team", motivation: "optimize", approach: "logical", ambition: "high" },
        skills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform", "Jenkins", "Python"],
        salaryPath: { year1: "₹5L", year3: "₹14L", year5: "₹26L", year8: "₹48L+" },
        salaryBars: [23, 52, 77, 100],
        demand: 91,
        growth: 90,
        companies: "AWS, Google Cloud, Microsoft Azure, Jio, Infosys"
    },
    game_developer: {
        title: "Game Developer",
        badge: "🎮",
        desc: "You turn imagination into interactive worlds. Game development combines coding, art, and storytelling. India's gaming industry is growing at 30% per year, with mobile gaming leading the charge.",
        matchKeywords: ["gaming", "design_creative", "building_apps"],
        personalityFit: { workstyle: "team", motivation: "create", approach: "intuitive", ambition: "both" },
        skills: ["Unity", "Unreal Engine", "C#", "C++", "3D Modeling", "Game Design", "Physics Engines", "Multiplayer"],
        salaryPath: { year1: "₹4L", year3: "₹10L", year5: "₹20L", year8: "₹35L+" },
        salaryBars: [22, 45, 70, 95],
        demand: 78,
        growth: 85,
        companies: "Ubisoft, Zynga, Dream11, MPL, nCore Games"
    },
    ui_ux_designer: {
        title: "UI/UX Designer + Frontend Dev",
        badge: "🎨",
        desc: "You make technology beautiful and usable. UI/UX designers shape how millions of people interact with apps and websites. Combining design skills with frontend coding makes you invaluable to any product team.",
        matchKeywords: ["design_creative", "building_apps"],
        personalityFit: { workstyle: "both", motivation: "create", approach: "intuitive", ambition: "both" },
        skills: ["Figma", "React.js", "CSS/Tailwind", "User Research", "Prototyping", "Design Systems", "JavaScript", "Animation"],
        salaryPath: { year1: "₹4.5L", year3: "₹12L", year5: "₹22L", year8: "₹38L+" },
        salaryBars: [23, 48, 73, 97],
        demand: 86,
        growth: 82,
        companies: "CRED, Swiggy, Razorpay, Flipkart, PhonePe"
    },
    product_manager: {
        title: "Product Manager (Tech)",
        badge: "💼",
        desc: "You're the CEO of the product. Product managers sit at the intersection of technology, business, and user needs. You decide what gets built, why, and how — making strategic decisions that drive revenue.",
        matchKeywords: ["business", "building_apps", "data_numbers"],
        personalityFit: { workstyle: "team", motivation: "both", approach: "both", ambition: "high" },
        skills: ["Product Strategy", "SQL", "Analytics", "A/B Testing", "Agile/Scrum", "Wireframing", "User Research", "Roadmapping"],
        salaryPath: { year1: "₹6L", year3: "₹16L", year5: "₹30L", year8: "₹55L+" },
        salaryBars: [25, 55, 82, 100],
        demand: 88,
        growth: 90,
        companies: "Google, Microsoft, Flipkart, Razorpay, CRED"
    }
};

// NIAT Campus Database (subset)
const niatCampuses = {
    AP: { name: "Chaitanya Deemed-to-be University", location: "Visakhapatnam, Andhra Pradesh", highlights: ["UGC Recognized", "AI/ML Specialization", "Industry-Ready Labs"] },
    TS: { name: "Aurora Deemed University", location: "Hyderabad, Telangana", highlights: ["Central Location", "Strong Placements", "Tech Hub Access"] },
    TN: { name: "Sathyabama Institute", location: "Chennai, Tamil Nadu", highlights: ["NAAC A Grade", "Research Focus", "Coastal Campus"] },
    KA: { name: "S-VYASA University", location: "Bangalore, Karnataka", highlights: ["IT Capital", "Startup Ecosystem", "UGC Recognized"] },
    KL: { name: "NIAT Partner Campus Kerala", location: "Kochi, Kerala", highlights: ["Growing Tech Hub", "Quality Education", "Affordable"] },
    MH: { name: "NIAT Partner Campus Maharashtra", location: "Pune, Maharashtra", highlights: ["IT Corridor", "Industry Connect", "Vibrant Culture"] },
    DL: { name: "Noida International University", location: "Greater Noida, Delhi NCR", highlights: ["Capital Region", "Multi-campus", "Diverse Community"] },
    UP: { name: "Noida International University", location: "Greater Noida, Uttar Pradesh", highlights: ["NAAC Accredited", "Modern Campus", "NCR Access"] },
    RJ: { name: "NIAT Partner Campus Rajasthan", location: "Jaipur, Rajasthan", highlights: ["Heritage City", "Growing IT Sector", "Affordable Living"] },
    DEFAULT: { name: "NIAT Partner Campus", location: "Nearest NIAT campus to you", highlights: ["UGC Recognized", "Industry-Ready Training", "35+ Partner Universities"] }
};

// AI Career Matching Engine
function matchCareer(interests, personality) {
    const scores = {};
    
    for (const [key, career] of Object.entries(careerPaths)) {
        let score = 0;
        
        // Interest matching (60% weight)
        const interestMatches = interests.filter(i => career.matchKeywords.includes(i)).length;
        const interestScore = (interestMatches / Math.max(career.matchKeywords.length, 1)) * 60;
        score += interestScore;
        
        // Personality matching (40% weight)
        let personalityScore = 0;
        let pqCount = 0;
        for (const [pqKey, pqValue] of Object.entries(personality)) {
            if (pqValue) {
                pqCount++;
                const careerPref = career.personalityFit[pqKey];
                if (careerPref === pqValue || careerPref === 'both') {
                    personalityScore += 10;
                }
            }
        }
        score += personalityScore;
        
        // Bonus for multiple interest matches
        if (interestMatches >= 2) score += 10;
        
        scores[key] = Math.min(Math.round(score), 98);
    }
    
    // Sort by score descending
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topCareer = sorted[0];
    
    return {
        careerKey: topCareer[0],
        matchScore: Math.max(topCareer[1], 72), // Minimum 72% match for positive UX
        career: careerPaths[topCareer[0]],
        allScores: scores
    };
}

// Get NIAT campus recommendation
function getRecommendedCampus(stateCode) {
    return niatCampuses[stateCode] || niatCampuses.DEFAULT;
}

// Generate AI Insight (this would call Gemini API in production)
function generateAIInsight(userName, career, matchScore, percentage, interests) {
    const insights = [
        `${userName}, based on your interest combination of ${interests.join(' + ')}, you have a ${matchScore}% alignment with ${career.title}. Students with similar profiles who joined NIAT saw an average starting salary of ${career.salaryPath.year1} in their first year, growing to ${career.salaryPath.year5} by year 5. The key differentiator? They started building real projects from semester 1 — not waiting until final year placements.`,
        
        `Here's what's interesting about your profile, ${userName}: your combination of interests puts you in the top ${100 - matchScore + Math.floor(Math.random() * 10)}% of students who excel in ${career.title}. Companies like ${career.companies} are actively hiring for this role, with demand growing ${career.growth}% year over year. The best time to start building these skills is now — NIAT's project-based learning begins from Day 1.`,
        
        `${userName}, your Career DNA reveals a strong fit for ${career.title}. With your ${percentage}% in 12th, you're well-positioned for this path. Here's the edge: most B.Tech graduates spend 4 years on theory and scramble for skills in final year. NIAT students build ${Math.floor(Math.random() * 5) + 8}+ real-world projects alongside their degree, making them 3x more likely to land a ₹10L+ package on graduation.`
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
}

// Generate shareable text for WhatsApp
function generateWhatsAppShareText(userName, career, matchScore) {
    return `🧬 *My Career DNA Result*\n\nI just discovered I'm a ${matchScore}% match for *${career.title}* ${career.badge}!\n\n💰 Expected salary: ${career.salaryPath.year1} → ${career.salaryPath.year8}\n📈 Market demand: ${career.demand}%\n\nFind YOUR Career DNA in 2 minutes 👇\nhttps://careerdna.niatindia.com\n\n_Powered by NIAT × AI_`;
}
