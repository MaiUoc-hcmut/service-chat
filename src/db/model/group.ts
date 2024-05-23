const mongoose = require('mongoose');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const validateUUID = {
    validator: function (v: string) {
        console.log(v);

        return uuidValidate(v);
    },
    message: "Id must be valid UUID!"
}

const memberSchema = new mongoose.Schema(
    {
        id: String,
        lastMessageSeen: String
    }
)

const groupSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: uuidv4,
            // validate: validateUUID
        },
        lastMessage: {
            type: String,
            ref: 'Message',
        },
        lastMessageId: {
            type: String
        },
        lastSenderId: {
            type: String,
            validate: validateUUID
        },
        lastSenderName: {
            type: String
        },
        members: [memberSchema],
        admins: [{ type: String, validator: validateUUID }],
        name: {
            type: String,
        },
        individual: {
            type: Boolean,
        }
    }, {
    timestamps: true,
}
);

groupSchema.virtual('messages', {
    ref: 'Message',
    foreignField: 'id_group',
    localField: 'id'
})

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;