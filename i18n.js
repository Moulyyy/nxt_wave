/* ============================================
   i18n.js — Multilingual Engine (Component 3)
   Supports: English, Hindi, Telugu, Tamil, Kannada, Malayalam
   ============================================ */

const translations = {
    en: {
        // Hero
        hero_badge: "🎯 FREE AI Career Assessment",
        hero_title_1: "Discover Your",
        hero_title_2: "Career DNA",
        hero_subtitle: "AI-powered career mapping for 12th-grade students. Get your personalized tech career path in 2 minutes.",
        stat_assessments: "Assessments Taken",
        stat_languages: "Languages",
        stat_time: "Time to Complete",
        btn_start: "Start My Career DNA Assessment →",
        hero_trust: "Powered by AI • Trusted by 35+ Universities • 100% Free",
        
        // Step 1
        step1_title: "📝 Let's start with the basics",
        label_name: "Your Name",
        placeholder_name: "Enter your name",
        label_phone: "WhatsApp Number",
        label_state: "State",
        placeholder_state: "Select your state",
        
        // Step 2
        step2_title: "📊 Your Academic Profile",
        label_board: "Board / Stream",
        label_stream: "Stream",
        label_percentage: "12th Percentage / CGPA",
        
        // Step 3
        step3_title: "🧠 What excites you?",
        step3_desc: "Pick 2-3 things that genuinely interest you. No wrong answers.",
        interest_apps: "Building Apps",
        interest_ai: "AI & Robots",
        interest_data: "Data & Numbers",
        interest_design: "Design & Creative",
        interest_gaming: "Gaming",
        interest_security: "Cybersecurity",
        interest_business: "Business & Startups",
        interest_cloud: "Cloud & DevOps",
        
        // Step 4
        step4_title: "⚡ Quick-fire Personality Round",
        step4_desc: "Pick the option that feels more natural to you.",
        pq1_label: "I prefer to...",
        pq1_a: "Work alone, deep focus",
        pq1_b: "Collaborate with a team",
        pq2_label: "I'm more excited by...",
        pq2_a: "Creating something new",
        pq2_b: "Making things work better",
        pq3_label: "When solving a problem, I usually...",
        pq3_a: "Analyze data & logic",
        pq3_b: "Go with my gut feeling",
        pq4_label: "My dream salary expectation (per year)...",
        pq4_a: "₹5-10 LPA (stable job)",
        pq4_b: "₹15-30+ LPA (dream big)",
        
        // Buttons
        btn_next: "Continue →",
        btn_back: "← Back",
        btn_generate: "🧬 Generate My Career DNA →",
        btn_restart: "Take Assessment Again",
        
        // Processing
        processing_title: "Analyzing Your Career DNA...",
        proc_1: "Mapping your interests to career paths...",
        proc_2: "Analyzing salary trajectories...",
        proc_3: "Finding your best-fit NIAT campus...",
        proc_4: "Generating personalized report...",
        
        // Results
        metric_match: "Career Match",
        metric_demand: "Market Demand",
        metric_growth: "Growth Potential",
        salary_title: "💰 Expected Salary Trajectory",
        skills_title: "🛠️ Skills You'll Master",
        ai_insight_title: "AI Career Insight",
        niat_rec_title: "🎓 Your Best-Fit NIAT Campus",
        btn_nat: "🚀 Register for FREE NAT Scholarship Test",
        niat_urgency: "⏰ Limited seats available for 2026-27 batch. NAT registration closes soon.",
        share_title: "📤 Share Your Career DNA"
    },
    
    hi: {
        hero_badge: "🎯 मुफ़्त AI करियर मूल्यांकन",
        hero_title_1: "अपना",
        hero_title_2: "करियर DNA खोजें",
        hero_subtitle: "12वीं के छात्रों के लिए AI-संचालित करियर मैपिंग। 2 मिनट में अपना व्यक्तिगत टेक करियर पथ पाएं।",
        stat_assessments: "मूल्यांकन पूर्ण",
        stat_languages: "भाषाएँ",
        stat_time: "पूरा करने का समय",
        btn_start: "मेरा करियर DNA मूल्यांकन शुरू करें →",
        hero_trust: "AI द्वारा संचालित • 35+ विश्वविद्यालयों द्वारा विश्वसनीय • 100% मुफ़्त",
        step1_title: "📝 आइए बुनियादी बातों से शुरू करें",
        label_name: "आपका नाम",
        placeholder_name: "अपना नाम दर्ज करें",
        label_phone: "WhatsApp नंबर",
        label_state: "राज्य",
        placeholder_state: "अपना राज्य चुनें",
        step2_title: "📊 आपका शैक्षणिक प्रोफाइल",
        label_board: "बोर्ड / स्ट्रीम",
        label_stream: "स्ट्रीम",
        label_percentage: "12वीं प्रतिशत / CGPA",
        step3_title: "🧠 आपको क्या उत्साहित करता है?",
        step3_desc: "2-3 चीजें चुनें जो आपको सच में रुचिकर लगती हैं। कोई गलत जवाब नहीं।",
        interest_apps: "ऐप्स बनाना",
        interest_ai: "AI और रोबोट",
        interest_data: "डेटा और संख्याएँ",
        interest_design: "डिज़ाइन और क्रिएटिव",
        interest_gaming: "गेमिंग",
        interest_security: "साइबर सुरक्षा",
        interest_business: "बिजनेस और स्टार्टअप",
        interest_cloud: "क्लाउड और DevOps",
        step4_title: "⚡ त्वरित व्यक्तित्व राउंड",
        step4_desc: "वो विकल्प चुनें जो आपको अधिक स्वाभाविक लगे।",
        pq1_label: "मैं पसंद करता/करती हूँ...",
        pq1_a: "अकेले काम, गहरा ध्यान",
        pq1_b: "टीम के साथ सहयोग",
        pq2_label: "मुझे ज्यादा उत्साह होता है...",
        pq2_a: "कुछ नया बनाने से",
        pq2_b: "चीजों को बेहतर बनाने से",
        pq3_label: "समस्या हल करते समय, मैं आमतौर पर...",
        pq3_a: "डेटा और तर्क का विश्लेषण करता हूँ",
        pq3_b: "अपनी सहज प्रवृत्ति से जाता हूँ",
        pq4_label: "मेरी सपनों की सैलरी उम्मीद (प्रति वर्ष)...",
        pq4_a: "₹5-10 LPA (स्थिर नौकरी)",
        pq4_b: "₹15-30+ LPA (बड़े सपने)",
        btn_next: "आगे बढ़ें →",
        btn_back: "← वापस",
        btn_generate: "🧬 मेरा करियर DNA बनाएं →",
        btn_restart: "फिर से मूल्यांकन करें",
        processing_title: "आपका करियर DNA विश्लेषण हो रहा है...",
        proc_1: "आपकी रुचियों को करियर पथों से मिलाया जा रहा है...",
        proc_2: "वेतन पथ विश्लेषण...",
        proc_3: "आपका सबसे अच्छा NIAT कैंपस ढूंढा जा रहा है...",
        proc_4: "व्यक्तिगत रिपोर्ट बनाई जा रही है...",
        metric_match: "करियर मैच",
        metric_demand: "बाज़ार माँग",
        metric_growth: "विकास क्षमता",
        salary_title: "💰 अपेक्षित वेतन पथ",
        skills_title: "🛠️ आप जो कौशल सीखेंगे",
        ai_insight_title: "AI करियर इनसाइट",
        niat_rec_title: "🎓 आपका सर्वश्रेष्ठ NIAT कैंपस",
        btn_nat: "🚀 मुफ़्त NAT स्कॉलरशिप टेस्ट के लिए रजिस्टर करें",
        niat_urgency: "⏰ 2026-27 बैच के लिए सीमित सीटें। NAT रजिस्ट्रेशन जल्द बंद।",
        share_title: "📤 अपना करियर DNA शेयर करें"
    },
    
    te: {
        hero_badge: "🎯 ఉచిత AI కెరీర్ అసెస్‌మెంట్",
        hero_title_1: "మీ",
        hero_title_2: "కెరీర్ DNA కనుగొనండి",
        hero_subtitle: "12వ తరగతి విద్యార్థులకు AI ఆధారిత కెరీర్ మ్యాపింగ్. 2 నిమిషాల్లో మీ వ్యక్తిగత టెక్ కెరీర్ మార్గం పొందండి.",
        stat_assessments: "అసెస్‌మెంట్‌లు పూర్తయ్యాయి",
        stat_languages: "భాషలు",
        stat_time: "పూర్తి చేయడానికి సమయం",
        btn_start: "నా కెరీర్ DNA అసెస్‌మెంట్ ప్రారంభించు →",
        hero_trust: "AI ద్వారా నడుస్తుంది • 35+ విశ్వవిద్యాలయాలు విశ్వసించాయి • 100% ఉచితం",
        step1_title: "📝 ప్రాథమిక విషయాలతో ప్రారంభిద్దాం",
        label_name: "మీ పేరు",
        placeholder_name: "మీ పేరు నమోదు చేయండి",
        label_phone: "WhatsApp నంబర్",
        label_state: "రాష్ట్రం",
        placeholder_state: "మీ రాష్ట్రాన్ని ఎంచుకోండి",
        step2_title: "📊 మీ విద్యా ప్రొఫైల్",
        label_board: "బోర్డ్ / స్ట్రీమ్",
        label_stream: "స్ట్రీమ్",
        label_percentage: "12వ శాతం / CGPA",
        step3_title: "🧠 మిమ్మల్ని ఏది ఉత్సాహపరుస్తుంది?",
        step3_desc: "మీకు నిజంగా ఆసక్తి కలిగించే 2-3 విషయాలు ఎంచుకోండి.",
        interest_apps: "యాప్‌లు నిర్మించడం",
        interest_ai: "AI & రోబోట్‌లు",
        interest_data: "డేటా & సంఖ్యలు",
        interest_design: "డిజైన్ & క్రియేటివ్",
        interest_gaming: "గేమింగ్",
        interest_security: "సైబర్‌ సెక్యూరిటీ",
        interest_business: "బిజినెస్ & స్టార్టప్‌లు",
        interest_cloud: "క్లౌడ్ & DevOps",
        step4_title: "⚡ క్విక్ పర్సనాలిటీ రౌండ్",
        step4_desc: "మీకు సహజంగా అనిపించే ఆప్షన్ ఎంచుకోండి.",
        pq1_label: "నేను ఇష్టపడతాను...",
        pq1_a: "ఒంటరిగా పని, లోతైన దృష్టి",
        pq1_b: "బృందంతో సహకారం",
        pq2_label: "నాకు ఎక్కువ ఉత్సాహం...",
        pq2_a: "కొత్తది సృష్టించడం",
        pq2_b: "విషయాలను మెరుగ్గా చేయడం",
        pq3_label: "సమస్య పరిష్కరించేటప్పుడు, నేను సాధారణంగా...",
        pq3_a: "డేటా & లాజిక్ విశ్లేషిస్తాను",
        pq3_b: "నా అంతఃప్రేరణతో వెళ్తాను",
        pq4_label: "నా కలల జీతం అంచనా (సంవత్సరానికి)...",
        pq4_a: "₹5-10 LPA (స్థిర ఉద్యోగం)",
        pq4_b: "₹15-30+ LPA (పెద్ద కలలు)",
        btn_next: "ముందుకు →",
        btn_back: "← వెనుకకు",
        btn_generate: "🧬 నా కెరీర్ DNA రూపొందించు →",
        btn_restart: "మళ్ళీ అసెస్‌మెంట్ తీసుకోండి",
        processing_title: "మీ కెరీర్ DNA విశ్లేషించబడుతోంది...",
        proc_1: "మీ ఆసక్తులను కెరీర్ మార్గాలతో అనుసంధానం...",
        proc_2: "జీతం పథం విశ్లేషణ...",
        proc_3: "మీకు అనుకూలమైన NIAT క్యాంపస్ కనుగొనడం...",
        proc_4: "వ్యక్తిగత నివేదిక రూపొందించడం...",
        metric_match: "కెరీర్ మ్యాచ్",
        metric_demand: "మార్కెట్ డిమాండ్",
        metric_growth: "వృద్ధి సామర్థ్యం",
        salary_title: "💰 అంచనా జీతం పథం",
        skills_title: "🛠️ మీరు నేర్చుకునే నైపుణ్యాలు",
        ai_insight_title: "AI కెరీర్ ఇన్‌సైట్",
        niat_rec_title: "🎓 మీకు అనుకూలమైన NIAT క్యాంపస్",
        btn_nat: "🚀 ఉచిత NAT స్కాలర్‌షిప్ టెస్ట్‌కు రిజిస్టర్ చేయండి",
        niat_urgency: "⏰ 2026-27 బ్యాచ్‌కు పరిమిత సీట్లు. NAT రిజిస్ట్రేషన్ త్వరలో ముగుస్తుంది.",
        share_title: "📤 మీ కెరీర్ DNA షేర్ చేయండి"
    },
    
    ta: {
        hero_badge: "🎯 இலவச AI தொழில் மதிப்பீடு",
        hero_title_1: "உங்கள்",
        hero_title_2: "தொழில் DNA-ஐ கண்டறியுங்கள்",
        hero_subtitle: "12ஆம் வகுப்பு மாணவர்களுக்கான AI இயங்கும் தொழில் வரைபடம். 2 நிமிடங்களில் உங்கள் தொழில்நுட்ப தொழில் பாதையை பெறுங்கள்.",
        stat_assessments: "மதிப்பீடுகள் முடிந்தன",
        stat_languages: "மொழிகள்",
        stat_time: "முடிக்க நேரம்",
        btn_start: "என் தொழில் DNA மதிப்பீட்டை தொடங்கு →",
        hero_trust: "AI மூலம் இயக்கப்படுகிறது • 35+ பல்கலைக்கழகங்கள் நம்புகின்றன • 100% இலவசம்",
        step1_title: "📝 அடிப்படைகளில் தொடங்குவோம்",
        label_name: "உங்கள் பெயர்",
        placeholder_name: "உங்கள் பெயரை உள்ளிடுங்கள்",
        label_phone: "WhatsApp எண்",
        label_state: "மாநிலம்",
        placeholder_state: "உங்கள் மாநிலத்தை தேர்ந்தெடுக்கவும்",
        step2_title: "📊 உங்கள் கல்வி சுயவிவரம்",
        step3_title: "🧠 உங்களை எது உற்சாகப்படுத்துகிறது?",
        step3_desc: "உங்களுக்கு உண்மையிலேயே ஆர்வமுள்ள 2-3 விஷயங்களை தேர்ந்தெடுக்கவும்.",
        interest_apps: "ஆப்ஸ் உருவாக்குதல்",
        interest_ai: "AI & ரோபோக்கள்",
        interest_data: "தரவு & எண்கள்",
        interest_design: "வடிவமைப்பு & படைப்பாற்றல்",
        interest_gaming: "கேமிங்",
        interest_security: "சைபர் பாதுகாப்பு",
        interest_business: "வணிகம் & ஸ்டார்ட்அப்கள்",
        interest_cloud: "கிளவுட் & DevOps",
        step4_title: "⚡ விரைவு ஆளுமை சுற்று",
        step4_desc: "உங்களுக்கு இயல்பாக தோன்றும் விருப்பத்தை தேர்வு செய்யுங்கள்.",
        btn_next: "தொடரவும் →",
        btn_back: "← திரும்பு",
        btn_generate: "🧬 என் தொழில் DNA உருவாக்கு →",
        btn_restart: "மீண்டும் மதிப்பீடு எடுங்கள்",
        processing_title: "உங்கள் தொழில் DNA பகுப்பாய்வு செய்யப்படுகிறது...",
        metric_match: "தொழில் பொருத்தம்",
        metric_demand: "சந்தை தேவை",
        metric_growth: "வளர்ச்சி திறன்",
        salary_title: "💰 எதிர்பார்க்கப்படும் சம்பள பாதை",
        skills_title: "🛠️ நீங்கள் கற்கும் திறன்கள்",
        niat_rec_title: "🎓 உங்களுக்கு பொருத்தமான NIAT வளாகம்",
        btn_nat: "🚀 இலவச NAT உதவித்தொகை தேர்வுக்கு பதிவு செய்யுங்கள்",
        share_title: "📤 உங்கள் தொழில் DNA-ஐ பகிரவும்"
    },
    
    kn: {
        hero_badge: "🎯 ಉಚಿತ AI ವೃತ್ತಿ ಮೌಲ್ಯಮಾಪನ",
        hero_title_1: "ನಿಮ್ಮ",
        hero_title_2: "ವೃತ್ತಿ DNA ಕಂಡುಹಿಡಿಯಿರಿ",
        hero_subtitle: "12ನೇ ತರಗತಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ AI ಆಧಾರಿತ ವೃತ್ತಿ ಮ್ಯಾಪಿಂಗ್. 2 ನಿಮಿಷಗಳಲ್ಲಿ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಟೆಕ್ ವೃತ್ತಿ ಮಾರ್ಗವನ್ನು ಪಡೆಯಿರಿ.",
        stat_assessments: "ಮೌಲ್ಯಮಾಪನಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ",
        stat_languages: "ಭಾಷೆಗಳು",
        stat_time: "ಪೂರ್ಣಗೊಳಿಸಲು ಸಮಯ",
        btn_start: "ನನ್ನ ವೃತ್ತಿ DNA ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ →",
        hero_trust: "AI ಮೂಲಕ ನಡೆಸಲಾಗುತ್ತದೆ • 35+ ವಿಶ್ವವಿದ್ಯಾಲಯಗಳ ನಂಬಿಕೆ • 100% ಉಚಿತ",
        step1_title: "📝 ಮೂಲ ವಿಷಯಗಳಿಂದ ಪ್ರಾರಂಭಿಸೋಣ",
        label_name: "ನಿಮ್ಮ ಹೆಸರು",
        placeholder_name: "ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ",
        label_phone: "WhatsApp ಸಂಖ್ಯೆ",
        label_state: "ರಾಜ್ಯ",
        step3_title: "🧠 ನಿಮ್ಮನ್ನು ಏನು ಉತ್ಸಾಹಗೊಳಿಸುತ್ತದೆ?",
        step3_desc: "ನಿಮಗೆ ನಿಜವಾಗಿಯೂ ಆಸಕ್ತಿ ಇರುವ 2-3 ವಿಷಯಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
        interest_apps: "ಅಪ್ಲಿಕೇಶನ್ ನಿರ್ಮಾಣ",
        interest_ai: "AI & ರೊಬೊಟ್‌ಗಳು",
        interest_data: "ಡೇಟಾ & ಸಂಖ್ಯೆಗಳು",
        interest_design: "ವಿನ್ಯಾಸ & ಸೃಜನಶೀಲ",
        interest_gaming: "ಗೇಮಿಂಗ್",
        interest_security: "ಸೈಬರ್‌ ಭದ್ರತೆ",
        interest_business: "ವ್ಯಾಪಾರ & ಸ್ಟಾರ್ಟ್‌ಅಪ್",
        interest_cloud: "ಕ್ಲೌಡ್ & DevOps",
        step4_title: "⚡ ತ್ವರಿತ ವ್ಯಕ್ತಿತ್ವ ಸುತ್ತು",
        btn_next: "ಮುಂದುವರಿಸಿ →",
        btn_back: "← ಹಿಂದೆ",
        btn_generate: "🧬 ನನ್ನ ವೃತ್ತಿ DNA ರಚಿಸಿ →",
        btn_restart: "ಮತ್ತೊಮ್ಮೆ ಮೌಲ್ಯಮಾಪನ ತೆಗೆದುಕೊಳ್ಳಿ",
        processing_title: "ನಿಮ್ಮ ವೃತ್ತಿ DNA ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        btn_nat: "🚀 ಉಚಿತ NAT ವಿದ್ಯಾರ್ಥಿವೇತನ ಪರೀಕ್ಷೆಗೆ ನೋಂದಣಿ ಮಾಡಿ",
        share_title: "📤 ನಿಮ್ಮ ವೃತ್ತಿ DNA ಹಂಚಿಕೊಳ್ಳಿ"
    },
    
    ml: {
        hero_badge: "🎯 സൗജന്യ AI കരിയർ വിലയിരുത്തൽ",
        hero_title_1: "നിങ്ങളുടെ",
        hero_title_2: "കരിയർ DNA കണ്ടെത്തൂ",
        hero_subtitle: "12-ാം ക്ലാസ് വിദ്യാർത്ഥികൾക്കായുള്ള AI അധിഷ്ഠിത കരിയർ മാപ്പിംഗ്. 2 മിനിറ്റിനുള്ളിൽ നിങ്ങളുടെ ടെക് കരിയർ പാത കണ്ടെത്തൂ.",
        stat_assessments: "വിലയിരുത്തലുകൾ പൂർത്തിയായി",
        stat_languages: "ഭാഷകൾ",
        stat_time: "പൂർത്തിയാക്കാനുള്ള സമയം",
        btn_start: "എന്റെ കരിയർ DNA വിലയിരുത്തൽ ആരംഭിക്കുക →",
        hero_trust: "AI വഴി പ്രവർത്തിക്കുന്നു • 35+ സർവ്വകലാശാലകൾ വിശ്വസിക്കുന്നു • 100% സൗജന്യം",
        step1_title: "📝 അടിസ്ഥാന കാര്യങ്ങളിൽ നിന്ന് തുടങ്ങാം",
        label_name: "നിങ്ങളുടെ പേര്",
        placeholder_name: "നിങ്ങളുടെ പേര് നൽകുക",
        label_phone: "WhatsApp നമ്പർ",
        label_state: "സംസ്ഥാനം",
        step3_title: "🧠 നിങ്ങളെ എന്താണ് ആവേശഭരിതരാക്കുന്നത്?",
        step3_desc: "നിങ്ങൾക്ക് യഥാർത്ഥമായി താൽപ്പര്യമുള്ള 2-3 കാര്യങ്ങൾ തിരഞ്ഞെടുക്കുക.",
        interest_apps: "ആപ്പുകൾ നിർമ്മിക്കൽ",
        interest_ai: "AI & റോബോട്ടുകൾ",
        interest_data: "ഡാറ്റ & സംഖ്യകൾ",
        interest_design: "ഡിസൈൻ & ക്രിയേറ്റീവ്",
        interest_gaming: "ഗെയിമിംഗ്",
        interest_security: "സൈബർ സെക്യൂരിറ്റി",
        interest_business: "ബിസിനസ് & സ്റ്റാർട്ടപ്പുകൾ",
        interest_cloud: "ക്ലൗഡ് & DevOps",
        step4_title: "⚡ ദ്രുത വ്യക്തിത്വ റൗണ്ട്",
        btn_next: "തുടരുക →",
        btn_back: "← തിരികെ",
        btn_generate: "🧬 എന്റെ കരിയർ DNA സൃഷ്ടിക്കുക →",
        btn_restart: "വീണ്ടും വിലയിരുത്തൽ എടുക്കുക",
        processing_title: "നിങ്ങളുടെ കരിയർ DNA വിശകലനം ചെയ്യുന്നു...",
        btn_nat: "🚀 സൗജന്യ NAT സ്കോളർഷിപ്പ് ടെസ്റ്റിന് രജിസ്റ്റർ ചെയ്യുക",
        share_title: "📤 നിങ്ങളുടെ കരിയർ DNA പങ്കിടൂ"
    }
};

let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang] || translations.en;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
    
    // Store preference
    localStorage.setItem('careerdna_lang', lang);
}

function t(key) {
    return (translations[currentLang] || translations.en)[key] || (translations.en)[key] || key;
}

// Initialize from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('careerdna_lang') || 'en';
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = savedLang;
        langSelector.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    setLanguage(savedLang);
});
