const User = require('../models/users');
const Category = require('../models/categories');
const Resource = require('../models/sources');
const PublicCategories = require('../models/public_categories');

class PublicCategoriesService {
    static async PostCategory(sharerID, categoryID, callback) {
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
                        callback(null, newPubCategory)
                    }
                })
            }
        })
    }

    static async GetGlobalCategories(callback) {
        PublicCategories.find({}).sort('last_updated').exec(function(err, categories) {
            callback(null, categories);
        })
    }
}

module.exports = PublicCategoriesService;