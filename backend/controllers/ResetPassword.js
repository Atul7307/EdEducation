const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt")

// reset password tokem
exports.resetPasswordToken = async (req, res) => {

    try {

        //get email from req body
        const email = req.body.email

        // check user for this email, email validation
        const user = User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Your Email is not registered !",
            })
        }

        // token generation
        const token = crypto.randomUUID();
        // update user by adding token and expiration time 
        const updatedDetails = await User.findOneAndUpdate(
            { email },
            {
                token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000,
            },
            { new: true });

        const url = `http://localhost:3000/update-password/${token}`
        // send mail containing the url 
        await mailSender(email,
            "Password Reset Link",
            `Password Reset Link: ${url}`
        )
        // return response
        return res.json({
            success: true,
            message: "Email sent Successfully , please check your email and change password"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Reset password change Failure , please try again",
            error,
        })

    }
}

// reset password
exports.resetPassword = async (req, res) => {

    try {
        // fetch the data
        const { token, password, confirmPassword } = req.body;

        // validation
        if (!token || !password || !confirmPassword) {
            return res.status(401).json({
                success: false,
                message: "All fields are required",
            })
        }
        if (password != confirmPassword) {
            return res.json({
                success: false,
                message: "password is not matching"
            })
        }
        // check user for this token, token validation
        const user = await User.findOne({ token })
        if (!user) {
            return res.status(402).json({
                success: false,
                message: "Invalid Token",
            })
        }
        //  check token time
        if (user.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: "Token is Expired"
            })
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // password update
        await User.findOneAndUpdate(
            { token },
            {
                password: hashedPassword,
                token: "",
                resetPasswordExpires: null,
            },
            { new: true }
        )
        // return response
        return res.json({
            success: true,
            message: "Password reset Successfully !"
        })

    } catch (error) {
        return res.json({
            success: false,
            message: "something went to wrong while reset password",
            error,
        })

    }
}