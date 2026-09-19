const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('app/api', (filePath) => {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace `requireUser()` with `requireUser(request)` if inside a POST/PUT/DELETE/PATCH
    // Wait, let's just do a blanket regex replacement for `requireUser()` inside route handlers that take `request: Request`.
    // Instead of doing it dynamically, maybe we can just use `headers()` inside `requireUser` and assume ALL calls inside `requireUser` are mutating unless specified?
  }
});
