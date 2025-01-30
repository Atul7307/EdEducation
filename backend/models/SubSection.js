const mongoose = require('mongoose');

const SubSectionSchema = new mongoose.Schema({
    title:{
        type: String,
        require: true,
    },
    timeDuration :{
        type:String, 
        require : true
    },
    description:{
        type: String
    },
    videoUrl:{
        type:String
    }

})

const SubSection = mongoose.model('SubSection', SubSectionSchema);
module.exports = SubSection;