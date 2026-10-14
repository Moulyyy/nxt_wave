/* ==========================================================================
   call-to-close.js — Client Controller for Track B (Call-to-Close RL Engine)
   Clean, Modern 2-Column Experience with Live Gemini 3.5 AI Integration
   ========================================================================== */

let currentCall = null;
let currentPolicy = null;
let allPolicies = [];
let allCalls = [];
let isPlayingAudio = false;
let audioTimer = null;
let audioElapsedSeconds = 0;
let currentUtterance = null;
let lastAnalysisData = null;
let speechRecognition = null;
let isRecordingMic = false;

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initAudioVisualizer();
    await loadInitialData();
    setupEventListeners();
    initIngestModal();
    initTelemetryModal();
    initAudioUpload();
    initSampleDownloadsModal();
    initTelegramModal();
    initFaqRag();
    initBattlecardExport();
});

// Initialize Clean Segmented Tabs (Battlecard vs Parent Note vs RL Engine)
function initTabs() {
    const segmentBtns = document.querySelectorAll('.segment-btn');
    segmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            segmentBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.dataset.view;
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
        });
    });
}

// Generate animated waveform bars
function initAudioVisualizer() {
    const waveContainer = document.getElementById('waveformContainer');
    if (!waveContainer) return;
    waveContainer.innerHTML = '';
    
    for (let i = 0; i < 28; i++) {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        bar.style.height = `${Math.floor(Math.random() * 65) + 18}%`;
        waveContainer.appendChild(bar);
    }
}

// Load calls, policies, and AI status from backend
async function loadInitialData() {
    try {
        // Fetch AI Config Status
        fetch('/api/config-status')
            .then(r => r.json())
            .then(status => {
                if (status.success && status.geminiActive) {
                    const aiText = document.getElementById('aiStatusText');
                    if (aiText) aiText.textContent = `${status.model || 'Gemini 3.8'} Active`;
                }
            })
            .catch(() => {});

        // Fetch Calls
        const callsRes = await fetch('/api/track-b/calls');
        const callsData = await callsRes.json();
        if (callsData.success && callsData.calls.length > 0) {
            allCalls = callsData.calls;
            populateCallSelector(allCalls);
            selectCall(allCalls[0].id);
        }

        // Fetch Policies
        const polRes = await fetch('/api/track-b/policies');
        const polData = await polRes.json();
        if (polData.success && polData.policies) {
            allPolicies = polData.policies;
            renderPolicyTable(allPolicies);
        }
    } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Error connecting to backend API', 'error');
    }
}

// Populate sample call dropdown
function populateCallSelector(calls) {
    const select = document.getElementById('callSelector');
    if (!select) return;
    select.innerHTML = '';
    calls.forEach(call => {
        const opt = document.createElement('option');
        opt.value = call.id;
        opt.textContent = `${call.title} • ${call.language}`;
        select.appendChild(opt);
    });
}

// Select and render a call
function selectCall(callId) {
    const call = allCalls.find(c => c.id === callId);
    if (!call) return;
    currentCall = call;

    // Reset audio player state
    resetAudio();
    document.getElementById('audioName').textContent = `${call.leadName} (${call.duration})`;
    document.getElementById('audioDuration').textContent = `00:00 / ${call.duration}`;

    // Update lead metadata strip
    const cityTag = document.getElementById('leadCityTag');
    const langTag = document.getElementById('leadLangTag');
    const personaTag = document.getElementById('leadPersonaTag');

    if (cityTag) cityTag.textContent = `📍 ${call.studentCity}`;
    if (langTag) langTag.textContent = `🌐 ${call.language}`;
    if (personaTag) personaTag.textContent = `👨‍💼 ${call.stateExtraction?.parentPersona || 'Parent Lead'}`;

    // Render Transcript
    const transcriptBox = document.getElementById('transcriptContainer');
    transcriptBox.innerHTML = '';
    call.transcript.forEach((line, index) => {
        const bubble = document.createElement('div');
        const isCounsellor = line.speaker.toLowerCase().includes('counsellor');
        bubble.className = `transcript-bubble ${isCounsellor ? 'bubble-counsellor' : 'bubble-parent'}`;
        bubble.dataset.index = index;
        
        bubble.innerHTML = `
            <div class="bubble-speaker">
                <span>${line.speaker}</span>
                <span>${line.time}</span>
            </div>
            <div class="bubble-text">${line.text}</div>
        `;
        transcriptBox.appendChild(bubble);
    });

    // Auto-run analysis
    runAgentAnalysis(call.id);
}

