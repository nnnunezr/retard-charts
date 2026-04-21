const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://query1.finance.yahoo.com/v7/finance/spark?symbols=AAPL,MSFT,NVDA");
fetch(url)
  .then(response => response.json())
  .then(data => {
      const contents = JSON.parse(data.contents);
      console.log(contents.spark.result.map(q => `${q.symbol}: ${q.response[0].meta.regularMarketPrice}`));
  })
  .catch(error => console.error(error));
