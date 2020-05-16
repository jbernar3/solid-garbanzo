const puppeteer = require('puppeteer');

class Scraper {
    static async scrapeTitle(url) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        try {
            await page.goto(url);
        } catch(e) {
            return "ERROR: invalid url";
        }
        return await page.title();
    }
}