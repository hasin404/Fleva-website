const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix header
  content = content.replace(/<h1>(.*?)<\/h1>/, `<div class="header-left"><button class="admin-mobile-toggle" onclick="document.querySelector('.admin-sidebar').classList.toggle('open')">☰</button><h1>$1</h1></div>`);

  // Fix tables
  // It's possible there are multiple tables.
  content = content.replace(/<table class="data-table">/g, '<div class="table-responsive"><table class="data-table">');
  content = content.replace(/<\/table>/g, '</table></div>');

  fs.writeFileSync(filePath, content);
}

console.log('Admin files patched successfully.');