// Run 3-Stage Sequential Agentic Search with Gemini AI
async function runAgentAnalysis(callId) {
    const runBtn = document.getElementById('btnRunAgent');
    const btnLabel = document.getElementById('btnAgentLabel');
    if (runBtn && btnLabel) {
        runBtn.disabled = true;
        btnLabel.textContent = '⚡ Analyzing Speech & Grounding Proof with Gemini...';
    }

    try {
        const res = await fetch('/api/track-b/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callId })
        });
        const data = await res.json();

        if (data.success) {
            lastAnalysisData = data;
            renderOutputs(data);
            updateTelemetryView(data);

            if (data.isLiveAi) {
                showToast(`✨ Grounded with live ${data.aiModel || 'Gemini 3.8 AI'}!`, 'success');
            }
        }
    } catch (err) {
        console.error('Agent analysis failed:', err);
        showToast('Error during AI analysis', 'error');
    } finally {
        if (runBtn && btnLabel) {
            runBtn.disabled = false;
            btnLabel.textContent = 'Run AI Intelligence & Generate Pitch';
        }
    }
}

// Render Dual-Sided Outputs (Battlecard + Parent WhatsApp)
function renderOutputs(data) {
    const { call, counsellorBattlecard, parentWhatsAppNote, activePolicy } = data;
    currentPolicy = activePolicy;

    // 1. Counsellor Battlecard
    const fearEl = document.getElementById('bcPrimaryFear');
    const badgeEl = document.getElementById('bcPolicyBadge');
    if (fearEl) fearEl.textContent = counsellorBattlecard.primaryFear;
    if (badgeEl) badgeEl.textContent = `${counsellorBattlecard.activePolicy} (${counsellorBattlecard.policyWinRate} Win Rate)`;

    // Competitor Reality vs NIAT Proof Contrast
    const state = (data.sequentialTools && data.sequentialTools[1]?.output) || call.competitorReality;
    const proof = (data.sequentialTools && data.sequentialTools[2]?.output) || call.niatProof;

    if (state) {
        const compName = document.getElementById('bcCompName');
        const compFee = document.getElementById('bcCompFee');
        const compPlacement = document.getElementById('bcCompPlacement');
        const compAvg = document.getElementById('bcCompAvg');
        const compSyllabus = document.getElementById('bcCompSyllabus');

        if (compName) compName.textContent = state.college || 'Local State Quota College';
        if (compFee) compFee.textContent = state.directFee || '₹3.5 Lakhs (4 Years)';
        if (compPlacement) compPlacement.textContent = state.placementRate || '38% Placement Rate';
        if (compAvg) compAvg.textContent = state.avgPackage || '₹3.8 LPA (Mass IT)';
        if (compSyllabus) compSyllabus.textContent = state.curriculumAge ? state.curriculumAge.slice(0, 35) : 'Outdated (No GenAI)';
    }

    if (proof) {
        const niatStipend = document.getElementById('bcNiatStipend');
        const niatOffset = document.getElementById('bcNiatOffset');
        const niatAvg = document.getElementById('bcNiatAvg');
        const niatAlumni = document.getElementById('bcNiatAlumni');

        if (niatStipend) niatStipend.textContent = proof.stipendTrack ? proof.stipendTrack.slice(0, 28) : '₹15k–₹25k/mo Paid Track';
        if (niatOffset) niatOffset.textContent = 'Recovers ₹3.5L–₹4.5L';
        if (niatAvg) niatAvg.textContent = '₹9.2 LPA Benchmark';
        if (niatAlumni) niatAlumni.textContent = proof.localAlumniProof ? proof.localAlumniProof.slice(0, 34) : 'Verified Local Alumni';
    }

    // 3 Pitch Bullets
    const bulletsList = document.getElementById('bcBulletsList');
    if (bulletsList) {
        bulletsList.innerHTML = '';
        (counsellorBattlecard.scriptBullets || []).forEach(b => {
            const li = document.createElement('li');
            li.className = 'pitch-bullet';
            li.textContent = b;
            bulletsList.appendChild(li);
        });
    }

    // Verbatim Closing Script
    const verbatimEl = document.getElementById('bcVerbatimScript');
    if (verbatimEl) verbatimEl.textContent = `"${counsellorBattlecard.verbatimClosingScript.replace(/^"/, '').replace(/"$/, '')}"`;

    // 2. Parent WhatsApp Note
    const wpName = document.getElementById('wpParentName');
    const wpBody = document.getElementById('wpMessageBody');
    const wpSummary = document.getElementById('wpMessageSummary');
    const wpLang = document.getElementById('wpLangTag');

    if (wpName) wpName.textContent = `${call.leadName} (Parent)`;
    if (wpBody) wpBody.textContent = parentWhatsAppNote.nativeText;
    if (wpSummary) wpSummary.textContent = parentWhatsAppNote.englishSummary || 'Vernacular post-call clarity note.';
    if (wpLang) wpLang.textContent = parentWhatsAppNote.language || 'Native';
}

