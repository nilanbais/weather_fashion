
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

// Functie voor het berekenen van de ireq waarde
async function get_ireq_value(location, height, weight, age, sex) {
    let weather_report = await get_weather_report(location);

    const server_endpoint = '/calc_ireq';
    const query_parameters = {
        height: height,
        weight: weight,
        age: age,
        sex: sex,
        activity: 0,  // resting
        air_temperature: weather_report.current.temp_c,
        wind_speed: weather_report.current.wind_kph,
        humidity: weather_report.current.humidity,
        radiation_temperature: weather_report.current.temp_c
    };
    let request_url = add_params_to_url(server_endpoint, query_parameters);
    
    const server_response = await fetch(request_url);
    const response_json = await server_response.json();
    return response_json;
};

// function to extract the user input data used in calculating the IREQ value
async function test_set_user_input(form_object) {
    const payload = new FormData(form_object);
    console.log(payload);
    const server_endpoint = '/set_ireq_input_parameters';
    const query_parameter = {
        input_parameters: payload  // input moet stad of lat,long zijn
    };
    let request_url = add_params_to_url(server_endpoint);
    const server_response = await fetch(request_url, {
        method: "POST",
        body: payload
    });
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
    console.log(`document cookies: ${document.cookie}`);
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

async function test_display_weather_report(location) {
    let weather_report = await get_weather_report(location);
    let data_package = {
        temp: weather_report.current.temp_c,
        wind_speed: weather_report.current.wind_kph,
        humidity: weather_report.current.humidity,
        radiation_temp: weather_report.current.temp_c
    };
    console.log(data_package);
    document.getElementById('test_weer').textContent = JSON.stringify(data_package, null, 2);
};


async function test_display_ireq_values(location) {
    let default_ireq_male = get_ireq_value(location, 175, 70, 30, 'm');
    let default_ireq_female = get_ireq_value(location, 170, 60, 30, 'v');

    document.getElementById("ireq_m").textContent = default_ireq_male;
    document.getElementById("ireq_v").textContent = default_ireq_female;
}