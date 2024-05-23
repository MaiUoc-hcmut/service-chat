import { Socket, Server } from "socket.io";
const Group = require('./db/model/group');

const axios = require('axios');

export class SOCKETIO {
    private io: Server;
    private clientConnected: {
        user: string,
        socket: string,
    }[];

    constructor(server: any) {
        this.clientConnected = [];
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            }
        });

        this.setupSocketEvents();
    }

    private setupSocketEvents() {
        this.io.on("connection", (socket: Socket) => {
            console.log(`New user connected: ${socket.id}`)

            socket.on("new_user_online", async (userId) => {

                this.clientConnected.push({
                    user: userId,
                    socket: socket.id
                });
                console.log(this.clientConnected);

                // Join room when user online
                const groups = await Group.find({
                    members: userId
                });

                for (const group of groups) {
                    socket.join(`${group.id}`);
                }

            });

            socket.on("add_user_to_group", async (data) => {
                this.io.to(`${data.id_group}`).emit("new_user_join_group", {
                    message: "New users have been added to group",
                    users: data.users
                });

                for (const user of data.users) {
                    const userOnline = this.clientConnected.find(o => o.user === user);
                    if (userOnline) {
                        this.io.to(userOnline.socket).emit("join_group", {
                            message: "You have added to group!",
                            id_group: data.id_group
                        });
                    }
                }
            });

            socket.on("join_group", async (id_group) => {
                socket.join(`${id_group}`);
            });

            socket.on("join_individual_group", async (data) => {
                socket.join(`${data.id_group}`);
            });

            socket.on("read_message_in_group", async (id_group) => {
                const user = this.clientConnected.find(u => u.socket === socket.id);

                const group = await Group.findOne({
                    id: id_group
                });

                group.members = group.members.map((m: any) => {
                    if (m.id === user?.user) {
                        return { ...m, lastMessageSeen: group.lastMessageId };
                    }
                    return m;
                });

                socket.broadcast.to(`${id_group}`).emit("user_read_message", {
                    id_group,
                    id_message: group.lastMessageId
                });
            })

            socket.on("disconnect", () => {
                console.log(`User disconnected: ${socket.id}`);
                this.clientConnected = this.clientConnected.filter(obj => obj.socket !== socket.id);
            });
        });
    }


    getIoInstance() {
        return this.io;
    }

    getClientConnected() {
        return this.clientConnected;
    }
}