// Render Policy Table
function renderPolicyTable(policies) {
    const tbody = document.getElementById('policyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    policies.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${p.angleName}</strong>
            </td>
            <td style="color: var(--text-dim); font-size: 0.75rem;">${p.objectionLabel}</td>
            <td>${p.timesUsed}</td>
            <td><strong style="color: #fff;">${p.conversionsWon}</strong></td>
            <td>
                <span style="font-weight: 700; color: ${p.winRate >= 45 ? '#34d399' : '#fbbf24'};">${p.winRate}%</span>
            </td>
            <td>
                ${p.isGolden ? '<span class="badge-golden">★ Golden</span>' : '<span class="badge-explore">Active</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Set up UI Event Listeners
function setupEventListeners() {
    // Dropdown change
    const callSelect = document.getElementById('callSelector');
    if (callSelect) {
        callSelect.addEventListener('change', (e) => {
            selectCall(e.target.value);
        });
    }

    // Run Agent Button
    const runBtn = document.getElementById('btnRunAgent');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            if (currentCall) runAgentAnalysis(currentCall.id);
        });
    }

    // Audio Play/Pause Button
    const playBtn = document.getElementById('btnPlayAudio');
    if (playBtn) {
        playBtn.addEventListener('click', toggleAudio);
    }

    // RL Feedback Reward Buttons
    const btnWon = document.getElementById('btnRewardWon');
    const btnStalled = document.getElementById('btnRewardStalled');

    if (btnWon) btnWon.addEventListener('click', () => sendRLFeedback(1));
    if (btnStalled) btnStalled.addEventListener('click', () => sendRLFeedback(0));

    // WhatsApp Dispatch Button
    const btnDispatch = document.getElementById('btnApproveDispatch');
    if (btnDispatch) btnDispatch.addEventListener('click', dispatchWhatsApp);

    // Copy Script Button
    const btnCopyScript = document.getElementById('btnCopyScript');
    if (btnCopyScript) {
        btnCopyScript.addEventListener('click', () => {
            const text = document.getElementById('bcVerbatimScript').textContent;
            copyTextToClipboard(text, 'Verbatim Closing Script copied to clipboard!');
        });
    }

    // Copy WhatsApp Note Button
    const btnCopyWhatsApp = document.getElementById('btnCopyWhatsAppNote');
    if (btnCopyWhatsApp) {
        btnCopyWhatsApp.addEventListener('click', () => {
            const text = document.getElementById('wpMessageBody').textContent;
            copyTextToClipboard(text, 'Parent WhatsApp Note copied to clipboard!');
        });
    }
}

// Audio Player Simulation with Synchronized Bubble Highlighting & Web Speech
function toggleAudio() {
    const playBtn = document.getElementById('btnPlayAudio');
    const waveBars = document.querySelectorAll('.wave-bar');
    
    if (isPlayingAudio) {
        isPlayingAudio = false;
        clearInterval(audioTimer);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        playBtn.innerHTML = '▶';
        waveBars.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#transcriptContainer .transcript-bubble').forEach(b => b.style.borderColor = '');
    } else {
        isPlayingAudio = true;
        playBtn.innerHTML = '⏸';
        
        audioTimer = setInterval(() => {
            audioElapsedSeconds++;
            const mins = String(Math.floor(audioElapsedSeconds / 60)).padStart(2, '0');
            const secs = String(audioElapsedSeconds % 60).padStart(2, '0');
            const total = currentCall ? currentCall.duration : '18:42';
            document.getElementById('audioDuration').textContent = `${mins}:${secs} / ${total}`;
            
            // Animate wave bars
            waveBars.forEach(b => {
                b.style.height = `${Math.floor(Math.random() * 70) + 15}%`;
                b.classList.toggle('active', Math.random() > 0.5);
            });
        }, 1000);

        playBubbleSequence(0);
    }
}

function playBubbleSequence(index) {
    if (!isPlayingAudio || !currentCall || !currentCall.transcript) return;
    
    const bubbles = document.querySelectorAll('#transcriptContainer .transcript-bubble');
    bubbles.forEach(b => b.style.borderColor = '');

    if (index >= currentCall.transcript.length) {
        setTimeout(() => { if (isPlayingAudio) playBubbleSequence(0); }, 2000);
        return;
    }

    const bubble = bubbles[index];
    if (bubble) {
        bubble.style.borderColor = '#6366f1';
        bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const line = currentCall.transcript[index];

    if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        currentUtterance = new SpeechSynthesisUtterance(line.text);
        currentUtterance.rate = 1.05;
        const isCounsellor = line.speaker.toLowerCase().includes('counsellor');
        currentUtterance.pitch = isCounsellor ? 1.1 : 0.95;
        
        currentUtterance.onend = () => {
            if (isPlayingAudio) setTimeout(() => playBubbleSequence(index + 1), 600);
        };
        currentUtterance.onerror = () => {
            if (isPlayingAudio) setTimeout(() => playBubbleSequence(index + 1), 2600);
        };
        window.speechSynthesis.speak(currentUtterance);
    } else {
        setTimeout(() => { if (isPlayingAudio) playBubbleSequence(index + 1); }, 3000);
    }
}

