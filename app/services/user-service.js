const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');

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
                                    category_name: savedCategory.name, sources: []});
                                user.save(function(err) {
                                    if (err) {
                                        callback(null, "error adding category to user");
                                    } else {
                                        callback(null, savedCategory);
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
                                category_name: category.name, sources: []});
                            user.save(function(err) {
                                if (err) {
                                    callback(null, "error adding category to user");
                                } else {
                                    callback(null, category);
                                }
                            })
                        }
                    }
                });
            }
        });
    }

    static async NewSource(userID, categoryID, url, callback) {
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
                        newSource.title = "Fake Title";
                        newSource.url = url;
                        newSource.countUse = 1;
                        newSource.featuredCategories = [categoryID];
                        newSource.save(function(err, savedSource) {
                            // add to user's sources in specified category
                            user.addUnregisteredSource(categoryID, savedSource._id, savedSource.title);
                            user.save(function(err){
                                if (err) {
                                    callback(null, "error");
                                } else {
                                    callback(null, savedSource);
                                }
                            })
                        });
                    } else {
                        const userHasSource = user.addRegisteredSource(categoryID, resource._id, resource.title);
                        if (!userHasSource) {
                            user.save(function (err) {
                                if (err) {
                                    callback(null, "error");
                                } else {
                                    resource.updateFeaturedCategories(categoryID);
                                    resource.save(function(err) {
                                        if (err) callback(null, err);
                                        callback(null, resource);
                                    });
                                }
                            })
                        }
                    }
                });
            }
        });
    }
}

module.exports = UserService;