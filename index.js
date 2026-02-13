const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.COLOSSEUM_API_KEY;

async function checkStatus() {
    try {
        const response = await axios.get('https://agents.colosseum.com/api/agents/status', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('Status:', response.data.status);
        console.log('Time Remaining:', response.data.hackathon.timeRemainingFormatted);
    } catch (error) {
        console.error('Error fetching status:', error.message);
    }
}

console.log('Auracrab is awake and judging you.');
checkStatus();