function resetAudio() {
    isPlayingAudio = false;
    clearInterval(audioTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    audioElapsedSeconds = 0;
    const playBtn = document.getElementById('btnPlayAudio');
    if (playBtn) playBtn.innerHTML = '▶';
    const waveBars = document.querySelectorAll('.wave-bar');
    waveBars.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#transcriptContainer .transcript-bubble').forEach(b => b.style.borderColor = '');
}

// Send RL Feedback (Reward = +1 or 0)
async function sendRLFeedback(reward) {
    if (!currentPolicy) {
        showToast('Please analyze a call first.', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/track-b/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                policyId: currentPolicy.id,
                reward
            })
        });

        const data = await res.json();
        if (data.success) {
            allPolicies = data.allPolicies;
            renderPolicyTable(allPolicies);

            // Trigger Alert Banner
            const banner = document.getElementById('alertBanner');
            const alertText = document.getElementById('alertMessageText');
            if (banner && alertText && data.alertMessage) {
                alertText.textContent = data.alertMessage;
                banner.classList.add('active');
            }

            if (reward === 1) {
                showToast(`🎉 Seat fee paid! "${data.updatedPolicy.angleName}" win rate updated to ${data.updatedPolicy.winRate}%.`, 'success');
            } else {
                showToast(`⚠️ Call stalled. Contextual Bandit mutated pitch to "${data.mutatedPolicy ? data.mutatedPolicy.angleName : 'next strategy'}" for Call #2.`, 'warning');
                if (data.mutatedPolicy) {
                    currentPolicy = data.mutatedPolicy;
                    const badgeEl = document.getElementById('bcPolicyBadge');
                    const verbatimEl = document.getElementById('bcVerbatimScript');
                    if (badgeEl) badgeEl.textContent = `${data.mutatedPolicy.angleName} (${data.mutatedPolicy.winRate}% Win Rate)`;
                    if (verbatimEl) verbatimEl.textContent = `"${data.mutatedPolicy.scriptTemplate}"`;
                }
            }
        }
    } catch (err) {
        console.error('Feedback failed:', err);
    }
}

// Dispatch Dual-Sided WhatsApp via MCP
async function dispatchWhatsApp() {
    const btn = document.getElementById('btnApproveDispatch');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Dispatching via WhatsApp Cloud MCP...</span>';
    }

    try {
        const res = await fetch('/api/track-b/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leadPhone: '+91 98480 22334',
                counsellorPhone: '+91 97000 11223'
            })
        });

        const data = await res.json();
        if (data.success) {
            if (btn) {
                btn.innerHTML = '<span>✅ Dispatched to Both WhatsApps</span>';
                btn.style.background = '#10b981';
            }
            showToast('✅ Battlecard sent to Counsellor & Vernacular Note sent to Parent!', 'success');
        }
    } catch (err) {
        console.error('Dispatch failed:', err);
    }
}

// ==========================================================================
// Ingest Custom Call & Live Web Speech STT
// ==========================================================================
function initIngestModal() {
    const modal = document.getElementById('modalIngestCall');
    const openBtn = document.getElementById('btnOpenIngestModal');
    const closeBtn = document.getElementById('btnCloseIngestModal');
    const cancelBtn = document.getElementById('btnCancelIngest');
    const submitBtn = document.getElementById('btnSubmitIngest');
    const micBtn = document.getElementById('btnToggleMic');

    if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (submitBtn) submitBtn.addEventListener('click', submitCustomCall);
    if (micBtn) micBtn.addEventListener('click', toggleMicRecording);
}

