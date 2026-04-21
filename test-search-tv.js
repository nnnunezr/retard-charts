fetch("https://symbol-search.tradingview.com/symbol_search/v3/?text=apple&hl=1&exchange=&type=stock", { headers: { 'Origin': 'http://localhost' }})
  .then(response => {
      console.log('CORS OK?', response.headers.get('access-control-allow-origin'));
      return response.json();
  })
  .then(data => {
      console.log(data.symbols.slice(0, 3).map(q => `${q.symbol}: ${q.description}`));
  })
  .catch(error => console.error(error));
