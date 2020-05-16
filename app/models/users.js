let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const userSourceSchema = new Schema({
    source_id: {type: String, required: true},
    source_name: {type: String, required: false},
    source_notes: {type: String, required: false}
});

const userSubCategorySchema = new Schema({
    category_id: {type: String, required: true},
    category_name: {type: String, required: true},
    sources: [userSourceSchema],
});

const userCategorySchema = new Schema({
    category_id: {type: String, required: true},
    category_name: {type: String, required: false},
    sources: [userSourceSchema],
    sub_categories: [userSubCategorySchema]
});

// create a schema
const userSchema = new Schema({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    hash: {type: String, required: true},
    salt: {type: String, required: true},
    created_at: Date,
    wants_msg: {type: Boolean, required: true},
    categories: [userCategorySchema],
});

userSchema.methods.setPassword = function(password) {

    // Creating a unique salt for a particular user
    this.salt = crypto.randomBytes(16).toString('hex');

    // Hashing user's salt and password with 1000 iterations,
    this.hash = crypto.pbkdf2Sync(password, this.salt,
        1000, 64, `sha512`).toString(`hex`);
};

userSchema.methods.validPassword = function(password) {
    const hash = crypto.pbkdf2Sync(password,
        this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};

userSchema.methods.hasCategory = function(categoryName) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i].category_name === categoryName) {
            return true;
        }
    }
    return false;
};

userSchema.methods.addUnregisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i].category_id === categoryID) {
            this.categories[i].sources.push({source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes});
            break;
        }
    }
};

userSchema.methods.addRegisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes) {
    let userHasSource = false;
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i].category_id === categoryID) {
            for (let j=0; j<this.categories[i].sources.length; j++) {
                console.log(this.categories[i].sources[j].source_id);
                console.log(sourceID);
                if (this.categories[i].sources[j].source_id === sourceID) {
                    userHasSource = true;
                    break;
                }
            }
            if (!userHasSource) {
                this.categories[i].sources.push({source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes});
            }
            break;
        }
    }
    console.log(userHasSource);
    return userHasSource;
};

// the schema is useless so far
// we need to create a model using it
const User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;