
// API url related functions
function add_params_to_url(base, params) {
    let url = base + '?';  // => /current_weather?
    
    let first_time = true;
    for (let item in params) {
        if (first_time) {
            url = url + `${item}=${params[item]}`;  // => /current_weather?location=Rotterdam
            first_time = false; 
        } else {
            url = url + `&${item}=${params[item]}`;  // => /current_weather?location=Rotterdam&kleur=groen
        };
    };
    return url;
};

async function get_weather_report(user_location) {
    
    const server_endpoint = '/current_weather';
    const query_parameter = {
        location: user_location  // input moet stad of lat,long zijn
    };
    // pieter.com/current_weather?location=Rotterdam&kleur=groen
    let request_url = add_params_to_url(server_endpoint, query_parameter);

    const server_response = await fetch(request_url);
    const response_json = await server_response.json();
    return response_json;
};

async function test_db_connection() {
    const request_options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const server_response = await fetch('/test_db', request_options);
    console.log(`document cookies: ${document.cookie}`)
};

// functions to display data
function display_time() {
    let current_time = new Date().toTimeString();
    document.getElementById('time').textContent = current_time;
};

async function display_weather_report(location) {
    let weather_report = await get_weather_report(location);
    document.getElementById('weer').textContent = JSON.stringify(weather_report, null, 2);
};
