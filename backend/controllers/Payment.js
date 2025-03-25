const crypto = require('crypto');
const { instance } = require('../config/razorpay')
const Course = require('../models/Course')
const User = require('../models/User')
const meailSender = require('../utils/mailSender')
const { courseEnrollmentMail } = require('../mail/templates/courseEnrollmentEmail');
const { default: mongoose } = require('mongoose');
require('dotenv').config();



// capture the payment and initiate the Razorpay order 
exports.capturePayment = async (req, res) => {
    try {
        //get courseId and userID 
        const { courseId } = req.body
        const userId = req.user.id

        //validation
        //valid CourseID
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a course ID'
            })
        }
        //valid course Details
        let course;
        try {
            course = await Course.findById(courseId)
            if (!course) {
                return res.status(401).json({
                    success: false,
                    message: 'Could not find the course',
                })
            }

            // user already pay for the same course 
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.students.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: 'You have already enrolled in this course'
                })
            }


        } catch (error) {
            console.log(error)
            return res.status(400).json({
                success: false,
                message: error.message
            })
        }


        // order create 
        const amount = course.price * 100 // amount in paisa
        const currency = 'INR'
        const receipt = `course_${course._id}_${userId}`
        const payment_capture = 1
        const option = {
            amount,
            currency,
            receipt,
            payment_capture,
            notes: {
                courseId: courseId,
                userId: userId
            }
        }

        try {
            // initiate the payment using razorpay
            const paymentReponce = await instance.orders.create(option)
            console.log(paymentReponce);
            // return response
            return res.status(200).json({
                success: true,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                thumbnail: course.thumbnail,
                orderId: paymentReponce.id,
                currency: paymentReponce.currency,
                amount: paymentReponce.amount,
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({
                success: false,
                message: error.message
            })
        }

    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "does not initiate the payment",
        })

    }
};


// verify signature 
exports.verifySignature = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        const shasum = crypto.createHmac('sha256', webhookSecret)
        shasum.update(JSON.stringify(req.body))
        const digest = shasum.digest('hex')
        if (digest === signature) {
            console.log('Request Payment verified!')
            // process the request
            const { payload } = req.body
            const { payment } = payload
            const { entity } = payment
            const { notes } = entity
            const { courseId, userId } = notes
            try {
                // find the course and enroll the student 
                const enrolledCourse = await Course.findByIdAndUpdate(courseId, {
                    $push: {
                        studentsEnrolled: userId
                    }
                }, {
                    new: true
                })
                if (!enrolledCourse) {
                    return res.status(400).json({
                        success: false,
                        message: 'Could not enroll the student'
                    })
                }
                console.log(enrolledCourse)
                // update the user
                const enrolledStudent = await User.findByIdAndUpdate(userId, {
                    $push: {
                        courses: courseId
                    }

                }, {
                    new: true
                })
                console.log(enrolledStudent)
                // send email
                const emailResponse = await meailSender({
                    email: enrolledStudent.email,
                    subject: 'Congratulations! You have successfully enrolled in the course',
                    html: courseEnrollmentMail(enrolledStudent.name, enrolledCourse.courseName)
                })
                // send response
                res.json({
                    success: true,
                    message: 'Payment successful',
                    course: enrolledCourse,
                    user: studentsEnrolled,
                })

            } catch (error) {
                console.error(error)
                res.status(500).json({
                    success: false,
                    message: error.message
                })

            }
        }
        else {
            console.log('Request Payment not verified!')
            res.status(400).json({
                success: false,
                message: 'Payment not verified'
            })
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;
    console.log('Received request for sendPaymentSuccessEmail:', req.body);
    const userId = req.user.id;
  
    if (!orderId || !paymentId || !amount || !userId) {
      console.log('Missing required details');
      return res.status(400).json({ success: false, message: 'Please provide all the details' });
    }
  
    try {
      console.log('Finding enrolled student with ID:', userId);
      const enrolledStudent = await User.findById(userId);
      await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
          amount / 100,
          orderId,
          paymentId
        )
      );
      console.log('Payment success email sent to:', enrolledStudent.email);
      res.json({ success: true, message: 'Payment success email sent' });
    } catch (error) {
      console.error('Error in sendPaymentSuccessEmail:', error);
      return res.status(500).json({ success: false, message: 'Could not send email', error: error.message });
    }
  };
  
  const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
      console.log('Missing courses or userId');
      return res.status(400).json({ success: false, message: 'Please Provide Course ID and User ID' });
    }
  
    try {
      for (const courseId of courses) {
        console.log('Enrolling user in course:', courseId);
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentsEnrolled: userId } },
          { new: true }
        );
  
        if (!enrolledCourse) {
          console.log('Course not found:', courseId);
          return res.status(404).json({ success: false, error: 'Course not found' });
        }
  
        console.log('Creating course progress for user:', userId);
        const courseProgress = await CourseProgress.create({
          courseID: courseId,
          userId: userId,
          completedVideos: [],
        });
  
        console.log('Updating user with enrolled course and progress:', userId);
        const enrolledStudent = await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              courses: courseId,
              courseProgress: courseProgress._id,
            },
          },
          { new: true }
        );
  
        console.log('Sending enrollment email to:', enrolledStudent.email);
        await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        );
  
        console.log('Enrolled student:', enrolledStudent);
      }
      console.log('Students enrolled successfully');
      res.json({ success: true, message: 'Students enrolled successfully' });
    } catch (error) {
      console.error('Error in enrollStudents:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };















// // Create an order
// exports.createOrder = async (req, res) => {
//     try {
//         const options = {
//             amount: req.body.amount * 100, // amount in the smallest currency unit
//             currency: "INR",
//             receipt: "receipt#1",
//             payment_capture: 1
//         };

//         const order = await razorpay.orders.create(options);
//         res.json(order);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// };

// // Verify payment signature
// exports.verifyPayment = (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     const hmac = crypto.createHmac('sha256', 'YOUR_KEY_SECRET');
//     hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
//     const generatedSignature = hmac.digest('hex');

//     if (generatedSignature === razorpay_signature) {
//         res.json({ status: 'success' });
//     } else {
//         res.status(400).json({ status: 'failure' });
//     }
// };