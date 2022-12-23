
// custom
const APIBaseClass = require("./api/api_base_class")


class WeatherAPI extends APIBaseClass {
    // official api docs: https://www.weatherapi.com/docs/ 
    constructor() {
        super("WeatherAPI");
    };

    async get_current_weather(location) {
        let api_endpoint = '/current.json'

        this.header = {
            q: location
        };
        console.log(`header in weatherapi:`);
        console.log(this.header);
        let result = await this.get_response(api_endpoint);
        return result;
    };

};

module.exports = WeatherAPI;