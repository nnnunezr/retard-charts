fetch("https://api.nasdaq.com/api/quote/AAPL/info?assetclass=stocks", { headers: { 'Origin': 'http://localhost', 'User-Agent': 'Mozilla/5.0' }})
  .then(res => {
      console.log('CORS:', res.headers.get('access-control-allow-origin'));
      return res.text();
  })
  .then(text => console.log(text.substring(0, 100)))
  .catch(e => console.error(e));
