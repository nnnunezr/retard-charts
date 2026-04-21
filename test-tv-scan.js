const fetch = require('node-fetch');
const body = {
    "symbols": { "tickers": ["NASDAQ:NVDA"], "query": { "types": [] } },
    "columns": ["close", "change", "change_abs"]
};

fetch('https://scanner.tradingview.com/america/scan', {
    method: 'POST',
    body: JSON.stringify(body)
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
