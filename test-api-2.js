const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,MSFT,NVDA");
fetch(url)
  .then(response => response.json())
  .then(data => {
      const contents = JSON.parse(data.contents);
      console.log(contents.quoteResponse.result.map(q => `${q.symbol}: ${q.regularMarketPrice}`));
  })
  .catch(error => console.error(error));
