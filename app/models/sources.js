let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;

const sourceSchema = new Schema({
    title: {type: String, required: true},
    url: {type: String, required: true},
    countUse: {type: Number, required: true},
    featuredCategories: {type: Array, required: true}
});

sourceSchema.methods.updateFeaturedCategories = function(categoryID) {
    if (!this.featuredCategories.includes(categoryID)) {
        this.featuredCategories.push(categoryID);
    }
    this.countUse++;
};

// the schema is useless so far
// we need to create a model using it
const Source = mongoose.model('Source', sourceSchema);

// make this available to our users in our Node applications
module.exports = Source;