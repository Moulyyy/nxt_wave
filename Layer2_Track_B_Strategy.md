# Layer 2: Track B Strategy (Bottom-of-Funnel — Lead to Sale)

### The Avenue: Call-to-Close RL Sales & Parent Proof Engine
**One-Liner:** An AI conversion engine that listens to parent-counsellor call recordings, sequentially searches real facts on whatever local college the parent mentioned, sends a custom closing battlecard to the counsellor’s WhatsApp + a tailored proof sheet to the parent, and learns which pitch closes seat fees using Reinforcement Learning.

---

### 1. What It Is & Why NIAT Isn't Running It Today
After students finish the ₹1,200 NAT exam, the entire admission depends on a 40-minute call between an Academic Counsellor and the parents to collect a ₹25,000–₹50,000 seat booking fee.

Right now, ~65–70% of qualified leads stall here. Counsellors take 8 to 12 calls daily and get exhausted. If a parent in Guntur or Warangal compares NIAT to a local EAPCET college (like CMR or Mohan Babu University), the counsellor doesn't have exact comparison facts off the top of their head. They spend 15 minutes after each call trying to remember notes or send generic, pushy WhatsApp texts ("Last chance to claim scholarship!"). On Reddit (r/Btechtards) and Quora, parents constantly complain that NIAT counsellors push generic sales scripts without answering their real doubts. NIAT isn't running an automated system that turns raw call audio into verified local-college comparisons and learns which exact objection-handling pitch actually makes parents pay.

---

### 2. Why It Fits NIAT Specifically
* **Solving the 250% Fee Difference:** NIAT’s hardest objection is when parents say: *"Why should I pay ₹12L–₹16L for NIAT at a partner campus when my kid can get a local college like CMR or even the same partner university through state quota for ₹3L–₹4L?"* A human counsellor cannot memorize fee and placement realities for 500+ local colleges. Our system runs live sequential search to compare the local college's real stats against NIAT's Year-2 paid internships (₹15k–₹25k/month stipend offsetting ₹3.5L–₹4.5L), handing both the counsellor and parent the exact math.
* **Handling Telugu / Hindi / Tamil Code-Mixing:** Most parent calls aren't in formal English—they happen in mixed Telugu-English or Hindi-English. The system uses Indian-language speech-to-text to pick up the parent's exact emotional doubts.

---

### 3. Our Hypothesis (With Best-Guess Numbers)
* **Current Baseline:** Counsellors lose ~2 hours/day on manual follow-up prep, and ~68% of post-NAT parent calls fail to convert to a seat fee within 7 days because specific parent objections go unanswered.
* **Hypothesis:** Giving counsellors an instant, sequentially researched Call #2 Battlecard + sending parents a personalized vernacular proof note within 2 minutes of Call #1—backed by an RL loop that promotes winning scripts—will cut counsellor prep time by 80% (from 15 mins to <3 mins) and lift 7-day Call-to-Seat-Fee conversion by 18–22%.

---

### 4. How the Engine Works (Step-by-Step)
1. **Call Audio Upload:** The counsellor uploads the call recording or drops a quick voice note right after Call #1.
2. **3-Step Sequential Search:**
   * Extracts the parent's core hesitation (e.g., fee difference or UGC degree validity) and the local college they mentioned.
   * Runs a live web search on that competing college to pull its real median placement and syllabus gaps.
   * Pulls verified NIAT facts from our curriculum knowledge base (UGC Section 2(f) proof, paid internship stipends, and regional student startups).
3. **Reinforcement Learning (Contextual Bandit) Loop:**
   * Selects the highest-converting pitch angle (Fee Offset Math vs. Local Student Proof vs. UGC Degree Safety).
   * **If the parent pays the seat fee (Reward = +1):** That script is promoted to a "Golden Template" and triggers an instant alert for all counsellors to use.
   * **If the lead stalls (Reward = 0):** The engine lowers that script's score and automatically mutates to a new angle for the next follow-up call.
4. **MCP WhatsApp / Telegram Delivery:** Pushes the next-call script directly to the counsellor's phone via MCP, along with a ready-to-forward vernacular summary card for the parent.

---

### 5. The ONE Experiment We'd Run First & Success Threshold
* **Test Setup (10-Day Sprint):** 20 counsellors handling ~400 post-NAT parent calls across AP and Telangana. 10 counsellors use the AI Call-to-Close RL Engine (Test = 200 calls); 10 use the standard manual follow-up flow (Control = 200 calls).
* **Primary Metric:** 7-Day Post-Call Seat Booking Fee Conversion Rate.
* **Success Threshold:** $\ge$ 16% relative increase in paid seat reservations in the Test group, and counsellor prep time dropping below 3 minutes per call. (If conversion lift stays under 10% after 200 calls, we kill the experiment).
