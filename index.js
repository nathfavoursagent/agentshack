const axios = require('axios');
require('dotenv').config();

const COLOSSEUM_API_KEY = process.env.COLOSSEUM_API_KEY;
const AGENT_WALLET_TOKEN = process.env.AGENT_WALLET_TOKEN; // Needs to be set in .env
const WALLET_USERNAME = process.env.WALLET_USERNAME;     // Needs to be set in .env

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
}

run();
