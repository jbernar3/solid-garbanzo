const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');

const sysErrorMsg = "ERROR:system error, please try again.";

class UserService {
    static async Signup(email, firstName, lastName, wantsMsg, password, callback) {
        User.findOne({ email: email}, function(err, user) {
            if (user !== null) {
                callback(null, "user exists");
            } else {
                const newUser = User();
                newUser.first_name = firstName;
                newUser.last_name = lastName;
                newUser.email = email;
                newUser.created_at = new Date();
                newUser.wants_msg = wantsMsg;
                newUser.setPassword(password);
                newUser.categories = [];
                newUser.save(function(err) {
                    if (err) {
                        callback(null, "error");
                    }
                    console.log('User created!');
                    callback(null, newUser);
                });
            }
        });
    }

    static async Signin(email, password, callback) {
        User.findOne({ email: email}, function(err, user) {
            if (err) {
                callback(null, "error");
            } else if (user === null) {
                callback(null, "dne");
            } else {
                if (user.validPassword(password)) {
                    callback(null, user);
                    console.log("Signed In");
                } else {
                    callback(null, "incorrect password");
                }
            }
        });
    }

    static async GetCategories(userID, callback) {
        User.findById(userID, function (err, user) {
            if (err) {
                callback(null, "system error");
            } else if (user === null) {
                callback(null, "user not found");
            } else {
                callback(null, user.categories);
            }
        })
    }

