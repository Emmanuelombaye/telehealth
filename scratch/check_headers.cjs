const https = require('https');

https.get('https://kvopgyhcjcniaocjozje.supabase.co', (res) => {
  console.log('Headers:', res.headers);
}).on('error', console.error);
