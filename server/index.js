// npm
const express = require("express");
const cookieParser = require("cookie-parser");

// custom
const WeatherAPI = require("./server_modules/weather_api");
const WeatherFashionDB = require("./server_modules/weather_fashion_db");

// load env vars
require('dotenv').config();

// create and config server
const port = process.env.PORT || 3000;
const server = express();

server.use(cookieParser());
server.use(express.static('public'));
server.use(express.json({ limit: '1mb'}));

server.listen(port, () => console.log(`Listening at port ${port}`));


// eindpunt voor weersverwachting
server.get('/current_weather', async(request, response) => {
    let query_params = request.query;
    console.log(`query_params in current_weather endpoint:`);
    console.log(query_params);

    let wapi = new WeatherAPI();

    let data = await wapi.get_current_weather(query_params.location);

    response.json(data);
});

// algemene test functie voor de database
server.get('/test_db', async(request, response) => {
    let db = new WeatherFashionDB();
    db.test_db_connection().catch(console.dir);
});