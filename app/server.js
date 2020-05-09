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
    newUser.save(function(err) {
        if (err) {
            response.send("error");
        }

        User.find({ email: request.body.email }, function(err, user) {
            if (err) throw err;

            // object of the user
            response.send(user);
        });

        console.log('User created!');
    });
});


//Binding to a port
app.listen(port, ()=>{
    console.log('Express server started at port 3000');
});