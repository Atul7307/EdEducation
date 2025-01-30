const mongoose = require("mongoose");
require("dotenv").config();

exports.DbConnect = () => {
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("DB Connection Successfully"))
    .catch((error) => {
        console.log("DB Conection Error:");
        console.error(error);
        process.exit(1);
    })
}