const express = require('express');
const router = express.Router();

const GroupController = require('../app/controllers/GroupController');
const CheckingGroup = require('../app/middleware/group');
const Authorize = require('../app/middleware/authorize');

router.route('/')
    .post(
        Authorize.verifyUser, 
        CheckingGroup.checkCreateGroup,
        GroupController.createGroup
    );

router.route('/:groupId/add-new-users')
    .put(
        Authorize.verifyUser,
        CheckingGroup.checkAddUserToGroup,
        GroupController.addNewUserToGroup
    );

router.route('/:groupId/remove-users')
    .put(
        Authorize.verifyUser,
        CheckingGroup.checkRemoveUserFromGroup,
        GroupController.removeUserFromGroup
    );

router.route('/:groupId/leave-group')
    .put(
        Authorize.verifyUser,
        GroupController.userLeaveGroup
    );

router.route('/list')
    .get(
        Authorize.verifyUser, 
        GroupController.getGroupsOfUser
    );

module.exports = router;