// npm
const express = require("express");
const cookieParser = require("cookie-parser");
const credentials = require("./conf");

// custom
const { validate_cookie_presence, check_cookie_value } = require("./server_modules/cookie_functions")
const WeatherAPI = require("./server_modules/weather_api");
const WeatherFashionDB = require("./server_modules/weather_fashion_db");
const AdviceEngine = require("./server_modules/advice_engine")

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
    let location_cookie_name = cookie_name + "_location";

    let query_params = request.query;

    console.log(`Cookie with name '${cookie_name}' is present in received cookies: ${validate_cookie_presence(request, cookie_name)}`);

    // validate if a weather report is present in the cookies and check if the location is still the same as the last request
    if (validate_cookie_presence(request, cookie_name) && check_cookie_value(request, location_cookie_name, query_params.location)) {
        // retreving data from cookies
        data = request.cookies[cookie_name];
    } else {
        console.log(`query_params in current_weather endpoint:`);
        console.log(query_params);

        let weather_api = new WeatherAPI();

        data = await weather_api.get_current_weather(query_params.location);

        // setting the data as cookie in the response
        // cookie needs to expire at the start of a new day or at end of the session { expires: 0 } === session cookie
        response.cookie(cookie_name, data, { expires: 0 });
        response.cookie(location_cookie_name, query_params.location, { expires: 0 })
    };
    // sending the data
    response.send(data);
});

// eindpunt voor het verkrijgen van een ireq waarde
server.get('/calc_ireq',(request, response) => {
    let query_params = request.query;
    console.log(query_params);
    let advice_engine = new AdviceEngine(query_params);
    let ireq_values = advice_engine.calculate_IREQ();
    console.log("calculated ireq value:");
    console.log(ireq_values);
    const payload = {
        IREQ_min: ireq_values[0],
        IREQ_neutral: ireq_values[1]
    }
    response.send(payload);
});

// eindpunt voor instellen van de persoonsdata (lengte, gewicht, etc.)
server.post('/set_ireq_input_parameters', (request, response) => {
    let input; 
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