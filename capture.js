const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const distDir = path.join(__dirname, 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) filePath = path.join(distDir, 'index.html');
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const screens = [
  { url: 'http://localhost:8097/?view=view-dashboard&frame=true', out: 'screenshots/dashboard.png' },
  { url: 'http://localhost:8097/?view=view-diary&frame=true', out: 'screenshots/diary.png' },
  { url: 'http://localhost:8097/?view=view-exercise&frame=true', out: 'screenshots/exercise.png' },
  { url: 'http://localhost:8097/?view=view-camera&frame=true', out: 'screenshots/camera.png' },
  { url: 'http://localhost:8097/?view=view-profile&frame=true', out: 'screenshots/profile.png' },
  { url: 'http://localhost:8097/?view=view-diary&modal=add-entry&frame=true', out: 'screenshots/add_entry.png' },
];

server.listen(8097, async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    // High DPI for crisp Retina output: 2x scale
    await page.setViewport({ width: 500, height: 1000, deviceScaleFactor: 2 });

    for (const item of screens) {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 600));

      // Make outer page transparent
      await page.evaluate((isModal) => {
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        const root = document.getElementById('root');
        if (root) root.style.background = 'transparent';

        // Only clip modal backdrop if this is a modal view
        if (isModal) {
          const chassis = document.getElementById('phone-chassis');
          if (chassis) {
            const rect = chassis.getBoundingClientRect();
            document.querySelectorAll('div').forEach((el) => {
              const bg = window.getComputedStyle(el).backgroundColor;
              if (bg === 'rgba(12, 10, 9, 0.45)' || bg.includes('12, 10, 9')) {
                let cur = el;
                while (cur && cur !== document.body) {
                  const pos = window.getComputedStyle(cur).position;
                  if (pos === 'fixed' || pos === 'absolute') {
                    cur.style.left = `${rect.left}px`;
                    cur.style.top = `${rect.top}px`;
                    cur.style.width = `${rect.width}px`;
                    cur.style.height = `${rect.height}px`;
                    cur.style.borderRadius = '54px';
                    cur.style.overflow = 'hidden';
                    break;
                  }
                  cur = cur.parentElement;
                }
              }
            });
          }
        }
      }, item.url.includes('modal='));

      const chassis = await page.$('#phone-chassis');
      if (chassis) {
        console.log(`Found #phone-chassis for ${item.out}, capturing element screenshot with omitBackground: true...`);
        await chassis.screenshot({
          path: path.join(__dirname, item.out),
          omitBackground: true,
        });
      } else {
        console.log(`FALLBACK: #phone-chassis not found! Capturing page.`);
        await page.screenshot({
          path: path.join(__dirname, item.out),
          omitBackground: true,
        });
      }
    }

    console.log('All screenshots captured successfully!');
    await browser.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
  }
});
