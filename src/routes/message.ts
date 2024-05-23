const express = require('express');
const router = express.Router();

const MessageController = require('../app/controllers/MessageController');
const Authorize = require('../app/middleware/authorize');
const CheckingMessage = require('../app/middleware/message');

router.route('/')
    .get(MessageController.getAllMessage)
    .post(
        Authorize.verifyUser, 
        CheckingMessage.checkCreateMessage, 
        MessageController.createMessage
    );

router.route('/system')
    .post(MessageController.createMessageBySystem);

router.route('/group/:groupId')
    .get(
        Authorize.verifyUser,
        CheckingMessage.checkGetMessageInGroup,
        MessageController.getMessagesInGroup
    );

module.exports = router;

export {}