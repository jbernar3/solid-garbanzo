let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {type: String, required: true},
});

// the schema is useless so far
// we need to create a model using it
const Category = mongoose.model('Category', categorySchema);

// make this available to our users in our Node applications
module.exports = Category;