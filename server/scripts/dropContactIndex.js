const mongoose = require("mongoose");
const RoundRobinMember = require("../model/roundRobinMember");
require("dotenv").config({ path: __dirname + "/../.env" });

const uri = process.env.MONGODB_URI;

const dropIndex = async () => {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const collection = RoundRobinMember.collection;
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes);

        const contactIndex = indexes.find(idx => idx.name === "contact_1" || (idx.key && idx.key.contact));

        if (contactIndex) {
            console.log("Found contact index. Dropping...");
            await collection.dropIndex("contact_1");
            console.log("Successfully dropped contact_1 index.");
        } else {
            console.log("contact_1 index not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

dropIndex();
