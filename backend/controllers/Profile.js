const Profile = require('../models/Profile');
const User = require('../models/User');
require('dotenv').config();

// upadate user profile
exports.updateProfile = async (req, res) => {

    try {
        // get the data from the request body
        const {dateofBirth="", about="", contactNumber, gender} = req.body;

        // get the user id from the request
        const userId = req.user._id;

        // validation
        if(!contactNumber || !gender) {
            return res.status(400).json({
                success: false,
                message: " All fields are required"
            });
        }

        // find UserDetails by user id
        const userDetails = await User.findById(userId);
        if(!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const profileId = userDetails.additionalDetail
        const profileDetails = await Profile.findById(profileId);

        // update the profile
        profileDetails.contactNumber = contactNumber;
        profileDetails.about = about;
        profileDetails.dateofBirth = dateofBirth;
        profileDetails.gender = gender;
        await profileDetails.save();
        // send the response
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profileDetails
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Profile not updated",
            error: error.message
        });
    }
}


// delete account
// cron job to delete account after 30 days of deactivation
exports.deleteAccount = async (req, res) => {

    try {
        // get the user id from the request
        const userId = req.user.id;
        // find UserDetails by user id
        const userDetails = await User.findById(userId);
        if(!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const profileId = userDetails.additionalDetail
        // const profileDetails = await Profile.findById(profileId);

        // delete the profile   
        await Profile.findByIdAndDelete(profileId);

        // TODO: HW unenroll user from enrolled courses

        // delete the user details
        await User.findByIdAndDelete(userId);
        
        // send the response
        res.status(200).json({
            success: true,
            message: "User Account deleted successfully"
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Account not deleted",
            error: error.message
        });
        
    }
}

// get allUsers Detais
exports.getAllUsersDetails = async (req, res) => {
    try {
        // get user id from the request
        const userId = req.user.id;
        // find UserDetails by user id
        const userDetails = await User.findById(userId).populate('additionalDetail').exec();
        if(!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // send the response
        res.status(200).json({
            success: true,
            message: "user Data fetched successfully",
            userDetails
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error in getting all users details",
            error: error.message
        });
        
    }
}
