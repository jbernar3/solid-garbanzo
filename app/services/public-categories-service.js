const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');

class PublicCategoriesService {
    static async PostCategory(sharerID, categoryID, callback) {
        User.findOne({_id: sharerID}, function(err, user) {
            if (err) {
                callback(null, "ERROR: error isolating sharer");
            } else {
                PublicCategories.findOne({sharer_id: sharerID, category_id: categoryID}, function(err, pubCategory) {
                    if (pubCategory !== null) {
                        callback(null, "ERROR: category already posted");
                    } else {
                        const newPubCategory = PublicCategories();
                        newPubCategory.sharer_id = sharerID;
                        newPubCategory.category_id = categoryID;
                        newPubCategory.last_updated = new Date();
                        newPubCategory.save(function(err) {
                            if (err) {
                                callback(null, "ERROR: error posting category")
                            } else {
                                user.toggleIsPublicCategory(categoryID);
                                user.save(function(err) {
                                    if (err) {
                                        callback(null, "ERROR: error updating public status");
                                    } else {
                                        callback(null, newPubCategory);
                                    }
                                });
                            }
                        })
                    }
                })
            }
        });
    }

    static async GetGlobalCategories(callback) {
        PublicCategories.find({}).sort('last_updated').exec(function(err, categories) {
            const global_categories = [];
            for (let i=0; i<categories.length; i++) {
                User.findOne({_id: categories[i].sharer_id}, function(err, sharer) {
                    if (!err) {
                        global_categories.push(sharer.getUserCategory(categories[i].category_id));
                    }
                })
            }
            callback(null, global_categories);
        })
    }
}

module.exports = PublicCategoriesService;