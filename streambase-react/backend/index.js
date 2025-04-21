const jsonServer = require('json-server');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('streambase-db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3000;

server.use(cors());
server.use(middlewares);
server.use(router);

server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`);
});
