const express = require("express");
const app = express();

const events = require('events');
events.EventEmitter.defaultMaxListeners = 20;

const userRoutes = require('./routes/User');
const profileRoutes = require('./routes/Profile');
const paymentRoutes = require('./routes/Payments');
const courseRoutes = require('./routes/Course');
const contactUsRoutes = require('./routes/Contact');

const database = require('./config/database');
const {cloudinaryConnect} = require('./config/cloudinary');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 4000;

// Connect to the database
database.DbConnect();
cloudinaryConnect();

// Middleware
app.use(express.json());
app.use(cors(
    {
        origin: "*",
        credentials: true,
    }
));
app.use(cookieParser());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

// Routes
app.use("/api/vi/auth", userRoutes);
app.use("/api/vi/profile", profileRoutes);
app.use("/api/vi/payment", paymentRoutes);
app.use("/api/vi/course", courseRoutes);
app.use("/api/vi/reach", contactUsRoutes);

// default route
app.get("/", (req, res) => {
    res.send("Welcome to the backend server");
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});