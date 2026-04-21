const axios = require('axios');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Server misconfigured: Missing GROQ_API_KEY environment variable in Vercel settings." });
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
};
