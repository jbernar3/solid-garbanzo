const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const User = require('./models/users');
const Category = require('./models/categories');
const Resource = require('./models/sources');
const port = process.env.PORT || 3000;
const UserService = require('./services/user-service');
const Scraper = require('./services/scraper');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json()); // support json encoded bodies

//Basic routes
app.post('/signup', async (request,response)=>{
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

app.post('/signin', (request,response)=>{
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

app.post('/new_category', (request,response)=>{
    new Promise(function(resolve, reject) {
        UserService.NewCategory(request.body.userID, request.body.catName,
            function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    }).then((result) => response.send(result));
});

app.post('/new_source', (request,response)=> {
    new Promise(function(resolve, reject) {
        UserService.NewSource(request.body.userID, request.body.categoryID, request.body.url, request.body.sourceTitle, request.body.sourceNotes,
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


//Binding to a port
app.listen(port, ()=>{
    console.log('Express server started at port 3000');
});