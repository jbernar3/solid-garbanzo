const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const User = require('./models/users');
const Category = require('./models/categories');
const Resource = require('./models/sources');
const port = process.env.PORT || 3000;
const UserService = require('./services/user-service');
const PublicCategoriesService = require('./services/public-categories-service');
const SourceService = require('./services/source-service');
const Scraper = require('./services/scraper');
const puppeteer = require('puppeteer');

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




//Binding to a port
app.listen(port, ()=>{
    init_puppeteer().then(r => console.log("Browser setup"));
    console.log('Express server started at port 3000');
});