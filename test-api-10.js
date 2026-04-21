fetch(`https://api.cors.lol/?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d')}`)
  .then(res => res.json())
  .then(data => console.log(data.chart.result[0].meta.regularMarketPrice))
  .catch(e => console.error(e));
