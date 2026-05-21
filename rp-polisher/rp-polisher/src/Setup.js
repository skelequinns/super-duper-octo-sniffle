cat > setup.js << 'ENDOFFILE'
const fs = require('fs');
const path = require('path');

// I'll make this download the artifact from a pastebin
const https = require('https');

console.log('Fetching artifact code...');
https.get('https://YOUR_PASTEBIN_URL_HERE', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('./src/App.jsx', data);
    console.log('Created src/App.jsx!');
  });
});
ENDOFFILE

node setup.js