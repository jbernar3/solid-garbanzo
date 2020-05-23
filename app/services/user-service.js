const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');
const fs = require('fs');

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

    static async NewCategory(userID, categoryName, callback) {
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, "error");
            } else if (user === null) {
                callback(null, "user not found");
            } else {
                Category.findOne({ name: categoryName}, function(err, category) {
                    if (err) {
                        callback(null, "error");
                    } else if (category === null) {
                        const newCategory = new Category();
                        newCategory.name = categoryName;
                        newCategory.save(function(err, savedCategory) {
                            if (err) {
                                callback(null, "error");
                            } else {
                                // update users saved categories
                                user.categories.push({category_id: savedCategory._id,
                                    category_name: savedCategory.name, sources: [], sub_categories: [], isPublic: false});
                                user.save(function(err) {
                                    if (err) {
                                        callback(null, "error adding category to user");
                                    } else {
                                        callback(null, user.categories);
                                    }
                                })
                            }
                        });
                    } else {
                        // check if user already has this category
                        if (user.hasCategory(category.name)) {
                            callback(null, "already exists");
                        } else {
                            // update users saved categories
                            user.categories.push({category_id: category._id,
                                category_name: category.name, sources: [], sub_categories: [], isPublic: false});
                            user.save(function(err) {
                                if (err) {
                                    callback(null, "error adding category to user");
                                } else {
                                    callback(null, user.categories);
                                }
                            })
                        }
                    }
                });
            }
        });
    }

    static async NewSource(userID, categoryID, url, title, notes, browser, callback) {
        const r = Math.random().toString(36).substring(7);
        const page = await browser.newPage();
        await page.goto(url);
        const suggested_title = await page.title();
        await page.screenshot({
            path: 'source_screenshots/' + r + '.png',
            fullPage: false
        });
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, "error finding user");
            } else {
                Resource.findOne({ url: url }, function(err, resource) {
                    if (err) {
                        callback(null, "error finding source");
                    } else if (resource === null) {
                        // add source document
                        const newSource = new Resource();
                        if (title === null || title === "") {
                            newSource.title = url;
                        } else {
                            newSource.title = suggested_title;
                        }
                        newSource.url = url;
                        newSource.countUse = 1;
                        newSource.featuredCategories = [categoryID];
                        newSource.img.data = fs.readFileSync('source_screenshots/' + r + '.png');
                        newSource.save(function(err, savedSource) {
                            // add to user's sources in specified category
                            fs.unlinkSync('source_screenshots/' + r + '.png');
                            user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes);
                            user.save(function(err){
                                if (err) {
                                    callback(null, err);
                                } else {
                                    PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
                                        if (pubCategory !== null) {
                                            pubCategory.last_updated = new Date();
                                            pubCategory.save(function(err) {
                                                if (err) {
                                                    callback(null, "error changing status of public category");
                                                } else {
                                                    console.log("about to hit callback");
                                                    callback(null, user.categories);
                                                }
                                            })
                                        } else {
                                            callback(null, user.categories);
                                        }
                                    });
                                }
                            })
                        });
                    } else {
                        const userHasSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes);
                        if (!userHasSource) {
                            user.save(function (err) {
                                if (err) {
                                    callback(null, "error");
                                } else {
                                    resource.updateFeaturedCategories(categoryID);
                                    resource.save(function(err) {
                                        if (err) {
                                            callback(null, err);
                                        } else {
                                            PublicCategories.findOne({sharer_id: userID, category_id: categoryID}, function(err, pubCategory) {
                                                if (pubCategory !== null) {
                                                    pubCategory.last_updated = new Date();
                                                    pubCategory.save(function(err) {
                                                        if (err) {
                                                            callback(null, "error changing status of public category");
                                                        } else {
                                                            console.log("about to hit callback");
                                                            callback(null, user.categories);
                                                        }
                                                    })
                                                } else {
                                                    callback(null, user.categories);
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        } else {
                            callback(null, "source is already in this category");
                        }
                    }
                });
            }
        });
    }
}

module.exports = UserService;