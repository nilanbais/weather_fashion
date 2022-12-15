function get_time() {
    let current_time = new Date().toTimeString();
    document.getElementById('time').textContent = current_time;
}