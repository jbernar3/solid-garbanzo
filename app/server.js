const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const User = require('./models/users');
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json()); // support json encoded bodies

//Basic routes
app.post('/signup', (request,response)=>{
    console.log("in post");
    const newUser = User({
        first_name : request.body.firstName,
        last_name : request.body.lastName,
        email : request.body.email,
        password : request.body.password,
        created_at : new Date(),
        updated_at : null,
        wants_msg : request.body.wantsPromotions
    });
    User.find({ email: request.body.email}, function(err, user) {
        if (user !== []) {
            response.send("user exists");
        } else {
            newUser.save(function(err) {
                if (err) {
                    response.send("error");
                }

                User.find({ email: request.body.email }, function(err, user) {
                    if (err) {
                        response.send("Email signing up. Please try again.");
                    }

                    // object of the user
                    response.send(user[0]);
                });

                console.log('User created!');
            });
        }
    });
});

app.post('/signin', (request,response)=>{
    console.log("in signin");
    User.find({ email: request.body.email, password: request.body.password}, function(err, user) {
        if (err) {
            response.send("error");
        } else if (user === []) {
            response.send("dne");
        } else {
            response.send(user[0]);
            console.log("Signed In");
        }
    });
});


//Binding to a port
app.listen(port, ()=>{
    console.log('Express server started at port 3000');
});