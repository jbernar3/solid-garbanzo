let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;

const publicCategoriesSchema = new Schema({
    sharer_id: {type: String, required: true},
    category_id: {type: String, required: true},
    last_updated: {type: Date, required: true}
});

// the schema is useless so far
// we need to create a model using it
const PublicCategories = mongoose.model('Public Categories', publicCategoriesSchema);

// make this available to our users in our Node applications
module.exports = PublicCategories;