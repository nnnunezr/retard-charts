const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/analyze', async (req, res) => {
    try {
        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Server misconfigured: Missing API Key" });
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
});

app.get('/', (req, res) => res.send("Groq Proxy is running. Use /analyze for POST requests."));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
