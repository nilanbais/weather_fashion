function get_time() {
    let current_time = new Date().toTimeString();
    document.getElementById('time').textContent = current_time;
}

async function get_weather_report(input_var) {
    // input moet stad of lat,long zijn
    const request_options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'location': input_var
        }
    };
    const server_response = await fetch('/current_weather', request_options);
    const response_json = await server_response.json();
    return response_json
};

async function display_weather_report() {
    let weather_report = await get_weather_report("Rotterdam");
    document.getElementById('weer').textContent = JSON.stringify(weather_report, null, 2);
};