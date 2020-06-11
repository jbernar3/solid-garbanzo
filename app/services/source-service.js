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
        User.findById(userID, async function(err, user) {
            if (err || user === null) {
                callback(null, "ERROR: finding user");
            } else {
                const r = Math.random().toString(36).substring(7);
                const img_path = 'source_screenshots/' + r + '.png';
                const output_img_path = 'source_screenshots/output_' + r + '.png';
                const page = await browser.newPage();
                await page.goto(url);
                await page.screenshot({
                    path: img_path,
                    fullPage: false
                });
                await sharp(img_path).resize({height: 240, width: 400}).toFile(output_img_path);
                await page.close();
                const imgData = fs.readFileSync(output_img_path);
                const contentType = 'image/png';
                const globalSourceID = user.addSourceImg(categoryID, sourceID, imgData, contentType);
                fs.unlinkSync(img_path);
                fs.unlinkSync(output_img_path);
                user.save(function(err) {
                    if (err) {
                        callback(null, "ERROR: user saving error");
                    } else {
                        Resource.findById(globalSourceID, function(err, source) {
                            if (err || user === null) {
                                callback(null, "ERROR: finding source by id");
                            } else {
                                source.img.data = imgData;
                                source.img.contentType = contentType;
                                source.save(function(err, savedSource) {
                                    if (err) {
                                        callback(null, "ERROR: source saving error")
                                    } else {
                                        callback(null, savedSource.img);
                                    }
                                })
                            }
                        });
                    }
                });
            }
        });
    }
}

module.exports = SourceService;