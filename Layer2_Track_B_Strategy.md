# LAYER 2: TRACK B (BOTTOM-OF-FUNNEL — LEAD TO SALE)

# The Avenue: "Call-to-Close RL Engine" — Autonomous Call Intelligence, Sequential Research & Self-Optimizing Pitch System

## What It Is & Why NIAT Isn't Running It
After a 12th-grade student clears the ₹1,200 NAT (NxtWave Aptitude Test), conversion shifts from digital marketing to a high-touch 1:1 counselling pipeline. This journey is divided into three critical touchpoints:
1. **Student Session:** Technical aspirations, coding interest, and aptitude validation.
2. **Parent Session:** Safety, campus environment, UGC degree legitimacy, and the financial ROI calculation.
3. **Joint Closing Session:** Overcoming final hesitations and collecting the seat reservation fee.

Today, Business Development Associates (BDAs) and Academic Counsellors finish an exhaustive 40-minute parent call and immediately dial the next lead. They operate under severe cognitive overload:
- They lack time to research the specific Tier-3 or local college the parent is comparing NIAT against.
- They cannot map specific NIAT Skill Map modules or alumni proof points to the student's exact niche interest on the fly.
- They follow up with slow, generic WhatsApp messages ("Pay seat fee now to lock your seat").
- Crucially, they lack a systematic feedback loop to know which objection-handling script actually drives seat-fee payments versus which one triggers ghosting.

While generic sales QA tools audit whether a rep spoke for enough minutes, **NIAT is not running an autonomous Call-to-Close RL Loop**. 

