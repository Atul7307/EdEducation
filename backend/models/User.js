
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [32, 'First name cannot exceed 32 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [32, 'Last name cannot exceed 32 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
    },
    accountType: {
        type: String,
        enum: ['Admin', 'Student', 'Instructor'],
        required: [true, 'Account type is required'],
    },
    additionalDetail: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: [true, 'Additional details are required'],
    },
    courses: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    image: {
        type: String,
        required: [true, 'Image is required'],
    },
    token:{
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    courseProgress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseProgress',
        },
});


const userModel = mongoose.model('User', userSchema);
module.exports = userModel;