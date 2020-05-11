const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const User = require('./models/users');
const Category = require('./models/categories');
const Resource = require('./models/sources');
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json()); // support json encoded bodies

//Basic routes
app.post('/signup', (request,response)=>{
    console.log("in post");
    User.findOne({ email: request.body.email}, function(err, user) {
        if (user !== null) {
            response.send("user exists");
        } else {
            const newUser = User();
            newUser.first_name = request.body.firstName;
            newUser.last_name = request.body.lastName;
            newUser.email = request.body.email;
            newUser.created_at = new Date();
            newUser.wants_msg = request.body.wantsPromotions;
            newUser.setPassword(request.body.password);
            newUser.categories = new Map();
            newUser.save(function(err) {
                if (err) {
                    response.send("error");
                }
                response.send(newUser);
                console.log('User created!');
            });
        }
    });
});

app.post('/signin', (request,response)=>{
    User.findOne({ email: request.body.email}, function(err, user) {
        if (err) {
            response.send("error");
        } else if (user === null) {
            response.send("dne");
        } else {
            if (user.validPassword(request.body.password)) {
                response.send(user);
                console.log("Signed In");
            } else {
                response.send("incorrect password");
            }
        }
    });
});

app.post('/new_category', (request,response)=>{
    User.findById(request.body.userID, function(err, user) {
        if (err) {
            response.send("error");
        } else {
            Category.findOne({ name: request.body.catName}, function(err, category) {
                if (err) {
                    response.send("error");
                } else if (category === null) {
                    const newCategory = new Category();
                    newCategory.name = request.body.catName;
                    newCategory.save(function(err, savedCategory) {
                        if (err) {
                            response.send("error");
                        } else {
                            // update users saved categories
                            user.categories.set(savedCategory._id.toString(), { category_name: savedCategory.name, sources: new Map()});
                            user.save(function(err) {
                                if (err) {
                                    response.send("error adding category to user");
                                } else {
                                    response.send(savedCategory);
                                }
                            })
                        }
                    });
                } else {
                    // check if user already has this category
                    if (user.hasCategory(category.name)) {
                        response.send("already exists");
                    } else {
                        // update users saved categories
                        user.categories.set(category._id.toString(), { category_name: category.name, sources: new Map()});
                        user.save(function(err) {
                            if (err) {
                                response.send("error adding category to user");
                            } else {
                                response.send(category);
                            }
                        })
                    }
                }
            });
        }
    });
});

app.post('/new_source', (request,response)=> {
    User.findById(request.body.userID, function(err, user) {
        if (err) {
            response.send("error finding user");
        } else {
            Resource.findOne({ url: request.body.url }, function(err, resource) {
                console.log(resource);
                if (err) {
                    response.send("error finding source");
                } else if (resource === null) {
                    // add source document
                    const newSource = new Resource();
                    newSource.title = "Fake Title";
                    newSource.url = request.body.url;
                    newSource.countUse = 1;
                    newSource.featuredCategories = [request.body.categoryID];
                    newSource.save(function(err, savedSource) {
                        // add to user's sources in specified category
                        user.categories.get(request.body.categoryID).sources.set(savedSource._id.toString(), "Personal Fake Title");
                        user.save(function(err){
                            if (err) {
                                response.send(err);
                            } else {
                                response.send(savedSource);
                            }
                        })
                    });
                } else {
                    resource.countUse++;
                    resource.featuredCategories.push(request.body.categoryID);
                    resource.save(function(err) {
                        if (err) response.send("error when saving resource stat updates");
                        user.categories.get(request.body.categoryID).sources.set(resource._id.toString(), { source_name: "Personal Fake Title"});
                        user.save(function(err){
                            if (err) {
                                response.send(err);
                            } else {
                                response.send(resource);
                            }
                        })

                    });
                }
            });
        }
    });
});


//Binding to a port
app.listen(port, ()=>{
    console.log('Express server started at port 3000');
});