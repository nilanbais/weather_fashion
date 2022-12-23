
// cookie related functions
function getCookie(cookie_name) {
    let name = cookie_name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        };

        if (c.indexOf(name) == 0) {
            let result = c.substring(name.length, c.length);
            return result
        };
    }
    return "";
};

function setCookie(cookie_name, cookie_value, expires_days) {
    const d = new Date();
    d.setTime(d.getTime() + (expires_days * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cookie_name + "=" + cookie_value + ";" + expires + ";path=/";
};

function deleteCookie(cookie_name) {
    setCookie(cookie_name, '', -1);
};

function checkCookie(cookie_name) {
    let cookie = getCookie(cookie_name);
    if (cookie === "" || cookie == undefined) {
        return false;
    }; 
    return true
};

function check_location_weather_report_cookie(location) {
    let cookie_name = 'weather_report';
    if (checkCookie(cookie_name)) {
        let weather_report_cookie = JSON.parse(getCookie(cookie_name));
        if (weather_report_cookie.location.name === location) {
            return true;
        };
        console.log("Need weather report of a different location.")
    };
    return false;
};

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

async function get_weather_report(input_location) {

    let cookie_name = 'weather_report';
    console.log(`cookie found in cookies? : ${checkCookie(cookie_name)}`);

    if (check_location_weather_report_cookie(input_location)) {
        let cookie_object = getCookie(cookie_name);
        let weather_report = JSON.parse(cookie_object);
        console.log(`got report from cookies`);
        return weather_report;
    } else {
        const server_endpoint = '/current_weather';
        const query_parameter = {
            location: input_location  // input moet stad of lat,long zijn
        };
        // pieter.com/current_weather?location=Rotterdam&kleur=groen
        let request_url = add_params_to_url(server_endpoint, query_parameter);
    
        const server_response = await fetch(request_url);
        const response_json = await server_response.json();
    
        // setCookie({cookie_name: new String(cookie_name), cookie_value: response_json, expires_days: 1});
        setCookie(cookie_name, JSON.stringify(response_json), 1);
        console.log('weather_report set as cookie');

        return response_json; 
    };
};

async function test_db_connection() {
    const request_options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const server_response = await fetch('/test_db', request_options);
    const response_json = await server_response.json();
    return response_json
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
