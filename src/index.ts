require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = process.env.DATABASE_CLOUD;

import { SOCKETIO } from "./socket";

const route = require('./routes');

const app = express();
app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
route(app);

const server = http.createServer(app);
const socketInstance = new SOCKETIO(server);

mongoose
    .connect(db)
    .then(() => console.log('DB connected'))
    .catch((err: any) => console.log(err));

server.listen(4005, () => {
    console.log("Server is running on port: 4005");
});

export { socketInstance }

