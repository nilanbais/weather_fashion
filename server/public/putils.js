function get_time() {
    let current_time = new Date().toTimeString();
    document.getElementById('time').textContent = current_time;
}

async function get_weather_report(input_var) {
    console.log(input_var);
    const request_options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'query_parameter': JSON.stringify(input_var)
        }
    };
    const server_response = await fetch('/weather_report', request_options);
    const response_json = await server_response.json();
    console.log("server_response from putils");
    console.log(response_json);
};