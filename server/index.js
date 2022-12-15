const express = require("express");

const server = express();
server.listen(3000, () => console.log("Listening at port 3000"));
server.use(express.static('public'));
server.use(express.json({ limit: '1mb'}));


// eindpunt voor weersverwachting
server.get('/weather_report', (request, response) => {
    console.log(request)  // test om te kijken wat er gebeurt in de handshake
    let data = 'Dit is een weerbericht';
    response.json(data);
});