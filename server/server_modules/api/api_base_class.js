
// node.js
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// custom
const base_urls = require("./api_base_url");

class APIBaseClass {
    // private attributes
    #url = undefined;   
    #method = undefined;
    #header = undefined;
    #body = undefined;

    constructor(name_implemented_api) {
        this.base_url = this.#get_base_url(name_implemented_api);
    };

    // private method voor base urls ophalen
    #get_base_url(api_name) {
        return base_urls[api_name];
    };

    // properties 
    get header() {
        if (this.#header === undefined) {
            return {};
        };
        return this.#header;
    };
    set header(value) {
        this.#header = value;
    };

    get body() {
        if (this.#body === undefined) {
            return {};
        };
        return this.#body;
        
    };
    set body(value) {
        this.#body = value;
    };

    // api call in 1 functie, te doe met alleen het eindpunt als input var
    async get_response(api_endpoint) {
        let url = this.base_url + api_endpoint;
        let new_url = this.#add_header_to_url(url);

        const response = await fetch(this.#authenticate_url(new_url));
        const response_json = await response.json();

        return response_json;
    };

    // private method voor authenticatie toevoegen aan header voor de request gedaan wordt
    #authenticate_url(url) {
        const key = process.env.API_WEATHERAPI_KEY;
        let splitted_url = url.split('?');
        let checked_url = splitted_url[0] + `?key=${key}&` + splitted_url[1];
        return checked_url;
    };

    #add_header_to_url(url) {
        let _url = url + '?';
        
        let first_time = true;
        for (let item in this.header) {
            if (first_time) {
                _url = _url + `${item}=${this.header[item]}`;
                first_time = false;
            } else {
            _url = _url + `&${item}=${this.header[item]}`;
            };

        };

        return _url;
    };

};

module.exports = APIBaseClass;