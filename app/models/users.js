let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const userSourceSchema = new Schema({
    source_id: {type: String, required: true},
    source_name: {type: String, required: false},
    source_notes: {type: String, required: false},
    source_urlImgFlag: {type: Boolean, required: true},
    source_img: {data: Buffer, contentType: String, required: false},
    source_urlImg: {type: String, required: false}
});

const userCategorySchema = new Schema({
    category_id: {type: String, required: true},
    category_name: {type: String, required: false},
    sources: [userSourceSchema],
    parent_id: {type: String, required: false},
    isPublic: {type: Boolean, required: true}
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

userSchema.methods.addNewCategory = function(catID, catName, parentID) {
    this.categories.push({category_id: catID,
            category_name: catName, sources: [], parent_id: parentID, isPublic: false});
};

userSchema.methods.hasCategory = function(categoryName) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i].category_name === categoryName) {
            return true;
        }
    }
    return false;
};

userSchema.methods.getUserCategory = function(categoryID) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id === categoryID) {
            return this.categories[i];
        }
    }
    return null;
};

userSchema.methods.toggleIsPublicCategory = function(categoryID) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id === categoryID) {
            this.categories[i].isPublic = !this.categories[i].isPublic;
            return true;
        }
    }
    return false;
};

userSchema.methods.addUnregisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes, sourceImg, urlFlag) {
    let newSource;
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id === categoryID) {
            if (urlFlag) {
                newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, source_urlImgFlag: urlFlag, source_urlImg: sourceImg};
                this.categories[i].sources.push(newSource);
                return newSource;
            } else {
                newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, source_urlImgFlag: urlFlag, source_img: sourceImg};
                this.categories[i].sources.push(newSource);
                return newSource;
            }
        }
    }
};

userSchema.methods.addRegisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes, sourceImg, urlFlag) {
    let newSource;
    for (let i=0; i<this.categories.length; i++) {
        console.log(this.categories[i]._id);
        console.log(categoryID);
        if (this.categories[i]._id.toString() === categoryID) {
            for (let j=0; j<this.categories[i].sources.length; j++) {
                if (this.categories[i].sources[j].source_id === sourceID) {
                    console.log("About to return null");
                    return null;
                }
            }
            if (urlFlag) {
                newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, source_urlImgFlag: urlFlag, source_urlImg: sourceImg};
                this.categories[i].sources.push(newSource);
                return newSource;
            } else {
                newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, source_urlImgFlag: urlFlag, source_img: sourceImg};
                this.categories[i].sources.push(newSource);
                return newSource;
            }
        }
    }
};

userSchema.methods.addSourceImg = function(categoryID, sourceID, imgData, contentType) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id.toString() === categoryID) {
            const category = this.categories[i];
            for (let j=0; j<category.sources.length; j++) {
                if (category.sources[j]._id.toString() === sourceID) {
                    const source = category.sources[j];
                    source.source_img.data = imgData;
                    source.source_img.contentType = contentType;
                    return source.source_id;
                }
            }
        }
    }
};

// the schema is useless so far
// we need to create a model using it
const User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;