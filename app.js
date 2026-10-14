/* ============================================
   app.js — Main Application Controller (Component 1)
   Connects: Assessment UI → Career Engine → i18n → Dashboard → Share
   ============================================ */

// ===== State Management =====
const state = {
    currentStep: 1,
    totalSteps: 4,
    selectedStream: null,
    selectedInterests: [],
    personality: {},
    userData: {},
    result: null
};

// ===== Lead Database (localStorage CRM) =====
const LEADS_KEY = 'careerdna_leads';
const EVENTS_KEY = 'careerdna_events';

function getLeads() {
    try {
        return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
    } catch { return []; }
}

function saveLead(lead) {
    const leads = getLeads();
    leads.push({ ...lead, timestamp: new Date().toISOString(), id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() });
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    trackEvent('lead_captured', { name: lead.name, state: lead.state });
}

function trackEvent(event, data = {}) {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push({ event, data, timestamp: new Date().toISOString() });
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// ===== Screen Management =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== Step Navigation =====
function nextStep(step) {
    // Validation
    if (state.currentStep === 1) {
        const name = document.getElementById('userName').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const userState = document.getElementById('userState').value;
        
        if (!name) { shakeElement('userName'); return; }
        if (!phone || phone.length < 10) { shakeElement('userPhone'); return; }
        if (!userState) { shakeElement('userState'); return; }
        
        state.userData.name = name;
        state.userData.phone = phone;
        state.userData.state = userState;
    }
    
    if (state.currentStep === 2) {
        const board = document.getElementById('userBoard').value;
        const percentage = document.getElementById('userPercentage').value;
        
        if (!board) { shakeElement('userBoard'); return; }
        if (!state.selectedStream) { showToast('Please select your stream'); return; }
        if (!percentage) { shakeElement('userPercentage'); return; }
        
        state.userData.board = board;
        state.userData.stream = state.selectedStream;
        state.userData.percentage = parseFloat(percentage);
    }
    
    if (state.currentStep === 3) {
        if (state.selectedInterests.length < 2) {
            showToast('Please select at least 2 interests');
            return;
        }
    }
    
    // Transition
    document.getElementById(`step-${state.currentStep}`).classList.remove('active');
    state.currentStep = step;
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Update progress
    const progress = (step / state.totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Step ${step} of ${state.totalSteps}`;
    
    trackEvent('step_completed', { step: step - 1 });
}

function prevStep(step) {
    document.getElementById(`step-${state.currentStep}`).classList.remove('active');
    state.currentStep = step;
    document.getElementById(`step-${step}`).classList.add('active');
    
    const progress = (step / state.totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Step ${step} of ${state.totalSteps}`;
}

// ===== Chip Selection =====
function selectChip(el, type) {
    el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    if (type === 'stream') {
        state.selectedStream = el.dataset.value;
    }
}

// ===== Interest Selection =====
function toggleInterest(el) {
    const value = el.dataset.value;
    if (el.classList.contains('selected')) {
        el.classList.remove('selected');
        state.selectedInterests = state.selectedInterests.filter(i => i !== value);
    } else {
        if (state.selectedInterests.length >= 3) {
            showToast('Maximum 3 interests. Deselect one to change.');
            return;
        }
        el.classList.add('selected');
        state.selectedInterests.push(value);
    }
}

// ===== Personality Questions =====
function selectPQ(el) {
    const q = el.dataset.q;
    const v = el.dataset.value;
    
    // Deselect siblings
    el.parentElement.querySelectorAll('.pq-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    
    state.personality[q] = v;
}

// ===== Generate Career DNA =====
async function generateCareerDNA() {
    // Validate personality
    const pqKeys = ['workstyle', 'motivation', 'approach', 'ambition'];
    const answered = pqKeys.filter(k => state.personality[k]);
    if (answered.length < 3) {
        showToast('Please answer at least 3 questions');
        return;
    }
    
    // Show processing screen
    showScreen('screen-processing');
    trackEvent('assessment_submitted', { interests: state.selectedInterests, personality: state.personality });
    
    // Animate processing steps
    const steps = ['proc-1', 'proc-2', 'proc-3', 'proc-4'];
    for (let i = 0; i < steps.length; i++) {
        await delay(800 + Math.random() * 400);
        const stepEl = document.getElementById(steps[i]);
        stepEl.classList.add('active');
        stepEl.querySelector('.proc-icon').textContent = '⏳';
        
        if (i > 0) {
            const prevEl = document.getElementById(steps[i - 1]);
            prevEl.classList.remove('active');
            prevEl.classList.add('done');
            prevEl.querySelector('.proc-icon').textContent = '✅';
        }
    }
    
    await delay(600);
    const lastStep = document.getElementById(steps[steps.length - 1]);
    lastStep.classList.remove('active');
    lastStep.classList.add('done');
    lastStep.querySelector('.proc-icon').textContent = '✅';
    
    // Run career matching engine
    const result = matchCareer(state.selectedInterests, state.personality);
    state.result = result;
    
    // Get campus recommendation
    const campus = getRecommendedCampus(state.userData.state);
    
    // Generate AI insight
    const insight = generateAIInsight(
        state.userData.name,
        result.career,
        result.matchScore,
        state.userData.percentage,
        state.selectedInterests
    );
    
    // Save lead to CRM
    saveLead({
        name: state.userData.name,
        phone: state.userData.phone,
        state: state.userData.state,
        board: state.userData.board,
        stream: state.userData.stream,
        percentage: state.userData.percentage,
        interests: state.selectedInterests,
        personality: state.personality,
        careerMatch: result.career.title,
        matchScore: result.matchScore,
        campus: campus.name,
        language: currentLang,
        natClicked: false,
        shared: false
    });
    
    // Render results
    await delay(500);
    renderResults(result, campus, insight);
    showScreen('screen-results');
}

// ===== Render Results =====
function renderResults(result, campus, insight) {
    const { career, matchScore } = result;
    
    // Card header
    document.getElementById('resultName').textContent = state.userData.name;
    
    // Career info
    document.getElementById('careerBadge').textContent = career.badge;
    document.getElementById('careerTitle').textContent = career.title;
    document.getElementById('careerDesc').textContent = career.desc;
    
    // Metrics — animate after render
    setTimeout(() => {
        document.getElementById('matchFill').style.width = `${matchScore}%`;
        document.getElementById('matchValue').textContent = `${matchScore}%`;
        
        document.getElementById('demandFill').style.width = `${career.demand}%`;
        document.getElementById('demandValue').textContent = `${career.demand}%`;
        
        document.getElementById('growthFill').style.width = `${career.growth}%`;
        document.getElementById('growthValue').textContent = `${career.growth}%`;
    }, 300);
    
    // Salary chart
    const salaryChart = document.getElementById('salaryChart');
    salaryChart.innerHTML = '';
    const salaryLabels = ['Year 1', 'Year 3', 'Year 5', 'Year 8+'];
    const salaryValues = [career.salaryPath.year1, career.salaryPath.year3, career.salaryPath.year5, career.salaryPath.year8];
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4'];
    
    career.salaryBars.forEach((height, i) => {
        const group = document.createElement('div');
        group.className = 'salary-bar-group';
        
        const bar = document.createElement('div');
        bar.className = 'salary-bar';
        bar.style.background = colors[i];
        bar.style.height = '0px';
        
        const value = document.createElement('div');
        value.className = 'salary-bar-value';
        value.textContent = salaryValues[i];
        bar.appendChild(value);
        
        const label = document.createElement('div');
        label.className = 'salary-bar-label';
        label.textContent = salaryLabels[i];
        
        group.appendChild(bar);
        group.appendChild(label);
        salaryChart.appendChild(group);
        
        // Animate
        setTimeout(() => {
            bar.style.height = `${height}%`;
        }, 500 + (i * 200));
    });
    
    // Skills
    const skillsTags = document.getElementById('skillsTags');
    skillsTags.innerHTML = '';
    career.skills.forEach((skill, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        tag.style.animationDelay = `${i * 0.1}s`;
        skillsTags.appendChild(tag);
    });
    
    // AI Insight
    document.getElementById('aiInsightText').textContent = insight;
    
    // Campus recommendation
    document.getElementById('campusName').textContent = campus.name;
    document.getElementById('campusLocation').textContent = `📍 ${campus.location}`;
    
    const highlightsContainer = document.getElementById('campusHighlights');
    highlightsContainer.innerHTML = '';
    campus.highlights.forEach(h => {
        const tag = document.createElement('span');
        tag.className = 'campus-highlight-tag';
        tag.textContent = `✓ ${h}`;
        highlightsContainer.appendChild(tag);
    });
    
    trackEvent('results_viewed', { career: career.title, matchScore });
}

// ===== Share Functions =====
function shareWhatsApp() {
    if (!state.result) return;
    const text = generateWhatsAppShareText(state.userData.name, state.result.career, state.result.matchScore);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    trackEvent('shared_whatsapp', { career: state.result.career.title });
    updateLeadShared();
    showToast('Opening WhatsApp...');
}

function shareInstagram() {
    // Since Instagram doesn't have a direct share API, we'll create a downloadable card
    showToast('Screenshot this card and share on your Instagram Story! 📸');
    trackEvent('shared_instagram', { career: state.result.career.title });
    updateLeadShared();
    
    // Highlight the card for screenshot
    const card = document.getElementById('careerCard');
    card.style.boxShadow = '0 0 40px rgba(99, 102, 241, 0.4)';
    setTimeout(() => {
        card.style.boxShadow = '';
    }, 3000);
}

function copyShareLink() {
    const link = 'https://careerdna.niatindia.com';
    navigator.clipboard.writeText(link).then(() => {
        showToast('Link copied! Share with your friends 🎉');
        trackEvent('shared_copy', {});
        updateLeadShared();
    }).catch(() => {
        showToast('Link: careerdna.niatindia.com');
    });
}

function updateLeadShared() {
    const leads = getLeads();
    if (leads.length > 0) {
        leads[leads.length - 1].shared = true;
        localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    }
}

// ===== NAT Click Tracking =====
document.addEventListener('DOMContentLoaded', () => {
    const natBtn = document.getElementById('btnApplyNAT');
    if (natBtn) {
        natBtn.addEventListener('click', (e) => {
            trackEvent('nat_clicked', { career: state.result?.career?.title });
            const leads = getLeads();
            if (leads.length > 0) {
                leads[leads.length - 1].natClicked = true;
                localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
            }
        });
    }
});

// ===== Restart =====
function restartAssessment() {
    state.currentStep = 1;
    state.selectedStream = null;
    state.selectedInterests = [];
    state.personality = {};
    state.userData = {};
    state.result = null;
    
    // Reset form
    document.getElementById('userName').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userState').value = '';
    document.getElementById('userBoard').value = '';
    document.getElementById('userPercentage').value = '';
    
    // Reset selections
    document.querySelectorAll('.chip.selected, .interest-card.selected, .pq-btn.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Reset steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step-1').classList.add('active');
    
    // Reset processing
    document.querySelectorAll('.proc-step').forEach(s => {
        s.classList.remove('active', 'done');
        s.querySelector('.proc-icon').textContent = '⏳';
    });
    
    // Reset progress bar
    document.getElementById('progressBar').style.width = '25%';
    document.getElementById('progressText').textContent = 'Step 1 of 4';
    
    showScreen('screen-assessment');
    trackEvent('assessment_restarted', {});
}

// ===== Dashboard =====
function toggleDashboard() {
    const overlay = document.getElementById('dashboardOverlay');
    overlay.classList.toggle('active');
    if (overlay.classList.contains('active')) {
        renderDashboard();
    }
}

function renderDashboard() {
    const leads = getLeads();
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    
    // Stats
    document.getElementById('dashTotalLeads').textContent = leads.length;
    
    const today = new Date().toDateString();
    const todayLeads = leads.filter(l => new Date(l.timestamp).toDateString() === today).length;
    document.getElementById('dashTodayLeads').textContent = todayLeads;
    
    const natClicks = leads.filter(l => l.natClicked).length;
    const conversionRate = leads.length > 0 ? Math.round((natClicks / leads.length) * 100) : 0;
    document.getElementById('dashConversionRate').textContent = `${conversionRate}%`;
    
    const shares = leads.filter(l => l.shared).length;
    const shareRate = leads.length > 0 ? Math.round((shares / leads.length) * 100) : 0;
    document.getElementById('dashShareRate').textContent = `${shareRate}%`;
    
    // Populate filters
    const stateFilter = document.getElementById('dashFilterState');
    const careerFilter = document.getElementById('dashFilterCareer');
    
    const states = [...new Set(leads.map(l => l.state))];
    const careers = [...new Set(leads.map(l => l.careerMatch))];
    
    stateFilter.innerHTML = '<option value="all">All States</option>';
    states.forEach(s => {
        stateFilter.innerHTML += `<option value="${s}">${s}</option>`;
    });
    
    careerFilter.innerHTML = '<option value="all">All Careers</option>';
    careers.forEach(c => {
        careerFilter.innerHTML += `<option value="${c}">${c}</option>`;
    });
    
    // Table
    renderDashboardTable(leads);
}

function renderDashboardTable(leads) {
    const tbody = document.getElementById('dashboardTableBody');
    tbody.innerHTML = '';
    
    leads.slice().reverse().forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${lead.name}</td>
            <td>+91 ${lead.phone}</td>
            <td>${lead.state}</td>
            <td>${lead.careerMatch}</td>
            <td>${lead.matchScore}%</td>
            <td>${lead.natClicked ? '✅' : '—'}</td>
            <td>${lead.shared ? '✅' : '—'}</td>
            <td>${lead.language?.toUpperCase() || 'EN'}</td>
            <td>${new Date(lead.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterDashboard() {
    const stateVal = document.getElementById('dashFilterState').value;
    const careerVal = document.getElementById('dashFilterCareer').value;
    
    let leads = getLeads();
    if (stateVal !== 'all') leads = leads.filter(l => l.state === stateVal);
    if (careerVal !== 'all') leads = leads.filter(l => l.careerMatch === careerVal);
    
    renderDashboardTable(leads);
}

function exportLeads() {
    const leads = getLeads();
    if (leads.length === 0) {
        showToast('No leads to export');
        return;
    }
    
    const headers = ['Name', 'Phone', 'State', 'Board', 'Stream', 'Percentage', 'Interests', 'Career Match', 'Match Score', 'Campus', 'Language', 'NAT Clicked', 'Shared', 'Timestamp'];
    const rows = leads.map(l => [
        l.name, l.phone, l.state, l.board, l.stream, l.percentage,
        (l.interests || []).join('; '), l.careerMatch, l.matchScore,
        l.campus, l.language, l.natClicked, l.shared, l.timestamp
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerdna_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('CSV exported! 📥');
    trackEvent('leads_exported', { count: leads.length });
}

// ===== Utilities =====
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shakeElement(id) {
    const el = document.getElementById(id);
    el.style.borderColor = '#ef4444';
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.animation = '';
    }, 600);
}

function showToast(msg) {
    // Remove existing
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(style);

// ===== Live Counter Animation =====
function animateCounter() {
    const counter = document.getElementById('liveCounter');
    if (!counter) return;
    
    let base = 47832;
    setInterval(() => {
        base += Math.floor(Math.random() * 3);
        counter.textContent = base.toLocaleString('en-IN');
    }, 5000);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    document.getElementById('btnStart').addEventListener('click', () => {
        showScreen('screen-assessment');
        trackEvent('assessment_started', {});
    });
    
    // Animate counter
    animateCounter();
    
    // Track page view
    trackEvent('page_viewed', { referrer: document.referrer, lang: currentLang });
});