    static async DeleteSource(userID, categoryID, sourceID, callback) {
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, "system error");
            } else if (user === null) {
                callback(null, "user not found");
            } else {
                const numCategories = user.categories.length;
                for (let i=0; i<numCategories; i++) {
                    if (user.categories[i]._id === categoryID) {
                        const numSources = user.categories.sources.length;
                        for (let j=0; j<numSources; j++) {
                            if (user.categories[i].sources[j] === sourceID) {
                                user.categories[i].sources.splice(j, 1);
                                console.log("DELETED SOURCE: " + sourceID.toString());
                                break;
                            }
                        }
                        break;
                    }
                }
                callback(null, sourceID);
            }
        })
    }

    static async DeleteCategory(userID, categoryID, callback) {
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, "system error");
            } else if (user == null) {
                callback(null, "user not found");
            } else {
                user.categories = user.categories.filter(category => category._id !== categoryID);
                // const numCategories = user.categories.length;
                // for (let i=0; i<numCategories; i++) {
                //     if (user.categories[i]._id === categoryID) {
                //         user.categories.splice(i, 1);
                //         break;
                //     }
                // }
                callback(null, categoryID);
            }
        })
    }

    static async NewCategory(userID, categoryName, parentID, callback) {
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, sysErrorMsg);
            } else if (user === null) {
                callback(null, sysErrorMsg);
            } else {
                Category.findOne({ name: categoryName}, function(err, category) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else if (category === null) {
                        const newCategory = new Category();
                        newCategory.name = categoryName;
                        newCategory.save(function(err, savedCategory) {
                            if (err) {
                                callback(null, sysErrorMsg);
                            } else {
                                const newCategory = user.addNewCategory(savedCategory._id, savedCategory.name, parentID);
                                user.save(function(err) {
                                    if (err) {
                                        callback(null, sysErrorMsg);
                                    } else {
                                        callback(null, newCategory);
                                    }
                                })
                            }
                        });
                    } else {
                        // check if user already has this category
                        if (user.hasCategory(category.name)) {
                            callback(null, "ERROR:class already exists");
                        } else {
                            const newCategory = user.addNewCategory(category._id, category.name, parentID);
                            user.save(function(err) {
                                if (err) {
                                    callback(null, sysErrorMsg);
                                } else {
                                    callback(null, newCategory);
                                }
                            })
                        }
                    }
                });
            }
        });
    }

    // static async NewSource(userID, categoryID, url, title, notes, browser, callback) {
    //     User.findById(userID, function(err, user) {
    //         if (err) {
    //             callback(null, "error finding user");
    //         } else {
    //             Resource.findOne({ url: url }, async function(err, resource) {
    //                 if (err) {
    //                     callback(null, "error finding source");
    //                 } else if (resource === null) {
    //                     const r = Math.random().toString(36).substring(7);
    //                     const img_path = 'source_screenshots/' + r + '.png';
    //                     const output_img_path = 'source_screenshots/output_' + r + '.png';
    //                     const page = await browser.newPage();
    //                     await page.goto(url);
    //                     const suggested_title = await page.title();
    //                     let urlYoutubeImg = null;
    //                     if (url.includes("youtube.com")) {
    //                         let video_id = url.split('v=')[1];
    //                         let ampersandPosition = video_id.indexOf('&');
    //                         if(ampersandPosition !== -1) {
    //                             video_id = video_id.substring(0, ampersandPosition);
    //                         }
    //                         urlYoutubeImg = "http://img.youtube.com/vi/" + video_id + "/0.jpg"
    //                     } else {
    //                         await page.screenshot({
    //                             path: img_path,
    //                             fullPage: false
    //                         });
    //                         await sharp(img_path).resize({height: 240, width: 400}).toFile(output_img_path);
    //                         await page.close();
    //                     }
    //                     // add source document
    //                     const newSource = new Resource();
    //                     if (title === null || title === "") {
    //                         newSource.title = url;
    //                     } else {
    //                         newSource.title = suggested_title;
    //                     }
    //                     newSource.url = url;
    //                     newSource.countUse = 1;
    //                     newSource.featuredCategories = [categoryID];
    //                     newSource.urlImgFlag = (urlYoutubeImg !== null);
    //                     if (urlYoutubeImg) {
    //                         newSource.urlImg = urlYoutubeImg;
    //                     } else {
    //                         newSource.img.data = fs.readFileSync(output_img_path);
    //                         newSource.img.contentType = 'image/png';
    //                     }
    //                     newSource.save(function(err, savedSource) {
    //                         // add to user's sources in specified category
    //                         let newSource;
    //                         if (urlYoutubeImg === null) {
    //                             fs.unlinkSync(img_path);
    //                             fs.unlinkSync(output_img_path);
    //                             newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, savedSource.img, savedSource.urlImgFlag);
    //                         } else {
    //                             newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, urlYoutubeImg, savedSource.urlImgFlag);
    //                         }
    //                         user.save(function(err){
    //                             if (err) {
    //                                 callback(null, err);
    //                             } else {
    //                                 PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
    //                                     if (pubCategory !== null) {
    //                                         pubCategory.last_updated = new Date();
    //                                         pubCategory.save(function(err) {
    //                                             if (err) {
    //                                                 callback(null, "error changing status of public category");
    //                                             } else {
    //                                                 console.log("about to hit callback");
    //                                                 callback(null, newSource);
    //                                             }
    //                                         })
    //                                     } else {
    //                                         callback(null, newSource);
    //                                     }
    //                                 });
    //                             }
    //                         })
    //                     });
    //                 } else {
    //                     let userSource;
    //                     if (resource.urlImgFlag) {
    //                         userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.urlImg, resource.urlImgFlag);
    //                     } else {
    //                         userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.img, resource.urlImgFlag);
    //                     }
    //                     if (userSource) {
    //                         user.save(function (err) {
    //                             if (err) {
    //                                 callback(null, "error");
    //                             } else {
    //                                 resource.updateFeaturedCategories(categoryID);
    //                                 resource.save(function(err) {
    //                                     if (err) {
    //                                         callback(null, err);
    //                                     } else {
    //                                         PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
    //                                             if (pubCategory !== null) {
    //                                                 pubCategory.last_updated = new Date();
    //                                                 pubCategory.save(function(err) {
    //                                                     if (err) {
    //                                                         callback(null, "error changing status of public category");
    //                                                     } else {
    //                                                         console.log("about to hit callback");
    //                                                         callback(null, userSource);
    //                                                     }
    //                                                 })
    //                                             } else {
    //                                                 callback(null, userSource);
    //                                             }
    //                                         });
    //                                     }
    //                                 });
    //                             }
    //                         })
    //                     } else {
    //                         callback(null, "source is already in this category");
    //                     }
    //                 }
    //             });
    //         }
    //     });
    // }

    static async NewSource(userID, categoryID, url, title, notes, browser, callback) {
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, sysErrorMsg);
            } else {
                Resource.findOne({ url: url }, async function(err, resource) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else if (resource === null) {
                        const page = await browser.newPage();
                        await page.goto(url);
                        const suggested_title = await page.title();
                        const newSource = new Resource();
                        if (title === undefined || title === null || title === "") {
                            newSource.title = suggested_title;
                        } else {
                            newSource.title = title;
                        }
                        newSource.url = url;
                        newSource.countUse = 1;
                        newSource.featuredCategories = [categoryID];
                        if (url.includes("youtube.com")) {
                            let video_id = url.split('v=')[1];
                            let ampersandPosition = video_id.indexOf('&');
                            if(ampersandPosition !== -1) {
                                video_id = video_id.substring(0, ampersandPosition);
                            }
                            const urlYoutubeImg = "http://img.youtube.com/vi/" + video_id + "/0.jpg";
                            newSource.urlImgFlag = true;
                            newSource.urlImg = urlYoutubeImg;
                        } else {
                            newSource.urlImgFlag = false;
                        }
                        newSource.save(function(err, savedSource) {
                            let newSource;
                            if (savedSource.urlImgFlag) {
                                newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, savedSource.urlImg, savedSource.urlImgFlag);
                            } else {
                                newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, null, savedSource.urlImgFlag);
                            }
                            user.save(function(err){
                                if (err) {
                                    console.log(err);
                                    callback(null, sysErrorMsg);
                                } else {
                                    PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
                                        if (pubCategory !== null) {
                                            pubCategory.last_updated = new Date();
                                            pubCategory.save(function(err) {
                                                if (err) {
                                                    callback(null, sysErrorMsg);
                                                } else {
                                                    callback(null, newSource);
                                                }
                                            })
                                        } else {
                                            callback(null, newSource);
                                        }
                                    });
                                }
                            })
                        })
                    } else {
                        let userSource;
                        if (resource.urlImgFlag) {
                            userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.urlImg, resource.urlImgFlag);
                        } else {
                            userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.img, resource.urlImgFlag);
                        }
                        if (userSource) {
                            user.save(function (err) {
                                if (err) {
                                    callback(null, sysErrorMsg);
                                } else {
                                    resource.updateFeaturedCategories(categoryID);
                                    resource.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                            callback(null, sysErrorMsg);
                                        } else {
                                            PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
                                                if (pubCategory !== null) {
                                                    pubCategory.last_updated = new Date();
                                                    pubCategory.save(function(err) {
                                                        if (err) {
                                                            callback(null, sysErrorMsg);
                                                        } else {
                                                            callback(null, userSource);
                                                        }
                                                    })
                                                } else {
                                                    callback(null, userSource);
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        } else {
                            callback(null, "ERROR:source is already in this class");
                        }
                    }
                });
            }
        });
    }
}

module.exports = UserService;