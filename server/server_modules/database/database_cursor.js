
const MongoDB = require("./database_connection");


class WeatherFashionDB {
    #database = new MongoDB();

    async test_db_connection() {
        console.log("Testing connection from WeatherFashionDB class");
        this.#database.test();
    };
};

module.exports = WeatherFashionDB;