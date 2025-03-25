const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const {uploadImageToCloudinary} = require('../utils/imageUploader');
require('dotenv').config();

exports.createSubSection = async (req, res) => {
    try {
        // fetch the data from req body
        const { title, description, timeDuration, sectionId } = req.body;

        //extract file and video
        const video = req.videoFile;

        // validation
        if (!title || !description || !sectionId || !timeDuration || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // create a SubSection
        const subSectionDetails = await SubSection.create({
            title,
            description,
            timeDuration,
            videoUrl: uploadDetails.secure_url,
        });

        // update section with this subsection objectId
        await Section.findByIdAndUpdate
            (sectionId, {
                $push: { subSections: subSectionDetails._id }
            }, { new: true }).populate('subSections');

        // return response
        return res.status(201).json({
            success: true,
            message: "SubSection created successfully",
            data: subSectionDetails,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to create SubSection",
            error: error.message,
        });
    }
}


// update SubSection
exports.updateSubSection = async (req, res) => {
    try {
        // fetch the data from req body and params
        const { title, description, timeDuration } = req.body;
        const { id } = req.params;

        // extract video
        const video = req.videoFile;

        // validation
        if (!title || !description || !timeDuration) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);


        // find SubSection and update
        const subSectionDetails = await SubSection.findByIdAndUpdate(id, {
            title,
            description,
            timeDuration,
            video: uploadDetails.secure_url
        }, { new: true }).populate('subSections');


        // return response
        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            data: subSectionDetails,
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to update SubSection",
            error: error.message,
        });
    }
}


// delete SubSection
exports.deleteSubSection = async (req, res) => {
    try {

        // fetch the id from params
        const { id } = req.params;

        // find SubSection and delete
        const subSectionDetails = await SubSection.findByIdAndDelete(id);

        // return response
        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
            data: subSectionDetails,
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete SubSection",
            error: error.message,
        }); 
        
    }
}