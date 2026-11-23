
const MongoDBConnection = require("./database/database_connection");


class WeatherFashionDB {
    #database = new MongoDBConnection();

    async test_db_connection() {
        console.log("Testing connection from WeatherFashionDB class");
        this.#database.test();
    };
};

module.exports = WeatherFashionDB;