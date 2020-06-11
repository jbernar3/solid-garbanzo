const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');
const fs = require('fs');
const sharp = require('sharp');

class SourceService {
    static async GetTitle(url, browser, callback) {
        const page = await browser.newPage();
        await page.goto(url);
        const suggested_title = await page.title();
        callback(null, suggested_title);
    }

    static async GetThumbNail(userID, categoryID, sourceID, url, browser, callback) {

    }
}

module.exports = SourceService;