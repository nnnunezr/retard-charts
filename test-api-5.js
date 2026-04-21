const url = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL";
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }})
  .then(response => response.json())
  .then(data => {
      console.log(data.chart.result[0].meta.regularMarketPrice);
  })
  .catch(error => console.error(error));
