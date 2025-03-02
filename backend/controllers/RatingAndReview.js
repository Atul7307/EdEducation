const RatingAndReview = require('../models/RatingAndReview');
const Course = require('../models/Course');

// create Rating
exports.createRating = async (req, res) => {
    try {
        // fetch rating data from request body
        const { rating, review, courseId } = req.body;
        // get user id from request
        const userId = req.user.id;

        // get user are enrolled or not
        const courseDetails = await Course.findOne({    
            _id: courseId, 
            studentsEnrolled: {$eleMatch: {$eq: userId}}
        });
        if (!courseDetails) {
            return res.status(404).json({ 
                success: false,
                message: "You are not enrolled in this course" 
            });
        }

        // check if user already rated the course
        const alreadyreviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId
        });
        if (alreadyreviewed) {
            return res.status(403).json({
                success: false,
                message: "You have already rated this course"
            });
        }


        // create rating and review
        const ratingReview = await RatingAndReview.create({
            user: userId,
            course: courseId,
            rating,
            review
        })

        // update course rating
        await Course.updateOne({ _id: courseId }, {
            $push: { rating: ratingReview._id },
        }, { new: true });

        // send response
        res.status(201).json({
            success: true,
            message: "Rating and Review created successfully",
            data: ratingReview
        });

        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
        
    }
}