// if our user.js file is at app/models/user.js
const User = require('./app/models/users');

// create a new user called chris
const chris = new User({
    first_name: 'Snoop',
    last_name: 'Bernard',
    email: 'mynamejeff',
    password: 'qwerty'
});

// call the custom method. this will just add -dude to his name
// user will now be Chris-dude
chris.dudify(function(err, name) {
    if (err) throw err;

    console.log('Your new name is ' + name);
});

// call the built-in save method to save to the database
chris.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully!');
});