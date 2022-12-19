
const {MongoClient, ServerApiVersion} = require("mongodb");

class MongoDBConnection {

    #base_uri = 'mongodb+srv://<USER>:<PASSWORD>@wf1.0km9jml.mongodb.net/?retryWrites=true&w=majority;'
    #client = undefined;
    #database = undefined;
    #collection = undefined;

    #init_db_client() {
        let USER = process.env.DB_ADMIN_NAME;
        let PASSWORD = process.env.DB_ADMIN_PASSWORD;
        let db_uri = this.#base_uri.replace('<USER>', USER).replace('<PASSWORD>', PASSWORD);
        this.#client = new MongoClient(db_uri, { serverApi: ServerApiVersion.v1 });
        if (this.#client !== undefined) {
            console.log("client defined and set");
        } else {
            console.log("no connection");
        }; 
    };

    async test() {
        this.#init_db_client();
        try{
            await this.#client.connect();
            await this.#client.db("admin").command({ ping: 1 });
            console.log("Connected successfully to server");
        } finally {
            // Ensures that the client will close when you finish/error
            await this.#client.close();
            console.log("done")
        }
    };
};

module.exports = MongoDBConnection;