const Section = require('../models/Section');
const Course = require('../models/Course');

exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;

        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields."
            });
        }

        const newSection = await Section.create({ sectionName });
        const updatedCourse = await Course.findByIdAndUpdate(courseId, {
            $push: {
                courseContent: newSection._id
            }
        }, { new: true })
            .populate('courseContent')
            .populate({ path: 'courseContent.subSection' })
            .exec();

        return res.status(201).json({
            success: true,
            message: "Section created successfully",
            data: updatedCourse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to create section, please try again later.",
            error: error.message
        });
    }
}


exports.updateSection = async (req, res) => {
    try {

        // Get sectionId and sectionName from request body
        const { sectionId, sectionName } = req.body;
        // Check if sectionId and sectionName are provided
        if (!sectionId || !sectionName) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties."
            });
        }
        // Find and update section
        const updatedSection = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });
        // Check if section is updated
        if (!updatedSection) {
            return res.status(404).json({
                success: false,
                message: "Section not found."
            });
        }

        // todo : do we  need to delete the section from the courseContent array of the course
        

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to update section, please try again later.",
            error: error.message
        }); 
    }
}


exports.deleteSection = async (req, res) => {
    try {
        // Get sectionId from params
        const sectionId = req.params;
        // Check if sectionId is provided
        if (!sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties."
            });
        }
        // Find and delete section
        const deletedSection = await Section.findByIdAndDelete(sectionId);
        // Check if section is deleted
        if (!deletedSection) {
            return res.status(404).json({
                success: false,
                message: "Section not found."
            });
        }
        // Return success response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: deletedSection
        }); 
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to delete section, please try again later.",
            error: error.message
        });
        
    }
}