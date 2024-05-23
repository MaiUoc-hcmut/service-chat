const mongoose = require('mongoose');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const validateUUID = {
    validator: function (v: string) {
        return uuidValidate(v);
    },
    message: "Id must be valid UUID!"
}

const messageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: uuidv4,
            // validate: validateUUID,
        },
        author: {
            type: String,
            validate: validateUUID,
        },
        id_group: {
            type: String,
            ref: 'ChatGroup',
            // validate: validateUUID,
        },
        body: {
            type: String,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
    }
);
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;

export { }
