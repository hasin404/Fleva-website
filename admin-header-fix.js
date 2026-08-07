const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // If already has header-right, skip
  if (content.includes('<div class="header-right">')) {
    console.log(`Skipping ${file} - already patched.`);
    continue;
  }

  // Replace span date with header-right wrapper
  const dateSpanRegex = /<span class="date" id="current-date"><\/span>/;
  const dateDivRegex = /<div class="date" id="current-date"><\/div>/;

  let replaced = false;
  if (dateSpanRegex.test(content)) {
    content = content.replace(dateSpanRegex, 
      `<div class="header-right">
        <div class="date" id="current-date"></div>
        <div id="header-user"></div>
      </div>`);
    replaced = true;
  } else if (dateDivRegex.test(content)) {
    content = content.replace(dateDivRegex, 
      `<div class="header-right">
        <div class="date" id="current-date"></div>
        <div id="header-user"></div>
      </div>`);
    replaced = true;
  }

  if (replaced) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${file}`);
  } else {
    console.log(`Could not find date element in ${file}`);
  }
}

console.log('Header patch complete.');
