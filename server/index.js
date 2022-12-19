const express = require("express");

// custom
const WeatherAPI = require("./server_modules/weather_api");
const MongoDBConnection = require("./server_modules/database/database_connection");
const WeatherFashionDB = require("./server_modules/database/database_cursor");

// load env vars
require('dotenv').config();
console.log(process.env);


const server = express();
server.listen(3000, () => console.log("Listening at port 3000"));
server.use(express.static('public'));
server.use(express.json({ limit: '1mb'}));


// eindpunt voor weersverwachting
server.get('/current_weather', async(request, response) => {
    let location = JSON.stringify(request.get('location'));

    let wapi = new WeatherAPI();

    let data = await wapi.get_current_weather(location);

    console.log(`sending data = ${JSON.stringify(data)}`);
    response.json(data);
});

server.get('/test_db', async(request, response) => {
    let db = new WeatherFashionDB();
    db.test_db_connection().catch(console.dir);
});