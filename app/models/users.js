let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;

// create a schema
const userSchema = new Schema({
    name: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    meta: {
        occupation: String,
        organization: String
    },
    created_at: Date,
    updated_at: Date
});

// custom method to add string to end of name
// you can create more important methods like name validations or formatting
// you can also do queries and find similar users
userSchema.methods.dudify = function() {
    // add some stuff to the users name
    this.name = this.name + '-dude';

    return this.name;
};

// the schema is useless so far
// we need to create a model using it
const User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;