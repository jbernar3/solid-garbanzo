const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const UserService = require('./services/user-service');
const PublicCategoriesService = require('./services/public-categories-service');
const SourceService = require('./services/source-service');
const Scraper = require('./services/scraper');
const puppeteer = require('puppeteer');

app.use(cors());

let global_browser = false;
async function init_puppeteer() {
    if(global_browser === false )
        global_browser = await puppeteer.launch({
            headless: true  ,
            args:['--no-sandbox'],
            defaultViewport: {
                width: 800,
                height: 500,
                isLandscape: true
            }
        });
}

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json()); // support json encoded bodies

//Basic routes
app.post('/signup', async (request,response) => {
    new Promise(function(resolve, reject) {
        UserService.Signup(request.body.email, request.body.firstName,
            request.body.lastName, request.body.wantsPromotions, request.body.password,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/signin', (request,response) => {
    new Promise(function(resolve, reject) {
       UserService.Signin(request.body.email, request.body.password,
           function(err, result) {
              if (err) {
                  reject(err);
              } else {
                  resolve(result);
              }
           });
    }).then((result) => response.send(result));
});

app.post('/get_categories', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.GetCategories(request.body.userID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/delete_category', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.DeleteCategory(request.body.userID, request.body.categoryID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/delete_source', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.DeleteSource(request.body.userID, request.body.categoryID, request.body.sourceID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/new_category', (request,response) => {
    new Promise(function(resolve, reject) {
        UserService.NewCategory(request.body.userID, request.body.catName, request.body.parentID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/new_source', (request,response) => {
    //response.setHeader('Content-Type', 'application/json');
    new Promise(function(resolve, reject) {
        UserService.NewSource(request.body.userID, request.body.categoryID, request.body.url, request.body.sourceTitle, request.body.sourceNotes, request.body.suggestedTitle, global_browser,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});



app.post('/new_category_source', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.NewCategory(request.body.userID, request.body.categoryName,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => new Promise(function(resolve, reject) {
        UserService.NewSource(request.body.userID, result[result.length - 1]._id, request.body.url, request.body.sourceNotes,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((finalResult) => response.send(finalResult)));
});

app.post('/post_category', (request, response) => {
    new Promise(function(resolve, reject) {
        PublicCategoriesService.PostCategory(request.body.userID, request.body.categoryID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/get_global_categories', (request, response) => {
    new Promise(function(resolve, reject) {
        PublicCategoriesService.GetGlobalCategories(
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/get_scraped_source', (request, response) => {
    new Promise(function(resolve, reject) {
        Scraper.scrapeTitle(browser, request.body.url,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/get_suggested_title', (request, response) => {
    new Promise(function(resolve, reject) {
        SourceService.GetTitle(request.body.url, global_browser,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/get_source_img', (request, response) => {
    new Promise(function(resolve, reject) {
        SourceService.GetThumbNail(request.body.sourceID, global_browser,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/edit_profile', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.EditProfile(request.body.userID, request.body.firstName, request.body.lastName, request.body.bio, request.body.profileImg,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/change_password', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.ChangePassword(request.body.userID, request.body.currPassword, request.body.newPassword,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/change_email', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.ChangeEmail(request.body.userID, request.body.newEmail,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/verify_code', (request, response) => {
   new Promise(function(resolve, reject) {
       UserService.VerifyCode(request.body.userID, request.body.verifyCode,
           function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
           })
   }).then((result) => response.send(result));
});

app.post('/forgot_password', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.ForgotPassword(request.body.email,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/edit_source', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.EditSource(request.body.userID, request.body.categoryID, request.body.sourceID,
            request.body.newTitle, request.body.newNotes,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/delete_source', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.DeleteSource(request.body.userID, request.body.categoryID, request.body.sourceID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/change_username', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.ChangeUsername(request.body.userID, request.body.newUsername,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});

app.post('/edit_category', (request, response) => {
    new Promise(function(resolve, reject) {
        UserService.EditCategory(request.body.userID, request.body.catID, request.body.catName, request.body.parentID,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
    }).then((result) => response.send(result));
});


//Binding to a port
app.listen(port, ()=>{
    init_puppeteer().then(r => console.log("Browser setup"));
    console.log('Express server started at port 3000');
});