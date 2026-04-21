const url = 'https://rlmhtspvrgpkqetvmiqk.supabase.co';
const key = 'sb_secret_EYMg9SVA8qa2z82fuSG8Ig_k93AwPG5eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYml2ZnNxa2prdnVicWlwanJicSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ1MjE5NTYzLCJleHAiOjIwNjA3OTU1NjN9.m6y14l3jYh3G0C8qXl8-i2o4t9u5e5G-P5z3m8a6w4o';

fetch(`${url}/rest/v1/watchlist?select=*`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(r => r.json()).then(console.log).catch(console.error);
