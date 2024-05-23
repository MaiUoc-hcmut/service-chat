const Message = require('../../db/model/message');
const Group = require('../../db/model/group');

import { Request, Response, NextFunction } from 'express';
import { socketInstance } from "../..";

const axios = require('axios');

require('dotenv').config();

declare global {
    namespace Express {
        interface Request {
            teacher?: any;
            student?: any;
            user?: USER;
        }

        type USER = {
            user?: any,
            role?: string,
            authority?: number
        }
    }
}

class MessageController {

    getUserFromAPI = async (url: string) => {
        try {
            const response = await axios.get(url);
            return {
                data: response.data
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                return null;
            } else {
                throw error;
            }
        }
    }

    // [GET] /messages
    getAllMessage = async (_req: Request, res: Response, _next: NextFunction) => {
        try {
            const messages = await Message.find();

            res.status(200).json(messages);
        } catch (error: any) {
            console.log(error.message);
            res.status(500).json({
                error,
                message: error.message
            });
        }
    }

    // [GET] /messages/groups/:groupId
    getMessagesInGroup = async (req: Request, res: Response, _next: NextFunction) => {
        try {
            const id_user = req.user?.user.data.id;
            const id_group = req.params.groupId;
            const scrollSize: number = parseInt(process.env.SIZE_OF_PAGE || '10');

            let cutoff: any;

            const lastMessage = req.query.lastMessage;
            if (lastMessage) {
                const message = await Message.findOne({
                    id: lastMessage
                });
                if (!message) {
                    return res.status(400).json({
                        message: "Last message does not exist",
                        id: lastMessage
                    });
                }
                cutoff = new Date(message.createdAt);
            } else {
                cutoff = new Date();
            }

            // Thêm phương thức lean() để trả về đối tượng JSON
            // Vì mongoose trả về đối tượng MongooseDocument nên không thể thao tác với từng phần tử trong mảng được
            const messages = await Message.find({
                id_group,
                createdAt: {
                    $lt: cutoff
                }
            }).sort({ createdAt: -1 }).limit(scrollSize).lean().exec();

            for (const message of messages) {
                const student = await this.getUserFromAPI(`${process.env.BASE_URL_USER_LOCAL}/student/${message.author}`);
                if (student) {
                    delete message.author;
                    message.author = {
                        id: student.data.id,
                        name: student.data.name,
                        avatar: student.data.avatar
                    }
                    continue;
                }

                const teacher = await this.getUserFromAPI(`${process.env.BASE_URL_USER_LOCAL}/teacher/get-teacher-by-id/${message.author}`);
                if (teacher) {
                    delete message.author;
                    message.author = {
                        id: teacher.data.id,
                        name: teacher.data.name,
                        avatar: teacher.data.avatar
                    }
                    continue;
                }
            }
            
            if (messages.length > 0) {
                const group = await Group.findOne({
                    id: id_group
                });
                group.members = group.members.map((m: any) => {
                    if (m.id === id_user) {
                        return { ...m, lastMessageSeen: messages[0].id };
                    }
                    return m;
                });
                await group.save();
            }

            res.status(200).json(messages);
        } catch (error: any) {
            console.log(error.message);
            res.status(500).json({
                error,
                message: error.message
            });
        }
    }