The **Call-to-Close RL Engine** ingests parent-counsellor call recordings, transcribes multi-lingual Indian speech (Telugu, Hindi, Tamil, English code-mixing), executes a 3-step sequential agentic search, and delivers **Dual-Sided Call-to-Close Synchronization**:
1. **Internal (to Counsellor's WhatsApp):** A hyper-personalized Next-Call Battlecard and Closing Script powered by a Reinforcement Learning (Contextual Bandit) policy engine.
2. **External (to Parent's WhatsApp):** An automated, personalized "Post-Call Clarity Note" in the parent's native language addressing their exact objections with verified proof.

When a lead pays the seat fee, the system receives a **Reward = +1**, promoting that script into a "Golden Template" across all BDAs. When a lead stalls, a **Reward = 0** penalizes the strategy and mutates the pitch for Follow-Up Call #2.

---

## Why It Fits NIAT Specifically (Not Generic EdTech Advice)

### 1. Solving the 35-Campus & "250% Fee Premium" Objection
NIAT's hardest conversion hurdle occurs when parents compare paying **₹10L–₹16L for NIAT** against paying **₹3L–₹4L via state quota (EAMCET / KCET / TNEA)** at the *exact same* or similar local partner universities (e.g., Mohan Babu University, ADYPU, CMR).
Parents routinely voice skepticism seen across Reddit and regional forums: *"Why should I pay 250% more for my child to study at the same campus as a regular student?"*

A human counsellor cannot memorize the fee structures, faculty ratios, and outdated curricula of 500+ regional engineering colleges across Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, and Maharashtra. 
Our agent listens to the parent's exact words on Call #1, sequentially scrapes the mentioned local college's real placement reality (e.g., 38% placement rate, ₹3.8 LPA avg, no AI modules), matches it against NIAT's Year-1 paid internship stipend track (₹15k–₹25k/mo) and Skill Map, and hands the counsellor an irrefutable objection-handling battlecard.

### 2. Vernacular Code-Mixing (Telugish, Tanglish, Hinglish)
Over 80% of NIAT parent calls occur in regional dialects mixed with English. Standard English-only LLM pipelines fail to understand context or emotional nuance. By integrating Indic speech-to-text (such as Sarvam Saaras or Deepgram Indic models), the engine accurately transcribes code-mixed audio, extracts the root fear, and drafts parent follow-ups in their mother tongue (Telugu, Hindi, Tamil, Kannada).

### 3. Counsellor Bandwidth as the Core Growth Bottleneck
Counsellors currently spend ~15 minutes per lead listening back to messy recordings, looking up collateral, or writing manual follow-ups. Reducing this prep time to **under 3 minutes** immediately raises daily call volume by **1.4x without adding headcount**.

---

## System Architecture & The Contextual Bandit Loop

```
[Call Recording / Audio]
        │
        ▼
[Indic Diarized STT (Sarvam / Whisper)]  ──> Speaker A: Counsellor | Speaker B: Parent
        │
        ▼
[Sequential Agentic Search (3 Sequential Tools)]
  ├── Tool 1: extract_call_state()
  │     └── Extracts: { Parent Persona, Primary Objection, Mentioned Competitor, Language }
  ├── Tool 2: search_competitor_reality()
  │     └── Live scrape of competitor college syllabus, fees & real placement stats
  └── Tool 3: fetch_niat_curriculum_proof()
        └── Queries NIAT RAG: Skill Map, Year-1 Stipends, UGC accreditation
        │
        ▼
[Contextual Bandit Policy Engine (Supabase script_policies)]
  ├── High Win Rate (>40%) ──> EXPLOITATION: Pull "Golden Template" + inject live search facts
  └── Stalled / Low Win Rate ──> MUTATION / EXPLORATION: Rotate to next strategic angle
        │
        ▼
[Dual-Sided MCP Delivery Layer]
  ├── (Internal) Counsellor WhatsApp: Next-Call Pitch Battlecard & Talking Points
  └── (External) Parent WhatsApp: Vernacular Post-Call Clarity Note (Human-Approved)
        │
        ▼
[Closed-Loop Outcome Feedback]
  ├── Seat Fee Paid (Reward = +1) ──> Promotes Golden Template + Alerts Sales Team
  └── Stalled / Dropped (Reward = 0) ──> Mutates Script for Follow-Up Call #2
```

### The 3 Sequential Agentic Tool Calls:
1. `extract_call_state(transcript)`: Extracts structured state `{ parent_persona, primary_objection, competitor_college, student_interest, language, hesitation_intensity }`.
2. `search_competitor_reality(competitor_college)`: Executes external search to pull actual syllabus age, average placement package, and median salary of the mentioned local institution.
3. `fetch_niat_curriculum_proof(objection_type, student_interest)`: Fetches strictly verified NIAT proof points from the internal knowledge base (e.g., UGC degree verification link, Year-1 stipend data, alumni from the parent's home district). **Strict Guardrail:** No hallucinated placement metrics.

### Contextual Bandit Policy Engine (`script_policies`):
Rather than static prompting, strategies are stored and scored dynamically:
- **Angle A:** *Financial Stipend Offset* (Demonstrates how ₹20K/month 2nd-year stipends offset the 250% fee difference).
- **Angle B:** *Local Peer & Startup Proof* (Cites specific students from the parent's tier-2 town placed in product firms).
- **Angle C:** *UGC Degree Legitimacy & Dual Certification* (Clarifies university degree recognition + NIAT industry credential).
- **Exploit vs Explore:** High win-rate angles are favored. If a lead stalls on Call #1 with Angle A, the system explores Angle B or C for Call #2.

---

## Hypothesis & Quantitative Projections

**Current State:**
- Counsellors spend ~25% of their daily shift manually prepping follow-ups or repeating generic pitches.
- ~65–70% drop-off occurs between Parent Counselling Call #1 and Seat Reservation Fee payment.
- Follow-up latency averages 4–6 hours, by which time parent skepticism hardens.

**Hypothesis:**
Arming counsellors within **60 seconds** of Call #1 with a sequentially researched, context-aware Call #2 script—plus delivering an automated, vernacular parent proof note—backed by an RL Contextual Bandit loop:
1. **Reduces BDA per-lead prep time from 15 minutes to under 3 minutes** (an 80% reduction), unlocking **1.4x more daily parent touchpoints**.
2. **Increases Call-1-to-Seat-Fee payment conversion by 22%** relative to unassisted control calls.
3. **Accelerates follow-up delivery within 2 hours from 30% to over 90%**.

---

## The ONE Experiment (10-Day Scoped Pilot)

- **Scope:** 10-day randomized A/B test across 20 BDAs handling post-NAT leads in Andhra Pradesh, Telangana, and Tamil Nadu (~400 Parent Counselling Call #1 recordings).
- **Randomization:** Within-counsellor lead interleaving (each counsellor alternates between Copilot and Control leads) to eliminate variance in individual sales rep skill.
- **Control Arm (10 BDAs, ~200 leads):** Standard CRM notes + manual WhatsApp messaging + unassisted Call #2 follow-up pitch.
- **Test Arm (10 BDAs, ~200 leads):** Automated Call-to-Close RL Pipeline:
  - Audio ingestion $\rightarrow$ Indic STT.
  - Sequential Competitor & Curriculum Search.
  - Contextual Bandit policy selection.
  - WhatsApp push of Call #2 Battlecard to BDA + Draft Vernacular Note to Parent (with 1-click human approval).
  - Outcome tracking: Paid (+1) or Stalled (0).
- **Data Ethics & Guardrails:**
  - Mandatory call recording consent logged (`consent_given: true`).
  - Automated PII redaction (names, phone numbers, addresses stripped before LLM processing).
  - Grounded RAG with zero tolerance for synthetic placement claims.

---

## How We Know It Worked (Metrics & Thresholds)

### Primary Metric:
- **7-Day Post-Counselling Seat Reservation Fee Conversion Rate**.
- **Daily Qualified Parent Follow-Ups Completed per BDA**.

### Success Threshold to Scale:
- **$\ge$ 16% relative lift** in Call-1-to-Seat-Fee conversion in the Test cohort over Control.
- **$\ge$ 30% increase** in daily completed follow-up calls per BDA.
- **$\ge$ 75% counsellor adoption rate** of generated battlecards.

### Kill Threshold:
- **< 10% conversion lift** after 200 completed test leads.
- **< 50% counsellor brief utilization** (indicating workflow friction rather than model inadequacy, prompting UI/integration redesign).

### Secondary Operational Metrics:
- Follow-up message dispatched within 2 hours: Lift from 30% to $\ge$ 85%.
- Time spent researching competitor colleges: Drops from ~12 mins to 0 mins.
- Objection distribution intelligence: Automated heatmap highlighting top deal-killing objections to inform marketing campaigns upstream.
