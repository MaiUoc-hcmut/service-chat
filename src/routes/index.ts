const messageRouter = require('./message');
const groupRouter = require('./group');

function route(app: any) {
    app.use('/api/v1/messages', messageRouter);
    app.use('/api/v1/groups', groupRouter);
}

module.exports = route;