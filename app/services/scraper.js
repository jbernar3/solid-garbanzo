const puppeteer = require('puppeteer');



class Scraper {
    static async openBrowser(callback) {
        const browser = await puppeteer.launch();
        callback(null, browser)
    }

    static async openNewPage(browser, callback) {
        const page = await browser.newPage();
        callback(null, page);
    }
    static async scrapeTitle(browser, url, callback) {
        await browser;
        console.log(browser);
        const page = await browser.newPage();
        try {
            await page.goto(url);
        } catch(e) {
            callback(null, "ERROR: invalid url");
        }
        callback(null, await page.title());
    }
}



module.exports = Scraper;