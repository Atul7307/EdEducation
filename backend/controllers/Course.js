const Category = require("../models/category")
const User = require("../models/User")
const Course = require("../models/Course")
const { uploadImageToCloudinary } = require("../utils/imageUploader");


// create course handler function
exports.createCourse = async (req, res) => {
    try {

        // fetch the data 
        const { courseName, courseDescription, whatYouWillLearn, price, tag, category, } = req.body;
        const thumbnail = req.files.thumbnailImage;

        // validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            })
        }

        // check for instructor
        const userId = req.user.id;
        const InstructorDetails = await User.findById(userId);
        console.log("Instructor Details: ", InstructorDetails);

        if (!InstructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details not found",
            })
        }

        // Category validation
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details not found",
            })
        }

        // upload to cloudinary 
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME,)

        // create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: InstructorDetails._id,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            tag,
            thumbnail: thumbnailImage.secure_url,
        })

        // add the new course to the use schema  of Instructor
        await User.findByIdAndUpdate({ _id: InstructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            { new: true },
        )
        // update the Category schema
        await Category.findByIdAndUpdate({ _id: categoryDetails._id },
            {
                $push: {
                    course: newCourse._id,
                }
            },
            { new: true },
        )

        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        })

    } catch (error) {

        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        })

    }
}



// getAllCourse handler function
exports.showallCourses = async (req, res) => {

    try {

        // find all courses from the course schema
        const allCourses = await Course.find({}, {
            courseName: true,
            price: true,
            thumbnail: true,
            ratingAndReviews: true,
            thumbnail: true,
            studentsEnrolled: true,
        }).populate('instructor').exec();

        return res.status(200).json({
            success: true,
            message: "All Courses Returned Successfully",
            data: allCourses,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })

    }
}

// getSingleCourse handler function
exports.getCourseDetails = async (req, res) => {
    try {
        const courseId = req.body;
        // find the course by id
        const course = await Course.findById(courseId)
            .populate(
                {
                    path: 'instructor',
                    populate: {
                        path: 'additionalDetail',
                    },

                }

            )
            .populate('category')
            .populate('ratingAndReviews')
            .populate(
                {
                    path:'courseContent',
                    populate:{
                        path:'subSection',
                    },
                }
            )
            .exec();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Course Details fetched Successfully",
            data: course,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// updateCourse handler function
exports.updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const { courseName, courseDescription, whatYouWillLearn, price, tag, category, } = req.body;
        const thumbnail = req.files.thumbnailImage;
        const course = await Course.findById(courseId).exec();
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            })
        }

        // Category validation
        const categoryDetails = await
            Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details not found",
            })
        }

        // upload to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME,)

        // update the course
        course.courseName = courseName;
        course.courseDescription = courseDescription;
        course.whatYouWillLearn = whatYouWillLearn;
        course.price = price;
        course.tag = tag;
        course.category = categoryDetails._id;
        course.thumbnail = thumbnailImage.secure_url;
        course.save();
        return res.status(200).json({
            success: true,
            message: "Course Updated Successfully",
            data: course,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}