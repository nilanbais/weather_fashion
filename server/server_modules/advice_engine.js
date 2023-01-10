


class AdviceEngine {

    // Private Class attributes and their initial values
    #IREQ = 0.5;
    #Hr = 3;
    #ArAdu = 0.77;
    #factor = 0.5;

    constructor(weather_report_json) {
        this.raw_weather_report = weather_report_json;
    };

    // get function for IREQ value
    get IREQ() {
        return this.#IREQ;
    };

    // private function to calculate the IREQ (required isolation)
    #calc_IREQ(weather_report_json) {
        // Inhoud is regels 11-90 van "functies voor bepalen IREQ.js"
    };
};