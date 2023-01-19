// npm
const express = require("express");
const cookieParser = require("cookie-parser");
const credentials = require("./conf");
const session = require("express-session");

// custom
const { validate_cookie_presence } = require("./server_modules/cookie_functions")
const WeatherAPI = require("./server_modules/weather_api");
const WeatherFashionDB = require("./server_modules/weather_fashion_db");

// load env vars
require('dotenv').config();

// create and config server
const port = process.env.PORT || 3000;
const server = express();

server.use(cookieParser( credentials.secret_cookie ));
server.use(express.static('public'));
server.use(express.json({ limit: '1mb'}));

server.listen(port, () => console.log(`Listening at port ${port}`));


// eindpunt voor weersverwachting
server.get('/current_weather', async(request, response) => {

    let data;
    let cookie_name = 'weather_report';
    console.log(`Cookie with name '${cookie_name}' is present in received cookies: ${validate_cookie_presence(request, cookie_name)}`);

    if (validate_cookie_presence(request, cookie_name)) {
        // retreving data from cookies
        data = request.cookies[cookie_name];
    } else {
        let query_params = request.query;

        console.log(`query_params in current_weather endpoint:`);
        console.log(query_params);

        let weather_api = new WeatherAPI();

        data = await weather_api.get_current_weather(query_params.location);
        // setting the data as cookie in the response
        // cookie needs to expire at the start of a new day or at end of the session { expires: 0} === session cookie
        response.cookie("weather_report", data, { expires: 0});  
    };
    // sending the data
    response.send(data);
});

// algemene test functies
server.get('/test_db', async(request, response) => {
    let db = new WeatherFashionDB();
    db.test_db_connection().catch(console.dir);
});

server.get('/test_form', (request, response) => {
    console.log(request.query);
    RedirectToAction('/');
});