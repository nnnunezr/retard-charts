fetch(`https://api.cors.lol/?url=${encodeURIComponent('https://query2.finance.yahoo.com/v1/finance/search?q=apple')}`)
  .then(res => res.json())
  .then(data => console.log(data.quotes.length > 0 ? "OK" : "Empty"))
  .catch(e => console.error(e));
