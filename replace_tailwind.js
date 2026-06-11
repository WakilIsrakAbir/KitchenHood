const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const linkTag = `<link rel="stylesheet" href="/css/tailwind.css">`;

walkDir(publicDir, function(filePath) {
  if (filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the Tailwind CDN script
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n?/g, '');
    
    // Remove the tailwind.config block
    content = content.replace(/<script>\s*tailwind\.config[\s\S]*?<\/script>\n?/g, '');
    
    // Insert the link tag before </head> if it's not already there
    if (!content.includes(linkTag)) {
      content = content.replace('</head>', `  ${linkTag}\n</head>`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});
