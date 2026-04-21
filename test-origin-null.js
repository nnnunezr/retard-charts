fetch("https://symbol-search.tradingview.com/symbol_search/?text=apple", { headers: { 'Origin': 'null' }})
  .then(response => {
      console.log('Status:', response.status);
      return response.json();
  })
  .then(data => console.log(data.length > 0 ? "OK" : "Empty"))
  .catch(e => console.error(e));
