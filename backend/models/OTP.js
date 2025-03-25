const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const otpTemplate = require('../mail/templates/emailVerificationTemplate');
require('dotenv').config();

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60,
    }
});


// send mail function
async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(email, 'Verification Email from EdEducation', otpTemplate(otp));
        console.log("Email sent successfully: ", mailResponse);

    } catch (error) {

        console.log("Error occured while sending mail: ", error);
        throw error;

    }
}

OTPSchema.pre('save', async function (next) {
    await sendVerificationEmail(this.email, this.otp);
    next();
})

const OTP = mongoose.model('OTP', OTPSchema);

module.exports = OTP;