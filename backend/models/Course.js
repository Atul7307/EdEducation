const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    courseName : {
        type: String,
        required: true
    },
    courseDescription: {
        type: String,
        required: true
    },
    courseDuration: {
        type: String,
        
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    whatYouWillLearn: {
        type: String,
        required: true
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section',
            required: true
        }
    ],
    ratingAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RatingAndReview',
            required: true
        },
    ],
    price: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    tag:{
        type: [String],
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    studentsEnrolled : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],

});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;  