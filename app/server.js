const express = require('express'),
    server = express();
const User = require('./models/users');
const bodyParser = require('body-parser');

server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
server.use(bodyParser.json()); // support json encoded bodies
//server.use('/', router);

server.set('port', process.env.PORT || 3000);

//Basic routes
server.post('/signup', (request,response)=>{
    //const newUser = new User(queryObject);
    console.log("in post");
    console.log(request.body);
    response.end();
    // newUser.save(function(err) {
    //     if (err) response.send('error');
    //
    //     response.send('success');
    // });
});

server.get('/about',(request,response)=>{
    response.send('About page');
});

//Express error handling middleware
server.use((request,response)=>{
    response.type('text/plain');
    response.status(504);
    response.send('Error page');
});

//Binding to a port
server.listen(3000, ()=>{
    console.log('Express server started at port 3000');
});