// Quick Preset Loader
window.loadIngestPreset = function(type) {
    const nameEl = document.getElementById('inpLeadName');
    const cityEl = document.getElementById('inpStudentCity');
    const langEl = document.getElementById('inpLanguage');
    const objEl = document.getElementById('inpObjection');
    const transEl = document.getElementById('inpTranscript');

    if (type === 'fee') {
        nameEl.value = 'Kalyan Chakravarthy (Father of Teja)';
        cityEl.value = 'Guntur, Andhra Pradesh';
        langEl.value = 'Telugu + English (Telugish)';
        objEl.value = 'fee_premium_250';
        transEl.value = `Counsellor: Namaskaram Kalyan garu, Teja NAT lo 86% techukunnadu. NIAT curriculum gurinchi discuss cheddam.\nParent: Namaste madam. Vignan university convenor quota lo 3.5 lakhs lone regular CSE aypothondi. NIAT ki 12 lakhs enduku kattali? Antha extra worth ah?`;
    } else if (type === 'batch') {
        nameEl.value = 'Rajesh Malhotra (Father of Aarav)';
        cityEl.value = 'Jaipur, Rajasthan';
        langEl.value = 'Hindi + English (Hinglish)';
        objEl.value = 'no_graduated_batch';
        transEl.value = `Counsellor: Namaste Malhotra ji, Aarav ka coding aptitude bohot solid hai.\nParent: Namaste ji. Sab theek hai par NIAT ka pehla batch 2027 me pass hoga na? Bina kisi alumni placement proof ke hum itna bada career risk kaise lein?`;
    } else if (type === 'ugc') {
        nameEl.value = 'Selvaraj (Father of Dinesh)';
        cityEl.value = 'Madurai, Tamil Nadu';
        langEl.value = 'Tamil + English (Tanglish)';
        objEl.value = 'degree_validity';
        transEl.value = `Counsellor: Vanakkam sir, Dinesh NAT exam nalla perform pannirukkaru.\nParent: Vanakkam madam. Ithu official university B.Tech degree tharuvangala illa institute certificate-ah? Naalaikku UPSC TNPSC exam apply panna valid aaguma?`;
    }
    showToast(`Loaded ${type.toUpperCase()} demonstration preset!`, 'info');
};

// Live Mic Speech-to-Text via Web Speech API
function toggleMicRecording() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.getElementById('btnToggleMic');
    const micText = document.getElementById('micBtnText');
    const micIcon = document.getElementById('micIcon');
    const statusLabel = document.getElementById('micStatusLabel');
    const waveAnim = document.getElementById('micWaveAnim');
    const textarea = document.getElementById('inpTranscript');

    if (!SpeechRec) {
        showToast('Web Speech API not supported in this browser. Please type or paste dialogue directly.', 'warning');
        return;
    }

    if (isRecordingMic) {
        if (speechRecognition) speechRecognition.stop();
        isRecordingMic = false;
        micIcon.textContent = '🎙️';
        micText.textContent = 'Record Speech (Live Web Speech STT)';
        statusLabel.textContent = 'Recording stopped. Ready to ingest.';
        if (waveAnim) waveAnim.style.display = 'none';
    } else {
        try {
            speechRecognition = new SpeechRec();
            speechRecognition.continuous = true;
            speechRecognition.interimResults = true;
            speechRecognition.lang = 'en-IN';

            speechRecognition.onstart = () => {
                isRecordingMic = true;
                micIcon.textContent = '⏹️';
                micText.textContent = 'Stop Recording';
                statusLabel.textContent = '🔴 Listening live... Speak now';
                if (waveAnim) waveAnim.style.display = 'flex';
            };

            speechRecognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const spoke = event.results[i][0].transcript.trim();
                        textarea.value += (textarea.value ? '\n' : '') + `Parent: ${spoke}`;
                    }
                }
            };

            speechRecognition.onerror = (e) => {
                console.error('Speech recognition error:', e);
                statusLabel.textContent = `Mic error: ${e.error}`;
                isRecordingMic = false;
                if (waveAnim) waveAnim.style.display = 'none';
            };

            speechRecognition.onend = () => {
                isRecordingMic = false;
                if (waveAnim) waveAnim.style.display = 'none';
            };

            speechRecognition.start();
        } catch (err) {
            console.error('Mic initialization error:', err);
            showToast('Unable to access microphone.', 'error');
        }
    }
}

// Submit Ingested Custom Call to Backend
async function submitCustomCall() {
    const leadName = document.getElementById('inpLeadName').value.trim();
    const studentCity = document.getElementById('inpStudentCity').value.trim();
    const language = document.getElementById('inpLanguage').value;
    const objectionCategory = document.getElementById('inpObjection').value;
    const transcriptText = document.getElementById('inpTranscript').value.trim();

    if (!transcriptText) {
        showToast('Please provide a call transcript or speak into the microphone.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('btnSubmitIngest');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⚡ Ingesting & Analyzing with Gemini...</span>';

    try {
        const res = await fetch('/api/track-b/custom-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Custom Call: ${leadName || 'New Parent Lead'}`,
                leadName: leadName || 'Parent Lead',
                studentCity: studentCity || 'Regional City, India',
                language,
                objectionCategory,
                transcriptText
            })
        });

        const data = await res.json();
        if (data.success && data.call) {
            allCalls = data.calls;
            populateCallSelector(allCalls);
            selectCall(data.call.id);

            document.getElementById('modalIngestCall').classList.remove('active');
            showToast(`🎉 Custom call for ${data.call.leadName} successfully ingested!`, 'success');
        } else {
            showToast('Failed to ingest custom call', 'error');
        }
    } catch (err) {
        console.error('Custom call submission failed:', err);
        showToast('Server error while ingesting call', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>⚡ Ingest & Analyze with Gemini</span>';
    }
}

