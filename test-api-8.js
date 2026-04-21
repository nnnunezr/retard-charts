const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&_t=${Date.now()}`)}`;
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data.chart.result[0].meta.regularMarketPrice))
  .catch(e => console.error(e));
