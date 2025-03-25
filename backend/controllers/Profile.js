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



exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}

exports.getEnrolledCourses = async (req, res) => {
	try {
	  const userId = req.user.id
	  let userDetails = await User.findOne({
		_id: userId,
	  })
		.populate({
		  path: "courses",
		  populate: {
			path: "courseContent",
			populate: {
			  path: "subSection",
			},
		  },
		})
		.exec()

	  userDetails = userDetails.toObject()
	  var SubsectionLength = 0
	  for (var i = 0; i < userDetails.courses.length; i++) {
		let totalDurationInSeconds = 0
		SubsectionLength = 0
		for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
		  totalDurationInSeconds += userDetails.courses[i].courseContent[
			j
		  ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
		  userDetails.courses[i].totalDuration = convertSecondsToDuration(
			totalDurationInSeconds
		  )
		  SubsectionLength +=
			userDetails.courses[i].courseContent[j].subSection.length
		}
		let courseProgressCount = await CourseProgress.findOne({
		  courseID: userDetails.courses[i]._id,
		  userId: userId,
		})
		courseProgressCount = courseProgressCount?.completedVideos.length
		if (SubsectionLength === 0) {
		  userDetails.courses[i].progressPercentage = 100
		} else {
		  // To make it up to 2 decimal point
		  const multiplier = Math.pow(10, 2)
		  userDetails.courses[i].progressPercentage =
			Math.round(
			  (courseProgressCount / SubsectionLength) * 100 * multiplier
			) / multiplier
		}
	  }
  
	  if (!userDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find user with id: ${userDetails}`,
		})
	  }
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }

  
exports.instructorDashboard = async(req, res) => {
	try{
		const courseDetails = await Course.find({instructor:req.user.id});

		const courseData  = courseDetails.map((course)=> {
			const totalStudentsEnrolled = course.studentsEnrolled.length
			const totalAmountGenerated = totalStudentsEnrolled * course.price

			//create an new object with the additional fields
			const courseDataWithStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudentsEnrolled,
				totalAmountGenerated,
			}
			return courseDataWithStats
		})

		res.status(200).json({courses:courseData});

	}
	catch(error) {
		console.error(error);
		res.status(500).json({message:"Internal Server Error"});
	}
}