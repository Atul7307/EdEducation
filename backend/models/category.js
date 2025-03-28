const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    course : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;