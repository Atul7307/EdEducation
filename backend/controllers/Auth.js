const User = require('../models/User')
const OTP = require("../models/OTP");
const otpGenerator = require('otp-generator');
const bcrypt = require("bcrypt")
const Profile = require("../models/Profile")
const jwt = require("jsonwebtoken");
const mailSender = require('../utils/mailSender');
require("dotenv").config();

// send OTP 
exports.sendOTP = async (req, res) => {

    try {

        // fetch the email from request 
        const { email } = req.body;

        // check if user already exist
        const checkUserPresent = await User.findOne({ email });

        // if user already exist , return a response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already Registered !",
            })
        }

        // otp generate 
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // check unique otp or not 
        const result = await OTP.findOne({ otp: otp })

        while (result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            })
            result = await OTP.findOne({ otp: otp });
        }

        const otpPayload = { email, otp };
        // create and entry for otp
        const otpbody = await OTP.create(otpPayload);
        console.log(otpbody)

        // return succesfull response
        return res.status(200).json({
            success: true,
            message: "OTP Sent Succesfully",
            otp,
        })


    } catch (error) {
        console.log("OTP sending error on controller", error)
        return res.status(500).json({
            success: false,
            message: `${error.message}`,
            error
        })
    }
}


// signup controller
exports.signup = async (req, res) => {

    try {

        // data fetch from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // validatation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are Required"
            })
        }

        //2 password matching
        if (password != confirmPassword) {
            return res.status(400).json({
                success: false,
                message: " Password and Confirm Password does not match, Please try again"
            })
        }

        // check user already exist or not
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User is  already Registered !"
            })
        }

        // find most recent OTP stored for the user
        const recentOtp = await OTP.find({ email }).sort({ createddAt: -1 }).limit(1);
        console.log(recentOtp)

        // validate OTP 
        if (recentOtp.length == 0) {
            // otp not found
            return res.status(400).json({
                success: false,
                message: "OTP not found"
            })
        }
        else if (recentOtp != otp) {
            // Invalid otp 
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10)

        // entry create in DB
        const profileDetail = await Profile.create({
            gender: null,
            dateofBirth: null,
            about: null,
            contactNumber: null
        });
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetail._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        // return response
        return res.status(200).json({
            success: true,
            message: "User is Registered Successfully",
            data: user
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "user cannot be registered please try again",
            error
        });
    }
}

// Login 
exports.login = async (req, res) => {
    try {

        // get data from req body
        const { email, password } = req.body;

        // data validation 
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All fields are Required! Please Try Again"
            })
        }

        // check user exist or not
        const user = User.findOne({ email }).populate("AdditionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not exist ! Please signup first"
            })
        }

        // generate JWT , after password matching
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const option = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }

            res.cookie("token", token, option).status(200).json({
                success: true,
                message: "Logged in successfully !",
                user,
                token,
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect."
            })
        }

    } catch (error) {
        console.log("Login Process Fail Error :", error)
        return res.status(500).json({
            success: false,
            message: "Login failure ! Please Try Again"
        })
    }
}

// change password
exports.changePassword = async (req, res) => {

    try {
        // get data from req body

        // get old password , new password , confirm new password
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // validation
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(403).json({
                success: false,
                message: "All fields are required !"
            })
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New Password and Confirm New Password does not match"
            })
        }
        // check if user exist
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found !"
            })
        }
        // check if old password is correct
        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Old Password is incorrect"
            })
        }
        // hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // update user password
        await User.findByIdAndUpdate(
            req.user._id,
            {
                password: hashedPassword
            },
            {new: true}
        )


        // send mail -- password update by nodemailer to the user email id
        const mailresponce = mailSender(user.email, "Password Changed", "Password has changed succefully!")

        // return response
        return res.status(200).json({
            success: true,
            message: "Password Updated Successfully",
        });

    } catch (error) {
        console.log("Changening password failure!", error);
        return res.status(500).json({
            success: false,
            message: "Password change failed",
            error
        })

    }

}