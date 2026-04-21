fetch("https://symbol-search.tradingview.com/symbol_search/v3/?text=apple&hl=1&exchange=&type=stock", { headers: { 'Origin': 'http://localhost' }})
  .then(response => response.json())
  .then(data => {
      console.log(JSON.stringify(data).slice(0, 500));
  })
  .catch(error => console.error(error));
