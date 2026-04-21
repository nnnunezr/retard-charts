const url = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://query2.finance.yahoo.com/v1/finance/search?q=Apple");
fetch(url)
  .then(response => response.json())
  .then(data => {
      const contents = JSON.parse(data.contents);
      console.log(contents.quotes.slice(0, 3).map(q => `${q.symbol}: ${q.shortname}`));
  })
  .catch(error => console.error(error));
