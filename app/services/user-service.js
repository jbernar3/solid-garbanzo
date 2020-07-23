const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');
const fetchVideoInfo = require('youtube-info');
const nodemailer = require('nodemailer');
const nodeoutlook = require('nodejs-nodemailer-outlook');

const sysErrorMsg = "ERROR:system error, please try again.";

const transporter = nodemailer.createTransport({
    // service: 'outlook.office365',
    host: 'smtp.office365.com', // Office 365 server
    port: 587,     // secure SMTP
    secure: false,
    auth: {
        user: 'info@clasifyweb.com',
        pass: 'Ju*g6V!rwp!GFqDH'
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

class UserService {
    static async RandomUsername(firstName, lastName) {
        return new Promise(function (resolve, reject) {
            const tempUsername = firstName.substring(0,1) + lastName.substring(0,7) + Math.floor(Math.random() * 100);
            User.findOne({username: tempUsername}, function(err, user) {
                if (user === null) {
                    resolve(tempUsername);
                } else {
                    resolve(UserService.RandomUsername(firstName, lastName));
                }
            })
        });
    }

    static async Signup(email, firstName, lastName, wantsMsg, password, callback) {
        User.findOne({ email: email}, async function(err, user) {
            if (user !== null) {
                callback(null, "ERROR:Email address already registered. Please sign in.");
            } else {
                const newUser = User();
                newUser.first_name = firstName;
                newUser.last_name = lastName;
                newUser.email = email;
                newUser.created_at = new Date();
                newUser.wants_msg = wantsMsg;
                newUser.setPassword(password);
                newUser.categories = [];
                newUser.firstTime = false;
                newUser.username = await UserService.RandomUsername(firstName, lastName);
                newUser.profileImg = 'python.png';
                const verifyCode = Math.floor(Math.random() * (999999 - 100000) + 100000);
                newUser.setVerificationCode(verifyCode.toString());
                newUser.save(function(err, savedUser) {
                    if (err) {
                        console.log(err);
                        callback(null, sysErrorMsg);
                    } else {
                        transporter.sendMail(savedUser.createMailOptions(verifyCode), function(err, info){
                            if (err) {
                                console.log(err);
                                User.deleteOne({_id: savedUser._id}, function(err, user) {
                                    if (err) {
                                        callback(null, sysErrorMsg);
                                    } else {
                                        callback(null, "ERROR:sending email to " + email);
                                    }
                                });
                            } else {
                                console.log('Email sent: ' + info.response);
                                callback(null, newUser);
                            }
                        });
                    }

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
                    callback(null, {
                        _id: user._id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        bio: user.bio,
                        username: user.username,
                        needsVerification: (user.code_hash !== undefined && user.pending_new_email === undefined),
                        profileImg: user.profileImg
                    });
                    console.log("Signed In");
                } else {
                    callback(null, "incorrect password");
                }
            }
        });
    }

    static ChangeSource(src, callback) {
        Resource.findById(src.source_id, function (err, srcParent) {
            if (err || srcParent === null) {
                callback(null, src);
            } else {
                callback(null, {
                    _id: src._id,
                    source_id: src.source_id,
                    source_name: src.source_name,
                    source_notes: src.source_notes,
                    source_urlImgFlag: srcParent.urlImgFlag,
                    source_img: srcParent.img,
                    source_urlImg: srcParent.urlImg,
                    url: srcParent.url,
                    date_added: src.date_added,
                    has_user_notes: src.has_user_notes
                });
            }
        });
    }

    static async AddImagesCategory(category, callback) {
        Promise.all(category.sources.map(function (src, index) {
            return new Promise(function (resolve, reject) {
                UserService.ChangeSource(src,
                    function(err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    })
            });
            // Promise.resolve(UserService.ChangeSource(src));
            //.then((result) => {return result;})
        })).then((result) => callback(null, result));
    }

    static async ChangeCategories(categories) {
        return Promise.all(categories.map((category, index) => {
            // new Promise(function (resolve, reject) {
            //     UserService.AddImagesCategory(category,
            //         function(err, result) {
            //             if (err) {
            //                 reject(err);
            //             } else {
            //                 resolve(result);
            //             }
            //         })
            // }).then((result) => newUserCategories[index] = result);
            return new Promise(function (resolve, reject) {
                UserService.AddImagesCategory(category,
                    function(err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                _id: category._id,
                                category_id: category.category_id,
                                category_name: category.category_name,
                                sources: result,
                                parent_id: category.parent_id,
                                isPublic: category.isPublic
                            });
                        }
                    })
            });
            // UserService.AddImagesCategory(category).then((result) => Promise.resolve(
            //     {
            //         _id: category._id,
            //         category_id: category.category_id,
            //         category_name: category.category_name,
            //         sources: result,
            //         parent_id: category.parent_id,
            //         isPublic: category.isPublic
            //     }
            // )).then((result) => {return result});
        }));
        // return categories.map((category, index) => {
        //     // new Promise(function (resolve, reject) {
        //     //     UserService.AddImagesCategory(category,
        //     //         function(err, result) {
        //     //             if (err) {
        //     //                 reject(err);
        //     //             } else {
        //     //                 resolve(result);
        //     //             }
        //     //         })
        //     // }).then((result) => newUserCategories[index] = result);
        //     UserService.AddImagesCategory(category).then((result) => Promise.resolve(
        //         {
        //             _id: category._id,
        //             category_id: category.category_id,
        //             category_name: category.category_name,
        //             sources: result,
        //             parent_id: category.parent_id,
        //             isPublic: category.isPublic
        //         }
        //     )).then((result) => result);
        // });
    }

    static async GetCategories(userID, callback) {
        console.log(userID);
        User.findById(userID, function (err, user) {
            if (err) {
                callback(null, "system error");
            } else if (user === null) {
                callback(null, "user not found");
            } else {
                UserService.ChangeCategories(user.categories).then((result) => callback(null, result));
                // UserService.ChangeCategories(user.categories).then((result) => console.log(result[0].sources));
            }
        })
    }

    static async GetCategoriesOld(userID, callback) {
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

    static async DeleteCategory(userID, categoryID, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                callback(null, sysErrorMsg);
            } else {
                const tempUserCategories = [];
                user.categories.forEach((category) => {
                    if (category._id.toString() !== categoryID && category.parent_id !== categoryID) {
                        tempUserCategories.push(category);
                    }
                });
                user.categories = tempUserCategories;
                user.save(function(err) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else {
                        callback(null, 'success');
                    }
                });
            }
        })
    }

    static async DeleteSource(userID, categoryID, sourceID, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                callback(null, sysErrorMsg);
            } else {
                for (let i=0; i<user.categories.length; i++) {
                    if (user.categories[i]._id.toString() === categoryID) {
                        const tempCat = user.categories[i];
                        let tempSources = [];
                        tempCat.sources.forEach((source) => {
                            if (source._id.toString() !== sourceID) {
                                tempSources.push(source);
                            }
                        });
                        tempCat.sources = tempSources;
                        user.categories[i] = tempCat;
                        user.save(function(err) {
                            if (err) {
                                callback(null, sysErrorMsg);
                            } else {
                                callback(null, "success");
                            }
                        })
                    }
                }
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

    static async NewSource(userID, categoryID, url, title, notes, suggestedTitle, browser, callback) {
        console.log(url);
        console.log(suggestedTitle);
        User.findById(userID, function(err, user) {
            if (err) {
                callback(null, sysErrorMsg);
            } else {
                Resource.findOne({ url: url }, async function(err, resource) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else if (resource === null) {
                        const newSource = new Resource();
                        newSource.url = url;
                        newSource.countUse = 1;
                        newSource.featuredCategories = [categoryID];
                        let suggested_title = suggestedTitle;
                        if (url.includes("youtube.com")) {
                            let video_id = url.split('v=')[1];
                            let ampersandPosition = video_id.indexOf('&');
                            if(ampersandPosition !== -1) {
                                video_id = video_id.substring(0, ampersandPosition);
                            }
                            const urlYoutubeImg = "http://img.youtube.com/vi/" + video_id + "/0.jpg";
                            newSource.urlImgFlag = true;
                            newSource.urlImg = urlYoutubeImg;
                            const videoInfo = await fetchVideoInfo(video_id);
                            newSource.default_notes = videoInfo.description;
                            if (suggestedTitle === "") {
                                suggested_title = videoInfo.title;
                            }
                        } else {
                            if (suggestedTitle === "") {
                                const page = await browser.newPage();
                                await page.goto(url);
                                suggested_title = await page.title();
                            }
                            newSource.default_notes = suggested_title;
                            newSource.urlImgFlag = false;
                        }
                        newSource.title = suggested_title;
                        newSource.save(function(err, savedSource) {
                            if (err) {
                                callback(null, sysErrorMsg);
                                console.log(err);
                            }
                            let newSource;
                            let hasUserNotes = true;
                            if (notes === "" || notes === undefined) {
                                hasUserNotes = false;
                                notes = savedSource.default_notes;
                            }
                            if (savedSource.urlImgFlag) {
                                newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, savedSource.urlImg, savedSource.urlImgFlag, savedSource.url, title, hasUserNotes);
                            } else {
                                newSource = user.addUnregisteredSource(categoryID, savedSource._id.toString(), savedSource.title, notes, null, savedSource.urlImgFlag, savedSource.url, title, hasUserNotes);
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
                        let hasUserNotes = true;
                        if (notes === "" || notes === undefined) {
                            notes = resource.default_notes;
                            hasUserNotes = false;
                        }
                        if (resource.urlImgFlag) {
                            userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.urlImg, resource.urlImgFlag, resource.url, title, hasUserNotes, resource.img);
                        } else {
                            userSource = user.addRegisteredSource(categoryID, resource._id.toString(), resource.title, notes, resource.img, resource.urlImgFlag, resource.url, title, hasUserNotes, resource.img);
                        }
                        if (userSource) {
                            user.save(function (err) {
                                if (err) {
                                    console.log(err);
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

    static async EditProfile(userID, firstName, lastName, bio, profileImg, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                console.log(err);
                callback(null, sysErrorMsg);
            } else {
                user.first_name = firstName;
                user.last_name = lastName;
                user.bio = bio;
                user.profileImg = profileImg;
                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        callback(null, sysErrorMsg);
                    } else {
                        callback(null, "success");
                    }
                })
            }
        })
    }

    static async ChangePassword(userID, currPassword, newPassword, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                callback(null, sysErrorMsg);
            } else {
                if (user.validPassword(currPassword)) {
                    user.setPassword(newPassword);
                    user.save(function(err) {
                        if (err) {
                            callback(null, sysErrorMsg);
                        } else {
                            callback(null, "success");
                        }
                    })
                } else {
                    callback(null, "ERROR:incorrect password");
                }
            }
        })
    }

    static async ChangeEmail(userID, newEmail, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                callback(null, sysErrorMsg);
            } else if (user.email === newEmail) {
                callback(null, "ERROR:same as registered email");
            } else {
                User.find({email: newEmail}, function(err, otherUser) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else if (otherUser.length > 0) {
                        callback(null, "ERROR:user already registered with this email");
                    } else {
                        const verifyCode = Math.floor(Math.random() * (999999 - 100000) + 100000);
                        user.setVerificationCode(verifyCode.toString());
                        user.save(function(err) {
                            if (err) {
                                callback(null, sysErrorMsg);
                            } else {
                                transporter.sendMail(user.createMailOptionsChangeEmail(newEmail, verifyCode), function(err, info){
                                    if (err) {
                                        callback(null, "ERROR:error sending email to " + newEmail)
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                        user.pending_new_email = newEmail;
                                        user.save(function(err) {
                                            if (err) {
                                                callback(null, sysErrorMsg);
                                            } else {
                                                callback(null, "success");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        })
    }

    static async VerifyCode(userID, verifyCode, callback) {
        User.findById(userID, function(err, user) {
           if (err || user === null) {
               callback(null, sysErrorMsg);
           } else {
               if (user.validVerificationCode(verifyCode)) {
                   let callbackMsg = 'success';
                   if (user.pending_new_email) {
                       user.email = user.pending_new_email;
                       user.pending_new_email = undefined;
                       callbackMsg = user.email;
                   }
                   user.code_hash = undefined;
                   user.code_salt = undefined;
                   user.save(function(err) {
                       if (err) {
                           callback(null, sysErrorMsg);
                       } else {
                           callback(null, callbackMsg);
                       }
                   })
               } else {
                   callback(null, "ERROR:verification code wrong");
               }
           }
        });
    }

    static async ForgotPassword(email, callback) {
        User.findOne({email: email}, function(err, user) {
            if (err) {
                callback(null, sysErrorMsg);
            } else if (user === null) {
                callback(null, "ERROR:email not registered");
            } else {
                let randomPwd = Math.random().toString(36).slice(-8);
                while (randomPwd.length < 6) {
                    randomPwd = Math.random().toString(36).slice(-8);
                }
                user.setPassword(randomPwd);
                user.save(function(err) {
                    if (err) {
                        callback(null, sysErrorMsg);
                    } else {
                        transporter.sendMail(user.createMailOptionsForgotPwd(randomPwd), function(err, info){
                            if (err) {
                                callback(null, "ERROR:error sending email to " + email)
                            } else {
                                console.log('Email sent: ' + info.response);
                                callback(null, "success")
                            }
                        });
                    }
                });
            }
        });
    }

    static async EditSource(userID, categoryID, sourceID, newTitle, newNotes, callback) {
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                callback(null, sysErrorMsg);
            } else {
                let tempSource;
                for (let i=0; i<user.categories.length; i++) {
                    if (user.categories[i]._id.toString() === categoryID) {
                        let tempSources = user.categories[i].sources;
                        for (let j=0; j<tempSources.length; j++) {
                            if (tempSources[j]._id.toString() === sourceID) {
                                tempSource = user.categories[i].sources[j];
                                tempSource.source_name = newTitle;
                                tempSource.source_notes = newNotes;
                                user.categories[i].sources[j] = tempSource;
                                user.save(function(err) {
                                    if (err) {
                                        callback(null, sysErrorMsg);
                                    } else {
                                        callback(null, tempSource);
                                    }
                                });
                            }
                        }
                        break;
                    }
                }
            }
        })
    }

    static async ChangeUsername(userID, newUsername, callback) {
        if (newUsername.length < 5 || newUsername.length > 10) {
            callback(null, 'ERROR:username must be 5-10 characters')
        }
        User.findById(userID, function(err, user) {
            if (err || user === null) {
                console.log(userID);
                console.log("TCOUDLNT FIND USER");
                callback(null, sysErrorMsg);
            } else {
                User.findOne({username: newUsername}, function(err, otherUser) {
                    if (err) {
                        console.log(err);
                        callback(null, sysErrorMsg)
                    } else if (otherUser !== null) {
                        console.log("OTHER USER IF STATEMENT");
                        console.log(otherUser);
                        callback(null, "ERROR:username already used")
                    } else {
                        user.username = newUsername;
                        user.save(function(err) {
                            if (err) {
                                console.log("THIS IS IN THIS THING");
                                console.log(err);
                                callback(null, sysErrorMsg)
                            } else {
                                callback(null, 'success')
                            }
                        })
                    }
                })
            }
        })
    }
}

module.exports = UserService;