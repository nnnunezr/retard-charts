fetch("https://symbol-search.tradingview.com/symbol_search/?text=apple", { headers: { 'Origin': 'http://localhost' }})
  .then(response => response.json())
  .then(data => {
      console.log(data.slice(0, 3).map(q => `${q.symbol}: ${q.description}`));
  })
  .catch(error => console.error(error));
