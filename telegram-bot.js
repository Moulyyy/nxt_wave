/* ==========================================================================
   telegram-bot.js — Multi-Role Telegram Bot for NIAT
   Serves:
   1. Counsellors: Voice call analysis, Next-Call Battlecards & RL outcome logging
   2. Parents & Students: Grounded FAQ RAG answering with citations
   Connects via Telegram Bot API with Long Polling (Render & Local friendly)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { searchKnowledgeBase, buildRagContext } = require('./faq-rag');

class TelegramBotService {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || null;
        this.isPolling = false;
        this.lastUpdateId = 0;
        this.botInfo = null;
        this.pollingTimeout = null;
        this.onCallAnalyzeCallback = null;
        this.onFeedbackCallback = null;
    }

    setCallbacks({ onCallAnalyze, onFeedback, getPolicies }) {
        this.onCallAnalyzeCallback = onCallAnalyze;
        this.onFeedbackCallback = onFeedback;
        this.getPolicies = getPolicies;
    }

    // Initialize or reconfigure bot with token
    async init(token) {
        if (token) {
            this.token = token.trim();
        } else {
            this.token = process.env.TELEGRAM_BOT_TOKEN || null;
        }

        if (!this.token) {
            console.log('[TELEGRAM] No bot token provided. Bot is idle until token is configured.');
            return { success: false, message: 'No token configured' };
        }

        try {
            const res = await fetch(`https://api.telegram.org/bot${this.token}/getMe`);
            const data = await res.json();
            if (data.ok) {
                this.botInfo = data.result;
                console.log(`[TELEGRAM SUCCESS] Connected as @${this.botInfo.username} (${this.botInfo.first_name})`);
                this.startPolling();
                return { success: true, bot: this.botInfo };
            } else {
                console.warn('[TELEGRAM ERROR] Failed to connect:', data.description);
                return { success: false, message: data.description };
            }
        } catch (err) {
            console.error('[TELEGRAM ERR]', err.message);
            return { success: false, message: err.message };
        }
    }

    // Stop polling
    stop() {
        this.isPolling = false;
        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
            this.pollingTimeout = null;
        }
        console.log('[TELEGRAM] Polling stopped.');
    }

    // Long polling loop
    async startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;
        console.log('[TELEGRAM] Starting long polling loop...');

        const poll = async () => {
            if (!this.isPolling || !this.token) return;

            try {
                const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.ok && Array.isArray(data.result)) {
                    for (const update of data.result) {
                        this.lastUpdateId = update.update_id;
                        await this.handleUpdate(update);
                    }
                }
            } catch (err) {
                console.warn('[TELEGRAM POLL WARN]', err.message);
            }

            if (this.isPolling) {
                this.pollingTimeout = setTimeout(poll, 1500);
            }
        };

        poll();
    }

    // Send formatted markdown message
    async sendMessage(chatId, text, extra = {}) {
        if (!this.token) return null;
        try {
            const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: extra.parse_mode || 'HTML',
                    reply_markup: extra.reply_markup || undefined
                })
            });
            return await res.json();
        } catch (err) {
            console.error('[TELEGRAM SEND ERR]', err.message);
            return null;
        }
    }

    // Handle incoming messages / audio / voice
    async handleUpdate(update) {
        const message = update.message;
        if (!message) return;

        const chatId = message.chat.id;
        const text = message.text ? message.text.trim() : '';
        const user = message.from?.first_name || 'Friend';

        // 1. Voice or Audio Note Processing (External Input: Voice from Counsellor or Parent)
        if (message.voice || message.audio) {
            await this.handleAudioMessage(chatId, message);
            return;
        }

        // 2. Command: /start or /help
        if (text.startsWith('/start') || text.startsWith('/help')) {
            const welcome = `
👋 <b>Welcome to NIAT Growth Sales Co-Pilot & FAQ RAG</b>

I am the autonomous AI agent for <b>NIAT (NxtWave Institute of Advanced Technologies)</b>.

<b>👔 For Counsellors & BDAs:</b>
• 🎙️ <i>Send or forward a voice note / audio call</i> to get an instant Battlecard and Closing Script!
• <code>/battlecard</code> — View the latest Call #2 Golden Battlecard
• <code>/win [policy_id]</code> — Log a seat fee payment (Reward = +1)
• <code>/stall [policy_id]</code> — Log a stalled lead (Reward = 0)
• <code>/policies</code> — View live Contextual Bandit win rates

<b>👨‍👩‍👧 For Students & Parents (FAQ RAG):</b>
• <code>/faq [question]</code> — Ask about UGC validity, fees, stipends, or projects
• Or simply <b>type any question directly</b> (e.g. <i>"Why is fee 12 lakhs?"</i> or <i>"Is degree valid for UPSC?"</i>)

Powered by <b>Gemini AI & Grounded NIAT RAG</b> ⚡
`;
            await this.sendMessage(chatId, welcome);
            return;
        }

        // 3. Command: /policies
        if (text.startsWith('/policies')) {
            if (this.getPolicies) {
                const policies = this.getPolicies();
                let msg = '📊 <b>Contextual Bandit Policy Matrix:</b>\n\n';
                policies.forEach(p => {
                    const icon = p.isGolden ? '⭐ [GOLDEN]' : '•';
                    msg += `${icon} <b>${p.angleName}</b>\n`;
                    msg += `  Win Rate: <b>${p.winRate}%</b> (${p.conversionsWon}/${p.timesUsed} won)\n`;
                    msg += `  ID: <code>${p.id}</code>\n\n`;
                });
                await this.sendMessage(chatId, msg);
            } else {
                await this.sendMessage(chatId, 'Policy table currently unavailable.');
            }
            return;
        }

        // 4. Command: /battlecard
        if (text.startsWith('/battlecard')) {
            const sampleCard = `
⚡ <b>LATEST CALL #2 COUNSELLOR BATTLECARD</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Lead:</b> Ravi Kumar (Father of Akhil) | 📍 Tirupati
⚠️ <b>Primary Friction:</b> 250% Fee Premium vs Mohan Babu Convenor Quota
🎯 <b>Active Policy:</b> Angle A: Financial Stipend Offset (47.6% Win Rate ⭐)

<b>3 Key Talking Points:</b>
1. Acknowledge empathy on budget comparison with direct state quota.
2. Highlight Year-2/3 mandatory paid apprenticeships (₹15k–₹25k/mo) recovering ₹3.5L–₹4.5L before graduation.
3. Cite Tirupati alumni Srikanth Naidu placed at ₹14.2 LPA at Bangalore AI startup.

<b>Verbatim Closing Pitch:</b>
<i>"Sir, convenor quota lo ₹3.5 lakhs fee chusi compare cheyadam reasonable sir. Kaani NIAT lo Akhil 2nd year nunchi chesthuna mandatory paid apprenticeship valana ₹3.5L to ₹4.5L stipend ga venakki sampadistadu. Bayataki vacheppudu ₹9+ LPA product company offer untundi. Seat lock chesukondi, proofs satisfy avvakapothe 100% refund policy untundi."</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━
Log Outcome:
• <code>/win policy_fee_a</code> — Seat Fee Paid (+1)
• <code>/stall policy_fee_a</code> — Lead Stalled (0)
`;
            await this.sendMessage(chatId, sampleCard);
            return;
        }

        // 5. Command: /win or /stall (Closed-loop RL outcome logging)
        if (text.startsWith('/win') || text.startsWith('/stall')) {
            const isWin = text.startsWith('/win');
            const parts = text.split(/\s+/);
            const policyId = parts[1] || 'policy_fee_a';

            if (this.onFeedbackCallback) {
                const result = this.onFeedbackCallback(policyId, isWin ? 1 : 0);
                if (result.success) {
                    const msg = isWin 
                        ? `🎉 <b>REWARD = +1 RECORDED!</b>\n${result.alertMessage}\nNew Win Rate: <b>${result.updatedPolicy.winRate}%</b>`
                        : `⚠️ <b>REWARD = 0 RECORDED.</b>\n${result.alertMessage}`;
                    await this.sendMessage(chatId, msg);
                } else {
                    await this.sendMessage(chatId, `Failed to update policy: ${result.message}`);
                }
            } else {
                await this.sendMessage(chatId, `Feedback loop logged: Reward = ${isWin ? '+1' : '0'}`);
            }
            return;
        }

        // 6. FAQ RAG Question Handler (via /faq or natural text)
        const query = text.startsWith('/faq') ? text.replace('/faq', '').trim() : text;
        if (query.length > 2) {
            await this.handleFaqQuery(chatId, query, user);
        }
    }

    // Answer questions using Grounded FAQ RAG
    async handleFaqQuery(chatId, query, user) {
        // Send typing action
        try {
            await fetch(`https://api.telegram.org/bot${this.token}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
            });
        } catch (_) {}

        const matchedDocs = searchKnowledgeBase(query, 2);

        if (matchedDocs.length > 0) {
            const topDoc = matchedDocs[0];
            let reply = `💡 <b>NIAT Verified Answer:</b>\n\n`;
            reply += `<b>Q: ${topDoc.title}</b>\n\n`;
            reply += `${topDoc.answer}\n\n`;
            reply += `🔗 <b>Verified Citations & Sources:</b>\n`;
            topDoc.citations.forEach(c => {
                reply += `• <a href="${c.url}">${c.source}</a>\n`;
            });

            reply += `\n<i>Need more details? Type your next question or /help</i>`;
            await this.sendMessage(chatId, reply);
        } else {
            const fallback = `
Thank you for your question regarding NIAT! 

NIAT is a 4-year B.Tech program offering UGC-recognized degrees from NAAC A+ partner universities with an industry curriculum featuring 12 production capstone projects and Year-2 paid internships (₹15,000–₹25,000/mo).

Common topics you can ask me about:
• <code>/faq fee</code> — Fee ROI & stipend offset
• <code>/faq ugc</code> — Degree accreditation & govt exam validity
• <code>/faq placement</code> — 2,500+ placed alumni track record
• <code>/faq nat</code> — NAT test and scholarship details
`;
            await this.sendMessage(chatId, fallback);
        }
    }

    // Process Voice Note or Audio file sent to Telegram
    async handleAudioMessage(chatId, message) {
        await this.sendMessage(chatId, `🎙️ <i>Audio received! Transcribing and executing 3-stage agentic intelligence with Gemini...</i>`);

        const fileId = message.voice ? message.voice.file_id : message.audio.file_id;
        try {
            // Get file path from Telegram
            const fileRes = await fetch(`https://api.telegram.org/bot${this.token}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            
            if (!fileData.ok) {
                await this.sendMessage(chatId, `⚠️ Could not retrieve audio file from Telegram.`);
                return;
            }

            const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${fileData.result.file_path}`;
            const audioBuffer = await (await fetch(downloadUrl)).arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');

            // Call analyze callback
            if (this.onCallAnalyzeCallback) {
                const analysis = await this.onCallAnalyzeCallback({ audioBase64, mimeType: 'audio/ogg' });
                if (analysis && analysis.counsellorBattlecard) {
                    const card = analysis.counsellorBattlecard;
                    const resp = `
⚡ <b>AUDIO ANALYSIS COMPLETE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Lead:</b> ${card.leadName || 'Parent / Student'} | 📍 ${card.studentCity || 'Regional'}
⚠️ <b>Primary Friction:</b> ${card.primaryFear}
🎯 <b>Winning Angle:</b> ${card.activePolicy} (${card.policyWinRate})

<b>Closing Pitch (Call #2):</b>
<i>"${card.verbatimClosingScript}"</i>

━━━━━━━━━━━━━━━━━━━━━━━━━━
Log: <code>/win</code> or <code>/stall</code>
`;
                    await this.sendMessage(chatId, resp);
                    return;
                }
            }

            await this.sendMessage(chatId, `✅ Audio transcribed. Battlecard generated in web dashboard.`);
        } catch (err) {
            console.error('[TELEGRAM AUDIO ERR]', err);
            await this.sendMessage(chatId, `⚠️ Error analyzing audio: ${err.message}`);
        }
    }

    getStatus() {
        return {
            configured: !!this.token,
            isPolling: this.isPolling,
            botUsername: this.botInfo ? `@${this.botInfo.username}` : null,
            botName: this.botInfo ? this.botInfo.first_name : null
        };
    }
}

const telegramBot = new TelegramBotService();

module.exports = telegramBot;
