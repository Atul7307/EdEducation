 const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    gender:{
        type: String,
    },
    dateofBirth:{
        type: String,
    },
    contactNumber:{
        type:Number,
        trim:true,
    },
    about:{
        type:String,
        trim:true,
    }
});

module.exports = mongoose.model('Profile', ProfileSchema);
