const Resource = require('../models/sources');
const fs = require('fs');
const sharp = require('sharp');
const fetchVideoInfo = require('youtube-info');
const sysErrorMsg = "ERROR:system error, please try again.";
const Buffer = require('buffer').Buffer;

class SourceService {
    static async GetTitle(url, browser, callback) {
        Resource.findOne({url: url}, async function(err, resource) {
            if (err) {
                callback(null, sysErrorMsg);
            } else if (resource === null) {
                try {
                    if (url.includes("youtube.com/watch?v=") || url.includes("youtu.be/")) {
                        let video_id;
                        if (url.includes('youtu.be/')) {
                            const splitStr = url.split('/');
                            video_id = splitStr[splitStr.length - 1];
                        } else {
                            video_id = url.split('v=')[1];
                        }
                        fetchVideoInfo(video_id, function (err, videoInfo) {
                            if (err) {
                            } else {
                                callback(null, videoInfo.title);
                            }
                        });
                    } else {
                        let finalUrl = url;
                        if (!finalUrl.startsWith('https://') && !finalUrl.startsWith('http://')) {
                            if (!finalUrl.startsWith('www.')) {
                                finalUrl = 'www.' + finalUrl;
                            }
                            finalUrl = 'https://' + finalUrl;
                        }
                        const page = await browser.newPage();
                        await page.goto(finalUrl);
                        const suggested_title = await page.title();
                        await page.close();
                        callback(null, suggested_title);
                    }
                } catch (e) {
                    callback(null, sysErrorMsg);
                }
            } else {
                callback(null, resource.title);
            }
        });
    }

    static ArrayBufferToBase64(buffer) {
        let binary = '';
        let bytes = [].slice.call(new Uint8Array(buffer));
        bytes.forEach((b) => binary += String.fromCharCode(b));
        return Buffer.from(binary).toString('base64');
    }

    static async GetThumbNail(sourceID, browser, callback) {
        Resource.findById(sourceID, async function(err, source) {
            if (err || source === null) {
                callback(null, "ERROR: finding source by id");
            } else {
                const r = Math.random().toString(36).substring(7);
                const img_path = 'source_screenshots/' + r + '.png';
                const output_img_path = 'source_screenshots/output_' + r + '.png';
                const page = await browser.newPage();
                await page.goto(source.url);
                await page.screenshot({
                    path: img_path,
                    fullPage: false
                });
                await sharp(img_path).resize({height: 240, width: 400}).toFile(output_img_path);
                await page.close();
                const imgData = fs.readFileSync(output_img_path);
                const contentType = 'image/png';
                fs.unlinkSync(img_path);
                fs.unlinkSync(output_img_path);
                source.img.data = imgData;
                source.img.contentType = contentType;
                // source.img = await SourceService.ArrayBufferToBase64(imgData);
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
}

module.exports = SourceService;