fetch("https://pkgstore.datahub.io/core/s-and-p-500-companies/constituents_json/data/297344d8dc0a9d86b8d107449c851cc8/constituents_json.json", { headers: { 'Origin': 'null' }})
  .then(res => res.json())
  .then(data => console.log(data.length, data[0]))
  .catch(e => console.error(e));
