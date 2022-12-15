const express = require("express");

const server = express();
server.listen(3000, () => console.log("Listening at port 3000"));
server.use(express.static('public'));
server.use(express.json({ limit: '1mb'}));