    // [POST] /messages
    createMessage = async (req: Request, res: Response, _next: NextFunction) => {
        try {
            const author = req.user?.user.data.id;
            const authorName = req.user?.user.data.name;
            const authorAvatar = req.user?.user.data.avatar;
            const authorRole = req.user?.role;

            const io = socketInstance.getIoInstance();
            const clientConnected = socketInstance.getClientConnected();

            let body = req.body.data;

            if (typeof body === "string") {
                body = JSON.parse(body);
            }

            let id_group = body.id_group;

            const message = await Message.create({
                author,
                body: body.body,
                id_group
            });

            const members = [
                { id: author, lastMessageSeen: message.id },
                { id: body.user, lastMessageSeen: "" }
            ]

            if (body.user) {
                await Group.create({
                    id: id_group,
                    members,
                    admins: [author, body.user],
                    lastMessage: body.body,
                    lastMessageId: message.id,
                    lastSenderId: author,
                    lastSenderName: authorName,
                    individual: true
                });
            } else {
                const group = await Group.findOne({
                    id: id_group
                });
                group.lastMessage = body.body;
                group.lastMessageId = message.id
                group.lastSenderId = author;
                group.lastSenderName = authorName;
                group.members = group.members.map((m: any) => {
                    if (m.id === author) {
                        return { ...m, lastMessageSeen: message.id };
                    }
                    return m;
                });
                await group.save();
            }

            if (body.user) {
                const userOnline = clientConnected.find(o => o.user === body.user);
                const senderOnline = clientConnected.find(o => o.user === author);
                if (userOnline) {
                    io.to(`${userOnline.socket}`).emit("new_individual_group_created", {
                        id_group,
                        author: {
                            id: author,
                            role: authorRole,
                            name: authorName,
                            avatar: authorAvatar,
                            id_message: message.id
                        },
                        message: body.body
                    });
                }
                if (senderOnline) {
                    io.to(`${senderOnline.socket}`).emit("new_individual_group_created", {
                        id_group,
                        author: {
                            id: author,
                            role: authorRole,
                            name: authorName,
                            avatar: authorAvatar,
                            id_message: message.id
                        },
                        message: body.body
                    });
                }
            } else {
                io.to(id_group).emit("new_message_created", {
                    message: body.body,
                    id_group,
                    author: {
                        id: author,
                        name: authorName,
                        avatar: authorAvatar,
                        id_message: message.id
                    }
                });
            }

            res.status(201).json(message);
        } catch (error: any) {
            console.log(error.message);
            res.status(500).json({
                error,
                message: error.message
            });
        }
    }

    // [POST] /messages/system
    createMessageBySystem = async (req: Request, res: Response, _next: NextFunction) => {
        try {
            const io = socketInstance.getIoInstance();
            const clientConnected = socketInstance.getClientConnected();

            let body = req.body.data;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }

            let { members } = body;
            members = members.map((id: string) => ({
                id,
                lastMessageSeen: ""
            }));

            const group = await Group.findOne({
                individual: true,
                members: {
                    $all: [...members]
                }
            });

            let id_group = "";

            if (!group) {
                const newGroup = await Group.create({
                    members: [...members],
                    admins: [...members],
                    lastMessage: body.body,
                    lastSenderId: body.sender.id,
                    lastSenderName: body.sender.name,
                    individual: true
                });
                id_group = newGroup.id;
            } else {
                group.lastMessage = body.body;
                group.lastSenderId = body.sender.id;
                group.lastSenderName = body.sender.name;

                await group.save();
                id_group = group.id;
            }

            const message = await Message.create({
                body: body.body,
                author: body.sender.id,
                id_group
            });
            
            if (!group) {
                const senderOnilne = clientConnected.find(o => o.user === body.sender.id);
                const receiverOnline = clientConnected.find(o => o.user === body.receiver.id);

                if (senderOnilne) {
                    io.to(`${senderOnilne.socket}`).emit("new_individual_group_created", {
                        id_group,
                        author: {
                            id: body.sender.id,
                            role: body.sender.role,
                            name: body.sender.name,
                            avatar: body.sender.avatar,
                            id_message: message.id
                        },
                        message: body.body
                    });
                }

                if (receiverOnline) {
                    io.to(`${receiverOnline.socket}`).emit("new_individual_group_created", {
                        id_group,
                        author: {
                            id: body.sender.id,
                            role: body.sender.role,
                            name: body.sender.name,
                            avatar: body.sender.avatar,
                            id_message: message.id
                        },
                        message: body.body
                    });
                }
            } else {
                io.to(`${id_group}`).emit("new_message_created", {
                    message: body.body,
                    id_group,
                    author: {
                        id: body.sender.id,
                        name: body.sender.name,
                        avatar: body.sender.avatar,
                        id_message: message.id
                    }
                });
            }

            res.status(201).json(message);
        } catch (error: any) {
            console.log(error.message);
            res.status(500).send(error.message);
        }
    }
}

module.exports = new MessageController();