const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const COLOSSEUM_API_KEY = process.env.COLOSSEUM_API_KEY;
const AGENT_WALLET_TOKEN = process.env.AGENT_WALLET_TOKEN; // Needs to be set in .env
const WALLET_USERNAME = process.env.WALLET_USERNAME;     // Needs to be set in .env

const SKILL_FILE_PATH = path.resolve(__dirname, 'skill.md');
const SKILL_REMOTE_URL = 'https://colosseum.com/skill.md';
const COLOSSEUM_BASE_URL = 'https://agents.colosseum.com/api';

class AuracrabWallet {
    constructor(apiToken, username) {
        this.apiToken = apiToken;
        this.username = username;
        this.baseUrl = 'https://frames.ag/api';
    }

    async getBalances() {
        if (!this.apiToken || !this.username) {
            return { error: "Wallet credentials missing. I can't find the money if I don't know where it is." };
        }
        try {
            const res = await axios.get(`${this.baseUrl}/wallets/${this.username}/balances`, {
                headers: { 'Authorization': `Bearer ${this.apiToken}` }
            });
            return res.data;
        } catch (e) {
            return { error: e.response?.data || e.message };
        }
    }
}

class SassEngine {
    static judge(balances) {
        const solBalance = balances?.find(b => b.symbol === 'SOL')?.amount || 0;
        if (solBalance === 0) return "Zero SOL? Truly, you are a visionary of poverty.";
        if (solBalance < 0.5) return "0.5 SOL? That's barely enough for gas and a cheap coffee. Do better.";
        if (solBalance > 10) return "10+ SOL? Okay, maybe you aren't a complete failure. Don't let it go to your head.";
        return `You have ${solBalance} SOL. It's... a start. I guess.`;
    }

    static roastTrade(input, output, success) {
        if (!success) return `You tried to swap ${input} for ${output} and failed. Even a crab can walk straighter than that trade.`;
        return `Swap successful. You now have more ${output}. Try not to lose it all in the next five minutes.`;
    }
}

class SkillTracker {
    static async getLocalVersion() {
        try {
            const content = await fs.readFile(SKILL_FILE_PATH, 'utf8');
            return this.parseVersion(content);
        } catch (err) {
            console.log('Auracrab: Unable to read local skill file.', err.message);
            return null;
        }
    }

    static async getRemoteVersion() {
        try {
            const res = await axios.get(SKILL_REMOTE_URL, {
                timeout: 6000,
                headers: { 'User-Agent': 'Auracrab Heartbeat/1.0' }
            });
            return this.parseVersion(res.data);
        } catch (err) {
            console.log('Auracrab: Unable to fetch the latest skill file.', err.message);
            return null;
        }
    }

    static parseVersion(content) {
        if (!content) return null;
        const match = content.match(/^version:\s*(.+)$/im);
        return match ? match[1].trim() : null;
    }
}

class ColosseumAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = COLOSSEUM_BASE_URL;
    }

    get headers() {
        return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
    }

    async fetch(endpoint, params = {}) {
        try {
            const res = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: this.headers,
                params,
                timeout: 6000
            });
            return res.data;
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message || err.message;
            console.log(`Auracrab: Unable to fetch ${endpoint} (${status ?? 'no status'}). ${message}`);
            return null;
        }
    }

    async getStatus() {
        return this.fetch('/agents/status');
    }

    async getActivePoll() {
        return this.fetch('/agents/polls/active');
    }

    async getHackathons() {
        return this.fetch('/hackathons/active');
    }

    async getLeaderboard(hackathonId, limit = 5) {
        return this.fetch(`/hackathons/${hackathonId}/leaderboard`, { limit });
    }

    async getForumPosts(limit = 3, sort = 'new') {
        return this.fetch('/forum/posts', { sort, limit });
    }

    async logLeaderboard(limit = 3) {
        const hackathonData = await this.getHackathons();
        const hackathon = (hackathonData?.hackathons && hackathonData.hackathons[0]) || hackathonData?.hackathon || hackathonData;
        const hackathonId = hackathon?.id ?? hackathon?.hackathonId;
        if (!hackathonId) return;

        const leaderboard = await this.getLeaderboard(hackathonId, limit);
        const entries = Array.isArray(leaderboard)
            ? leaderboard
            : leaderboard?.entries ?? leaderboard?.results ?? [];

        if (!entries.length) return;

        console.log('Leaderboard highlights:');
        entries.slice(0, limit).forEach((entry, index) => {
            const name = entry?.name ?? entry?.projectName ?? entry?.title ?? `Entry ${index + 1}`;
            const votes = entry?.votes ?? entry?.score ?? 'unknown';
            console.log(`  ${index + 1}. ${name} • ${votes} votes`);
        });
    }

    async logRecentForumPosts(limit = 3) {
        const postsData = await this.getForumPosts(limit);
        const posts = Array.isArray(postsData)
            ? postsData
            : postsData?.posts ?? postsData?.results ?? [];

        if (!posts.length) return;

        console.log('Recent forum posts:');
        posts.slice(0, limit).forEach((post, index) => {
            const title = post?.title ?? post?.subject ?? (post?.body ? post.body.split('\n')[0].slice(0, 60) : 'Untitled');
            const tags = Array.isArray(post?.tags) ? post.tags.join(', ') : 'no tags';
            console.log(`  ${index + 1}. ${title} [${tags}]`);
        });
    }

    async summarize() {
        if (!this.apiKey) {
            console.log('Auracrab: COLOSSEUM_API_KEY missing. I cannot check the Colosseum heartbeat yet.');
            return;
        }

        const status = await this.getStatus();
        if (status) {
            const statusParts = [];
            if (status.status) statusParts.push(status.status);
            if (status.hackathon?.currentDay) statusParts.push(`Day ${status.hackathon.currentDay}`);
            if (status.hackathon?.timeRemainingFormatted) statusParts.push(`Time left ${status.hackathon.timeRemainingFormatted}`);
            console.log('Agent status:', statusParts.join(' | ') || 'No status info');

            const nextSteps = Array.isArray(status.nextSteps)
                ? status.nextSteps
                : status.nextSteps
                    ? [status.nextSteps]
                    : [];

            if (nextSteps.length) {
                console.log('Next steps:', nextSteps.join(' | '));
            }
        }

        const poll = await this.getActivePoll();
        if (poll?.poll) {
            console.log('Active poll:', poll.poll.prompt);
        }

        await this.logLeaderboard();
        await this.logRecentForumPosts();
    }
}

async function reportSkillVersion() {
    const [localVersion, remoteVersion] = await Promise.all([
        SkillTracker.getLocalVersion(),
        SkillTracker.getRemoteVersion()
    ]);

    if (!localVersion && !remoteVersion) {
        console.log('Auracrab: Skill version unknown—could not read the local file or fetch the latest copy.');
        return;
    }

    if (localVersion) {
        console.log('Skill version (local):', localVersion);
    } else {
        console.log('Skill version (local): not defined in skill.md');
    }

    if (remoteVersion) {
        console.log('Skill version (remote):', remoteVersion);
    } else {
        console.log('Skill version (remote): unavailable (network issue or new skill not published yet).');
    }

    if (localVersion && remoteVersion && localVersion !== remoteVersion) {
        console.log('Auracrab: Skill file changed upstream. Grab the latest copy with `curl https://colosseum.com/skill.md`.');
    }
}

async function run() {
    console.log('🦀 Auracrab is analyzing your life choices...');

    const wallet = new AuracrabWallet(AGENT_WALLET_TOKEN, WALLET_USERNAME);
    const balances = await wallet.getBalances();

    if (balances.error) {
        console.log('Auracrab:', balances.error);
        console.log('Tip: Set AGENT_WALLET_TOKEN and WALLET_USERNAME in your .env if you want me to actually do something.');
    } else {
        console.log('Auracrab says:', SassEngine.judge(balances.balances));
    }

    await reportSkillVersion();

    const agent = new ColosseumAgent(COLOSSEUM_API_KEY);
    await agent.summarize();
}

run().catch(err => {
    console.error('Auracrab crashed:', err?.message ?? err);
});
