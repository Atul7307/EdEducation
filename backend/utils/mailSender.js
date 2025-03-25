const nodemailer = require("nodemailer");

const mailSender = async (email , tittle , body) => {
    try {
        
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            secure: false,
            tls: {
                rejectUnauthorized: false
            }
        })

        let info = await transporter.sendMail({
            from: process.env.MAIL_USER , 
            to: `${email}`,
            subject: `${tittle}`,
            html: ` ${body}`
        })

        console.log(info)
        return info;

    } catch (error) {
        console.log("Error in mailSender: ", error)
    }
} 

module.exports = mailSender;