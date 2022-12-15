const express = require("express");
const WeatherAPI = require("./server_modules/api/weather_api");

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