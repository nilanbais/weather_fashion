
const {MongoClient, ServerApiVersion} = require("mongodb");

class MongoDB {

    #base_uri = 'mongodb+srv://<USER>:<PASSWORD>@wf1.0km9jml.mongodb.net/?retryWrites=true&w=majority;'
    #client = undefined;
    #database = process.env.DEFAULT_DB;
    #collection = process.env.DEFAULT_COLLECTION;

    #init_db_client() {
        let USER = process.env.DB_ADMIN_NAME;
        let PASSWORD = process.env.DB_ADMIN_PASSWORD;
        let db_uri = this.#base_uri.replace('<USER>', USER).replace('<PASSWORD>', PASSWORD);
        
        this.#client = new MongoClient(db_uri, { serverApi: ServerApiVersion.v1 });
        if (this.#client !== undefined) {
            this.#database = this.#client.db(this.#database);
            this.#collection = this.#database.collection(this.#collection);
        } else {
            console.log("no connection");
        };
    };

    async test() {
        this.#init_db_client();
        try{
            await this.#client.connect();
            await this.#client.db("wfdb").command({ ping: 1 });
            console.log("Connected successfully to server");

            console.log(`database = ${this.#database.databaseName}`)
            console.log(`collection = ${this.#collection.collectionName}`)

        } finally {
            // Ensures that the client will close when you finish/error
            await this.#client.close();
            console.log("done")
        };
    };
};

module.exports = MongoDB;