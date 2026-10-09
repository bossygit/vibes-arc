/**
 * Vérification visuelle du module Cohérence cardiaque (démo HTML).
 * Usage : node scripts/verify-coherence-demo.cjs
 * Ouvre docs/coherence-demo.html en Chromium headless, laisse tourner la
 * session simulée ~40 s, capture 2 screenshots et lit les valeurs affichées.
 */
const { chromium } = require('playwright');

const URL = 'file://' + require('path').resolve(__dirname, '..', 'docs', 'coherence-demo.html');
const OUT = require('os').tmpdir();

(async () => {
    const browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 680, height: 980 }, deviceScaleFactor: 2 });
    await page.goto(URL);

    await page.waitForTimeout(12000);
    const mid = await page.evaluate(() => ({
        bpm: document.getElementById('bpmVal').textContent,
        rr: document.getElementById('rrVal').textContent,
        beats: document.getElementById('beatVal').textContent,
        collect: document.getElementById('collectTxt').textContent,
        score: document.getElementById('scoreVal').textContent,
    }));
    console.log('MID  ' + JSON.stringify(mid));
    await page.screenshot({ path: OUT + '/coh-mid.png', fullPage: true });

    await page.waitForTimeout(26000);
    const end = await page.evaluate(() => ({
        bpm: document.getElementById('bpmVal').textContent,
        beats: document.getElementById('beatVal').textContent,
        score: document.getElementById('scoreVal').textContent,
        level: document.getElementById('levelVal').textContent,
        peak: document.getElementById('peakVal').textContent,
    }));
    console.log('END  ' + JSON.stringify(end));
    await page.screenshot({ path: OUT + '/coh-end.png', fullPage: true });

    // Contrôles : slider 5 cpm + pause/reprise
    await page.fill('#cpm', '5');
    await page.dispatchEvent('#cpm', 'input');
    console.log('CPM5 ' + (await page.$eval('#cpmVal', (e) => e.textContent)));
    await page.click('#toggle');
    console.log('PAUSE ' + (await page.$eval('#toggle', (e) => e.textContent)));

    await browser.close();
    console.log('OK screenshots: ' + OUT + '/coh-mid.png & coh-end.png');
})();
