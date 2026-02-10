const mongoose = require("mongoose");

const RoundRobinMemberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        grade: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        isMember: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const RoundRobinMember = mongoose.model("RoundRobinMember", RoundRobinMemberSchema);

module.exports = RoundRobinMember;
