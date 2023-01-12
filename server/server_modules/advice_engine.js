


class AdviceEngine {

    // Private Class attributes and their initial values
    #IREQ = 0.5;
    #Hr = 3;
    #ArAdu = 0.77;
    #factor = 0.5;

    #input_data_package = undefined;

    constructor(input_data_package) {
        this.#input_data_package = input_data_package;
    };

    // get function for IREQ value
    get IREQ() {
        return this.#IREQ;
    };

    // private function to calculate the IREQ (required isolation)
    #calc_IREQ(input_data) {
        // Inhoud is regels 11-90 van "functies voor bepalen IREQ.js"
        var skin_temperature, wetness, exhaled_air_temperature, exhaled_air_pressure, 
        Psks, air_pressure, heat_balace, ratio_clothes_body, Rt, evaporation, respiratory_heat, clothes_temperature, 
        radiation_transfer_coefficient, convection_transfer_coefficient, radiation, convection, boundary_layer_thermal_insulation


        // Variabelen uit input data package toewijzen naar lokale variabelen
        let metabolism = this.#check_value(input_data.metabolism, 'btw', (51, 400));
        let walking_speed = this.#check_value(input_data.walking_speed, 'btw', ((0.0052 * (metabolism - 58)), 1.2));
        let air_temperature = this.#check_value(input_data.temperature_air, 'gte', 10);
        let wind_speed = this.#check_value(input_data.wind_speed, 'btw', (0.4, 18));
        let radiation_temperature = input_data.radiation_temperature;  // temperatuur van de zon?
        let humidity = input_data.humidity;
        let resulting_clothing_insolation = input_data.resulting_clothing_insolation  // waarom moet deze uit input_data komen ???

        resulting_clothing_insolation = resulting_clothing_insolation * 0.155;
        boundary_layer_thermal_insulation = 0.092 * Math.exp(-0.15 * wind_speed - 0.22 * walking_speed) - 0.0045;

        let calculation = 0;
        do {
            calculation = calculation + 1;

            // Calculation of sky_temperature (C) and wetness (%) 
            if (calculation === 1) {
                // For IREQminimal, DLEminimal ! 
                skin_temperature = 33.34 - (0.0354 * metabolism);
                wetness = 0.06;
            } else  {
                // For IREQneutral, DLEneutral ! 
                skin_temperature = 35.7 - (0.0285 * metabolism);
                wetness = 0.001 * metabolism;
            };

            // Calculation of exhaled_air_temperature (C) and exhaled_air_pressure, Psks , air_pressure (Pa) 
            exhaled_air_temperature = 29 + 0.2 * air_temperature;                     
            exhaled_air_pressure = 0.1333 * Math.exp(18.6686 - 4030.183 / (exhaled_air_temperature + 235));
            Psks = 0.1333 * Math.exp(18.6686 - 4030.183 / (skin_temperature + 235)); 
            air_pressure = (humidity / 100) * 0.1333 * Math.exp(18.6686 - 4030.183 / (air_temperature + 235));

            do {
                ratio_clothes_body = 1 + 1.197 * this.IREQ;        
                Rt = (0.06 / 0.38) * (boundary_layer_thermal_insulation + this.IREQ);
                evaporation = wetness * (Psks - air_pressure) / Rt;
                respiratory_heat = 1.73E-2 * metabolism * (exhaled_air_pressure - air_pressure) + 1.4E-3 * metabolism * (exhaled_air_temperature - air_temperature);      
                clothes_temperature = skin_temperature - this.IREQ * (metabolism - W - evaporation - respiratory_heat);
                radiation_transfer_coefficient = 5.67E-8 * 0.95 * this.#ArAdu * (Math.exp(4 * Math.log(273 + clothes_temperature)) - Math.exp(4 * Math.log(273 + Tr))) / (clothes_temperature - radiation_temperature);
                convection_transfer_coefficient = 1 / boundary_layer_thermal_insulation - radiation_transfer_coefficient;
                radiation = ratio_clothes_body * radiation_transfer_coefficient * (clothes_temperature - radiation_temperature);
                convection = ratio_clothes_body * convection_transfer_coefficient * (clothes_temperature - air_temperature);
                heat_balace = metabolism - W - evaporation - respiratory_heat - radiation - convection;
                if (heat_balace > 0)  {
                  this.#IREQ = this.IREQ - factor;
                  factor = factor / 2;
                }
                else {
                    this.#IREQ = this.IREQ + factor;         
                }
          
              } while (Math.abs(heat_balace) > 0.01); 
              this.#IREQ = (skin_temperature - clothes_temperature) / (radiation + convection);

        } while (calculation < 2);
    };

    #check_value(variable, operator, check_value) {
        /* Method coontaining abstract code to check a given value.
            variable - the variable you want to check.
            operator - the operation how you want to compare the variable to the check_value.
            check_value - the value to compare the variable to. NOTE: this has to be a tuple '(min, max)' when the operator 'btw' is selected.
        */
        switch(operator) {
            case 'gte': // greater than or equal '>='
                if (variable >= check_value) {
                    return check_value;
                };
                return variable;
            case 'lte': // less then or equal '<='
                if (variable <= check_value) {
                    return check_value;
                };
                return variable;
            case 'btw':  // between two values given as tuple (value1, value2)
                if (variable >= check_value[0]) {
                    return check_value[0];
                } else if (variable <= check_value[1]) {
                    return check_value[1];
                } else {
                    return variable;
                };
        };
    }
};