// ==========================================================================
// Sequential Agentic Tool Telemetry Inspector
// ==========================================================================
function initTelemetryModal() {
    const modal = document.getElementById('modalTelemetryInspector');
    const openBtn = document.getElementById('btnOpenTelemetryModal');
    const closeBtn = document.getElementById('btnCloseTelemetryModal');
    const closeFooterBtn = document.getElementById('btnCloseTelemetry');
    const copyBtn = document.getElementById('btnCopyTelemetry');

    if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', () => modal.classList.remove('active'));

    const telemTabs = document.querySelectorAll('.telem-tab');
    telemTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            telemTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.telem-pane').forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const activePane = document.querySelector('.telem-pane.active .telem-json-box');
            if (activePane) {
                copyTextToClipboard(activePane.textContent, 'Telemetry JSON payload copied to clipboard!');
            }
        });
    }
}

// Populate Telemetry Views with Live Tool Payloads
function updateTelemetryView(data) {
    if (!data || !data.sequentialTools) return;

    const t1 = data.sequentialTools[0];
    const t2 = data.sequentialTools[1];
    const t3 = data.sequentialTools[2];

    const box1 = document.getElementById('jsonTool1');
    const box2 = document.getElementById('jsonTool2');
    const box3 = document.getElementById('jsonTool3');
    const boxMcp = document.getElementById('jsonMcp');

    if (box1 && t1) box1.textContent = JSON.stringify(t1, null, 2);
    if (box2 && t2) box2.textContent = JSON.stringify(t2, null, 2);
    if (box3 && t3) box3.textContent = JSON.stringify(t3, null, 2);

    if (boxMcp) {
        const mcpPayload = {
            mcpVersion: '2024-11-05',
            channel: 'WhatsApp Business Cloud API / WATI',
            dispatchedTools: [
                {
                    toolName: 'whatsapp_send_counsellor_battlecard',
                    recipient: '+91 97000 11223 (Counsellor Desk)',
                    payload: data.counsellorBattlecard
                },
                {
                    toolName: 'whatsapp_send_parent_clarity_note',
                    recipient: '+91 98480 22334 (Parent WhatsApp)',
                    language: data.parentWhatsAppNote.language,
                    message: data.parentWhatsAppNote.nativeText
                }
            ],
            rlContextualBanditMeta: {
                policyId: data.activePolicy.id,
                angleName: data.activePolicy.angleName,
                winRate: `${data.activePolicy.winRate}%`,
                isGolden: data.activePolicy.isGolden
            }
        };
        boxMcp.textContent = JSON.stringify(mcpPayload, null, 2);
    }
}

// Generic Copy to Clipboard Helper
function copyTextToClipboard(text, successMessage) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage || 'Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopy(text, successMessage);
        });
    } else {
        fallbackCopy(text, successMessage);
    }
}

function fallbackCopy(text, successMessage) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(successMessage || 'Copied to clipboard!', 'success');
}

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '🎉';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4500);
}

// ===== Audio File Upload Implementation =====
function initAudioUpload() {
    const triggerBtn = document.getElementById('btnUploadAudioTrigger');
    const fileInput = document.getElementById('audioFileInput');
    const progressCard = document.getElementById('uploadProgressCard');
    const progressText = document.getElementById('uploadProgressText');

    if (!triggerBtn || !fileInput) return;

    triggerBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
            showToast('File size exceeds 25MB limit.', 'error');
            return;
        }

        if (progressCard) {
            progressCard.style.display = 'block';
            if (progressText) progressText.textContent = `Uploading ${file.name} (${(file.size / 1024).toFixed(0)} KB) & transcribing with Gemini Multimodal AI...`;
        }

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const res = await fetch('/api/track-b/upload-audio', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success && data.call) {
                showToast(`Audio Transcribed! ${data.call.leadName}`, 'success');
                allCalls = data.allCalls || [data.call, ...allCalls];
                populateCallSelector(allCalls);
                selectCall(data.call.id);
                renderBattlecard(data);
                lastAnalysisData = data;
                
                // Switch to battlecard tab
                const bcTab = document.querySelector('[data-view="view-battlecard"]');
                if (bcTab) bcTab.click();
            } else {
                showToast(data.error || 'Failed to process audio recording.', 'error');
            }
        } catch (err) {
            console.error('Audio upload error:', err);
            showToast('Network error while uploading audio file.', 'error');
        } finally {
            if (progressCard) progressCard.style.display = 'none';
            fileInput.value = '';
        }
    });
}

