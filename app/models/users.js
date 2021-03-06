let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://jbernar3:yhO1wp1BebZ1DPFU@solidgarbanzocluster-nhlwu.mongodb.net/test?retryWrites=true&w=majority');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const userSourceSchema = new Schema({
    source_id: {type: String, required: true},
    source_name: {type: String, required: false},
    source_notes: {type: String, required: false},
    date_added: {type: Date, required: true},
    has_user_notes: {type: Boolean, required: true}
    // source_urlImgFlag: {type: Boolean, required: true},
    // source_img: {data: Buffer, contentType: String, required: false},
    // source_urlImg: {type: String, required: false}
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
    username: {type: String, required: false},
    profileImg: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    hash: {type: String, required: true},
    salt: {type: String, required: true},
    created_at: Date,
    wants_msg: {type: Boolean, required: true},
    categories: [userCategorySchema],
    bio: {type: String, required: false},
    firstTime: {type: Boolean, required: true},
    code_hash: {type: String, required: false},
    code_salt: {type: String, required: false},
    pending_new_email: {type: String, required: false}
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

userSchema.methods.setVerificationCode = function(verifyCode) {

    // Creating a unique salt for a particular user
    this.code_salt = crypto.randomBytes(16).toString('hex');

    // Hashing user's salt and password with 1000 iterations,
    this.code_hash = crypto.pbkdf2Sync(verifyCode, this.code_salt,
        1000, 64, `sha512`).toString(`hex`);
    console.log("verifyCode:" + verifyCode);
};

userSchema.methods.validVerificationCode = function(verifyCode) {
    const hash = crypto.pbkdf2Sync(verifyCode,
        this.code_salt, 1000, 64, `sha512`).toString(`hex`);
    return this.code_hash === hash;
};

userSchema.methods.addNewCategory = function(catID, catName, parentID) {
    const newCategory = {category_id: catID,
        category_name: catName, sources: [], parent_id: parentID, isPublic: false};
    this.categories.push(newCategory);
    return this.categories[this.categories.length - 1];
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

userSchema.methods.addUnregisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes, sourceImg, urlFlag, url, title, hasUserNotes) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id.toString() === categoryID) {
            const newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, date_added: new Date(), has_user_notes: hasUserNotes};
            this.categories[i].sources.unshift(newSource);
            let returnSource = this.categories[i].sources[0];
            let returnTitle = title;
            if (title === undefined || title === "" || title === null) {
                returnTitle = sourceTitle;
            }
            return {
                _id: returnSource._id,
                source_id: returnSource.source_id,
                source_name: returnTitle,
                source_notes: returnSource.source_notes,
                source_urlImgFlag: urlFlag,
                source_urlImg: sourceImg,
                url: url,
                date_added: newSource.date_added,
                has_user_notes: hasUserNotes
            }
        }
    }
};

userSchema.methods.addRegisteredSource = function(categoryID, sourceID, sourceTitle, sourceNotes, sourceImg, urlFlag, url, title, hasUserNotes) {
    for (let i=0; i<this.categories.length; i++) {
        if (this.categories[i]._id.toString() === categoryID) {
            for (let j=0; j<this.categories[i].sources.length; j++) {
                if (this.categories[i].sources[j]._id === sourceID) {
                    console.log("About to return null");
                    return null;
                }
            }
            const newSource = {source_id: sourceID, source_name: sourceTitle, source_notes: sourceNotes, date_added: new Date(), has_user_notes: hasUserNotes};
            this.categories[i].sources.unshift(newSource);
            let returnSource = this.categories[i].sources[0];
            let returnTitle = title;
            if (title === undefined || title === "" || title === null) {
                returnTitle = sourceTitle;
            }
            return {
                _id: returnSource._id,
                source_id: returnSource.source_id,
                source_name: returnTitle,
                source_notes: returnSource.source_notes,
                source_urlImgFlag: urlFlag,
                source_urlImg: sourceImg,
                source_img:  sourceImg,
                url: url,
                date_added: newSource.date_added,
                has_user_notes: hasUserNotes
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
            break;
        }
    }
};

userSchema.methods.createMailOptions = function(verifyCode) {
    return {
        from: "info@clasifyweb.com",
        to: this.email,
        subject: "Verify Your Clasify Account",
        html: '<h1>Hello ' + this.first_name + '!</h1>' +
            '<div>Your verification code is: ' + verifyCode + '</div>',
        text: 'Your verification code is: ' + verifyCode
    }
};

userSchema.methods.createMailOptionsChangeEmail = function(newEmail, verifyCode) {
    return {
        from: "info@clasifyweb.com",
        to: newEmail,
        subject: "Verify Your Email Address for Your Clasify Account",
        html: '<div style="font-weight: bold; font-size: 16pt; color: #a65cff">Hello ' + this.first_name + '!</div>' +
            '<div style="text-align: center">In order to change the email associated with your Clasify account, use the verification code below.  ' +
            'When you submit the code, this email address will be associated with your Clasify account.</div>' +
            '<div style="text-align: center; font-weight: bold; font-size: 13pt">Your verification code is: ' + verifyCode + '</div>',
        text: 'Your verification code is: ' + verifyCode
    }
};

userSchema.methods.createMailOptionsForgotPwd = function(tempPwd) {
    return {
        from: "info@clasifyweb.com",
        to: this.email,
        subject: "Temporary Clasify Password",
        html: '<div style="font-weight: bold; font-size: 16pt; color: #a65cff">Hello ' + this.first_name + '!</div>' +
            '<div style="text-align: center">This is your temporary Clasify password:</div>' +
            '<div style="text-align: center; font-weight: bold; font-size: 13pt">' + tempPwd + '</div>',
        text: 'Your temporary password is ' + tempPwd
    }
};

// the schema is useless so far
// we need to create a model using it
const User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;