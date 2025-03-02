const Category = require("../models/catagory");

// create Category Handler Fumction
exports.createCategory = async (req, res) => {

    try {
        
        // fetch the data
        const {name , description} = req.body;
        // validation
            if(!name || !description){
                return res.status(400).json({
                    success: false,
                    message: "All Fields are required.",
                })
            }
        // create enrty in DB
        const categoryDetails = await Category.create({
            name,
            description,
        })
        console.log(categoryDetails);
        // return response
        return res.status(200).json({
            success: true,
            message: "Tag created Succefully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
        
    }
}


// getAllCategory handler Function
exports.showAllCategory = async (req , res) =>{
    try {
        const allCategory = await Category.find({}, {name: true, description:true});
        return res.status(200).json({
            success: true,
            message: " All Tags Returned Successfully.",
            allCategory,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}