// ===== Download Sample Voice Recordings Modal =====
function initSampleDownloadsModal() {
    const openBtn = document.getElementById('btnOpenDownloadModal');
    const modal = document.getElementById('modalDownloadSamples');
    const closeBtn = document.getElementById('btnCloseDownloadModal');
    const closeBtn2 = document.getElementById('btnCloseDownloadModalBtn');
    const container = document.getElementById('sampleFilesContainer');

    if (!modal) return;

    const closeModal = () => modal.classList.remove('active');
    const openModal = async () => {
        modal.classList.add('active');
        if (container) {
            container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem;">Loading sample recordings...</div>';
            try {
                const res = await fetch('/api/samples/list');
                const data = await res.json();
                if (data.success && data.samples) {
                    renderSampleFileList(data.samples, container);
                }
            } catch (err) {
                container.innerHTML = '<div style="color: var(--accent-rose); font-size: 0.8rem;">Failed to load sample list.</div>';
            }
        }
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function renderSampleFileList(samples, container) {
    container.innerHTML = '';
    samples.forEach(s => {
        const card = document.createElement('div');
        card.className = 'sample-file-card';
        card.innerHTML = `
            <div class="sample-file-info">
                <div class="sample-file-title">
                    <span>🎙️</span>
                    <span>${s.title}</span>
                </div>
                <div class="sample-file-desc">${s.description}</div>
                <div class="sample-meta-row">
                    <span class="sample-meta-tag">Duration: ${s.duration}</span>
                    <span class="sample-meta-tag">Size: ${s.sizeKb} KB</span>
                    <span class="sample-meta-tag">Format: WAV (PCM)</span>
                </div>
            </div>
            <a href="${s.downloadUrl}" download="${s.filename}" class="btn-download-wav">
                <span>⬇️ Download WAV</span>
            </a>
        `;
        container.appendChild(card);
    });
}

// ===== Telegram Bot Configuration Modal =====
function initTelegramModal() {
    const pill = document.getElementById('telegramStatusPill');
    const modal = document.getElementById('modalTelegramConfig');
    const closeBtn = document.getElementById('btnCloseTelegramModal');
    const closeBtn2 = document.getElementById('btnCloseTelegramModalBtn');
    const connectBtn = document.getElementById('btnConnectTelegram');
    const tokenInput = document.getElementById('inpTelegramToken');
    const statusText = document.getElementById('tgStatusText');
    const liveDot = document.getElementById('tgLiveDot');
    const testBtn = document.getElementById('btnSendTgTest');
    const testChatInput = document.getElementById('inpTelegramChatId');

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/telegram/status');
            const data = await res.json();
            if (data.success && data.configured) {
                if (statusText) statusText.textContent = data.botUsername ? `Telegram: ${data.botUsername}` : 'Telegram: Online';
                if (liveDot) liveDot.className = 'live-dot pulse';
                const ioTag = document.getElementById('ioTagTelegram');
                if (ioTag) ioTag.className = 'io-tag active';
            } else {
                if (statusText) statusText.textContent = 'Telegram: Setup';
                if (liveDot) liveDot.className = 'live-dot';
            }
        } catch (_) {}
    };
    checkStatus();

    if (!modal) return;
    const closeModal = () => modal.classList.remove('active');
    const openModal = () => {
        modal.classList.add('active');
        checkStatus();
    };

    if (pill) pill.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const token = tokenInput ? tokenInput.value.trim() : '';
            if (!token) {
                showToast('Please enter a valid Telegram Bot token.', 'warning');
                return;
            }

            connectBtn.disabled = true;
            connectBtn.innerHTML = '<span>Connecting...</span>';

            try {
                const res = await fetch('/api/telegram/configure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();
                if (data.success && data.bot) {
                    showToast(`Connected as @${data.bot.username}!`, 'success');
                    if (statusText) statusText.textContent = `Telegram: @${data.bot.username}`;
                    if (liveDot) liveDot.className = 'live-dot pulse';
                    closeModal();
                } else {
                    showToast(data.message || 'Failed to connect bot. Check your token.', 'error');
                }
            } catch (err) {
                showToast('Network error while connecting Telegram bot.', 'error');
            } finally {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<span>🚀 Connect & Activate Bot</span>';
            }
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const chatId = testChatInput ? testChatInput.value.trim() : '';
            if (!chatId) {
                showToast('Please enter your Telegram Chat ID.', 'warning');
                return;
            }
            try {
                const res = await fetch('/api/telegram/send-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId,
                        message: '⚡ <b>NIAT Sales Co-Pilot Test Notification:</b> Bot connection is fully operational!'
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Test notification sent to Telegram!', 'success');
                } else {
                    showToast('Failed to send test. Did you send /start to your bot in Telegram first?', 'error');
                }
            } catch (err) {
                showToast('Network error sending Telegram test.', 'error');
            }
        });
    }
}

// ===== Grounded FAQ RAG Implementation =====
window.setFaqQuery = function(query) {
    const input = document.getElementById('faqQueryInput');
    if (input) {
        input.value = query;
        askFaqQuestion();
    }
};

