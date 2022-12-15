
// custom
const APIBaseClass = require("./api/api_base_class")


class WeatherAPI extends APIBaseClass {

    constructor() {
        super("WeatherAPI");
        this.name = "WeatherAPI"
    };

    async get_current_weather(location) {
        let api_endpoint = '/current.json'

        this.header = {
            q: location
        };

        let result = await this.get_response(api_endpoint);
        return result;
    };

};

module.exports = WeatherAPI;