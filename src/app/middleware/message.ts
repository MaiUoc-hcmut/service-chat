import { Request, Response, NextFunction } from 'express';
const createError = require('http-errors');

const Group = require('../../db/model/group');


class CheckingMessage {
    checkCreateMessage = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const author = req.user?.user.data.id;
            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }

            if (!body.body) {
                let error = "Message must contain body"
                return next(createError.BadRequest(error));
            }

            if (body.user && body.id_group) {
                const group = await Group.findOne({
                    individual: true,
                    members: {
                        $all: [author, body.user]
                    }
                });
                if (group) {
                    let error = "The group with this user already exist!";
                    return next(createError.BadRequest(error));
                }
            }

            if (!body.id_group) {
                let error = "You must provide id_group!";
                return next(createError.BadRequest(error));
            }

            if (body.id_group && !body.user) {
                const group = await Group.findOne({ id: body.id_group });
                if (!group) {
                    let error = "Group does not exist!";
                    return next(createError.BadRequest(error));
                }

                const userInGroup = group.members.find((u: any) => u.id === author);
                if (!userInGroup) {
                    let error = "You do not in this group!";
                    return next(createError.Unauthorized(error));
                }
            }
            
            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkSystemCreateMessage = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }

            const key = body.key;
            const systemKey = `${process.env.SECRET_KEY_FOR_CREATE_MESSAGE_BY_SYSTEM}`;
            if (key !== systemKey) {
                let error = "System key fault!";
                return next(createError.Unauthorized(error));
            }

            next();
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }

    checkGetMessageInGroup = async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const id_user = req.user?.user.data.id;
            const id_group = req.params.groupId;

            const group = await Group.findOne({
                id: id_group
            });
            if (!group) {
                let error = "Group does not exist!";
                return next(createError.BadRequest(error));
            }
            const userInGroup = group.members.find((u: any) => u.id === id_user);
            if (!userInGroup) {
                let error = "You are not in this group to get messages";
                return next(createError.Unauthorized(error));
            }
            next()
        } catch (error: any) {
            console.log(error.message);
            next(createError.InternalServerError(error.message));
        }
    }
}

module.exports = new CheckingMessage();