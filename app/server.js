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


//Binding to a port
app.listen(port, ()=>{
    console.log('Express server started at port 3000');
});