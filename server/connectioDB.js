const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGODB_URI;

const connectToDatabase = async () => {
    try {
        // await mongoose.connect(uri, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });
        await mongoose.connect(uri)
        console.log("Connected to MongoDB successfully");

    }catch (error) {
        console.error("Error connecting to MongoDB:", error);
        // process.exit(1); // Exit the process with failure
    }
};

module.exports = connectToDatabase;