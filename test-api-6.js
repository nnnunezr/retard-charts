const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/NVDA?interval=1d&_t=${Date.now()}`)}`;
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data.contents.substring(0, 100)))
  .catch(e => console.error(e));
