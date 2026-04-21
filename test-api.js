const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/AAPL");
fetch(url)
  .then(response => {
      if (response.ok) return response.json();
      throw new Error('Network response was not ok.');
  })
  .then(data => {
      const contents = JSON.parse(data.contents);
      console.log(contents.chart.result[0].meta.regularMarketPrice);
  })
  .catch(error => console.error(error));
