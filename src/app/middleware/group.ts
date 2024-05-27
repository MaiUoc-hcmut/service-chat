import { Request, Response, NextFunction } from 'express';
const createError = require('http-errors');

const Group = require('../../db/model/group');

const axios = require('axios');


class CheckingGroup {
    checkGetGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_group = req.params.groupId;
            const id_user = req.user?.user.data.id;

            const group = await Group.findOne({
                id: id_group
            });

            if (!group) {
                let error = "Group does not exist!";
                return next(createError.NotFound(error));
            }

            const userInGroup = group.members.find((u: any) => u.id === id_user);
            if (!userInGroup) {
                let error = "You do not have permission to get this information!";
                return next(createError.Unauthorized(error));
            }
            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkGetGroupOfUser = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            
        } catch (error) {
            
        }
    }

    checkCreateGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }

            const author = req.user?.user.data.id;

            let { name, members, individual } = body;
            
            individual = (individual === undefined || individual === "") ? true : individual;
            if (members.length > 1 && individual) {
                let error = "If group have at least 3 members, this group is not individual group!";
                return next(createError.BadRequest(error));
            }

            if (!name && !individual) {
                let error = "Group must have a name!";
                return next(createError.BadRequest(error));
            }

            if (!members || members.length === 0) {
                let error = "You can not create a group with just you a member!";
                return next(createError.BadRequest(error));
            }

            if (individual) {
                const friend = members[0];
                const group = await Group.findOne({
                    individual: true,
                    members: {
                        $all: [author, friend]
                    }
                });
                if (group) {
                    let error = "You and this user already have group chat!";
                    return next(createError.BadRequest(error));
                }
            }

            for (const user of members) {
                try {
                    const student = await axios.get(`${process.env.BASE_URL_USER_LOCAL}/student/${user}`);
                } catch (error: any) {
                    try {
                        const teacher = await axios.get(`${process.env.BASE_URL_USER_LOCAL}/teacher/get-teacher-by-id/${user}`);
                    } catch (error) {
                        let e = `User with id: ${user} does not exist!`;
                        return next(createError.BadRequest(e));
                    }
                }
            }

            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkSetAdminForGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            
        } catch (error) {
            
        }
    }

    checkAddUserToGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_user = req.user?.user.data.id;
            const id_group = req.params.groupId;

            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }
            if (!body.users) {
                let error = "You must provide users to add to group";
                return next(createError.BadRequest(error));
            }

            const group = await Group.findOne({
                id: id_group
            });
            if (!group) {
                let error = "Group does not exist!";
                return next(createError.BadRequest(error));
            }
            const userInGroup = group.members.find((u: any) => u.id === id_user);
            if(!userInGroup) {
                let error = "You are not in this group to add new member";
                return next(createError.Unauthorized(error));
            }
            for (const user of body.users) {
                const userToAddInGroup = group.members.find((u: any) => u.id === user)
                if (userToAddInGroup) {
                    let error = "One of users that you want to add to group are already in group";
                    return next(createError.BadRequest(error));
                }
            }
            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkRemoveUserFromGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_user = req.user?.user.data.id;
            const id_group = req.params.groupId;

            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }
            if (!body.users) {
                let error = "You must provide users to remove from group";
                return next(createError.BadRequest(error));
            }

            const group = await Group.findOne({
                id: id_group
            });
            if (!group) {
                let error = "Group does not exist!";
                return next(createError.BadRequest(error));
            }
            const userInGroup = group.members.find((u: any) => u.id === id_user);
            if(!userInGroup) {
                let error = "You are not in this group to add new member";
                return next(createError.Unauthorized(error));
            }
            for (const user of body.users) {
                const userToRemove = group.members.find((u: any) => u.id === user);
                if (!userToRemove) {
                    let error = "One of users that you want to remove out of group are already out of group";
                    return next(createError.BadRequest(error));
                }
            }
            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkUserLeaveGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkUpdateGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_user = req.user?.user.data.id;

            const group = await Group.findOne({
                id: req.params.groupId
            });

            if (!group) {
                let error = "This group does not exist!";
                return next(createError.NotFound(error));
            }

            const userInGroup = group.members.find((u: any) => u.id === id_user);
            if (!userInGroup) {
                let error = "You are not in this group to make an update!";
                return next(createError.Unauthorized(error));
            }
            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkDeleteGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_group = req.params.groupId;
            const id_user = req.user?.user.data.id;

            const group = await Group.findOne({
                id: id_group
            });

            if (!group) {
                let error = "This group does not exist!";
                return next(createError.NotFound(error));
            }

            if (!group.admins.includes(id_user)) {
                let error = "You are not admin of this group so you do not have permision to delete it!";
                return next(createError.Unauthorized(error));
            }

            if (group.members.length > 1) {
                let error = "You can not delete group if still have member, make sure you remove all others member before delete group!";
                return next(createError.BadRequest(error));
            }

            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }
}


module.exports = new CheckingGroup();