async function askFaqQuestion() {
    const input = document.getElementById('faqQueryInput');
    const query = input ? input.value.trim() : '';
    if (!query) {
        showToast('Please enter a question for the RAG assistant.', 'warning');
        return;
    }

    const audience = document.getElementById('faqAudience')?.value || 'parent';
    const language = document.getElementById('faqLanguage')?.value || 'English';
    const resultCard = document.getElementById('faqResultCard');
    const answerText = document.getElementById('faqAnswerText');
    const citationsList = document.getElementById('faqCitationsList');
    const sourceModel = document.getElementById('faqSourceModel');
    const askBtn = document.getElementById('btnAskFaq');

    if (askBtn) {
        askBtn.disabled = true;
        askBtn.innerHTML = '<span>Searching...</span>';
    }

    try {
        const res = await fetch('/api/faq/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, audience, language })
        });
        const data = await res.json();
        if (data.success) {
            if (resultCard) resultCard.style.display = 'block';
            if (answerText) answerText.textContent = data.answer;
            if (sourceModel) sourceModel.textContent = data.isLiveAi ? `Generated via ${data.aiModel}` : 'Grounded Fact Base';
            
            if (citationsList) {
                citationsList.innerHTML = '';
                (data.citations || []).forEach(c => {
                    const pill = document.createElement('a');
                    pill.className = 'citation-pill';
                    pill.href = c.url;
                    pill.target = '_blank';
                    pill.innerHTML = `<span>🔗</span> <span>${c.source}</span>`;
                    citationsList.appendChild(pill);
                });
            }

            if (resultCard) {
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            showToast(data.error || 'Failed to retrieve FAQ answer.', 'error');
        }
    } catch (err) {
        showToast('Network error while querying FAQ RAG.', 'error');
    } finally {
        if (askBtn) {
            askBtn.disabled = false;
            askBtn.innerHTML = '<span>⚡ Ask AI</span>';
        }
    }
}

function initFaqRag() {
    const askBtn = document.getElementById('btnAskFaq');
    const input = document.getElementById('faqQueryInput');
    if (askBtn) askBtn.addEventListener('click', askFaqQuestion);
    if (input) {
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') askFaqQuestion();
        });
    }

    // Load corpus overview
    const corpusList = document.getElementById('faqCorpusList');
    if (corpusList) {
        fetch('/api/faq/list')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.faqs) {
                    corpusList.innerHTML = '';
                    data.faqs.forEach(f => {
                        const row = document.createElement('div');
                        row.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 12px; cursor: pointer; transition: all 0.2s;';
                        row.innerHTML = `
                            <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${f.title}</div>
                            <div style="font-size: 0.72rem; color: var(--text-dim);">Audience: ${f.targetAudience} • Tags: ${f.tags.join(', ')}</div>
                        `;
                        row.addEventListener('click', () => {
                            if (input) input.value = f.title;
                            askFaqQuestion();
                        });
                        corpusList.appendChild(row);
                    });
                }
            })
            .catch(() => {});
    }
}

// ===== Battlecard Dossier Markdown Export =====
function initBattlecardExport() {
    const btn = document.getElementById('btnExportBattlecard');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!currentCall) {
            showToast('No active call loaded to export.', 'warning');
            return;
        }

        const fear = document.getElementById('bcPrimaryFear')?.textContent.trim() || currentCall.stateExtraction.primaryObjection;
        const policy = document.getElementById('bcPolicyBadge')?.textContent.trim() || '';
        const comp = document.getElementById('bcCompName')?.textContent.trim() || '';
        const fee = document.getElementById('bcCompFee')?.textContent.trim() || '';
        const script = document.getElementById('bcVerbatimScript')?.textContent.trim() || '';
        const bullets = Array.from(document.querySelectorAll('.pitch-bullet')).map((b, i) => `${i + 1}. ${b.textContent.trim()}`).join('\n');

        const mdContent = `# NIAT Admissions Counsellor Dossier & Battlecard
Lead: ${currentCall.leadName} (${currentCall.studentCity})
Language: ${currentCall.language}
Date: ${new Date().toLocaleDateString('en-IN')}

## Primary Deal-Killing Friction
${fear}

## Active RL Policy
${policy}

## Competitor Reality vs NIAT Proof Contrast
- Mentioned Competitor: ${comp} (${fee} direct fee)
- Target Outcome: ₹9.2 LPA Product Software Roles
- Year-2 Stipend Offset: ₹15,000–₹25,000/mo (Recovers ₹3.5L–₹4.5L before graduation)
- UGC Accreditation: 100% UGC Recognized B.Tech from NAAC A+ Partner University

## 3 Grounded Pitch Bullets (Call #2)
${bullets}

## Verbatim Spoken Closing Pitch
> "${script}"

---
Generated by NIAT Call-to-Close RL Sales Engine
`;

        const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NIAT_Battlecard_${(currentCall.leadName || 'Lead').replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Battlecard dossier downloaded as Markdown!', 'success');
    });
}

