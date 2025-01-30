const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
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

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;