const kcal_per_activity_table = require("./server_resources/kcal_per_activity_json");


class AdviceEngine {

    // Private Class attributes and their initial values
    #IREQ = 0.5;
    #radiation_transfer_coefficient = 3;
    #ArAdu = 0.77;
    #clothing_emissivity = 0.95 * this.#ArAdu;  // Constant for the emissivity of the clothing, formula is extracted from calculation to make it more understandable
    #factor = 0.5;

    #input_data_package = undefined;

    constructor(input_data_package) {
        this.#input_data_package = input_data_package;
    };

    // get function for IREQ value
    get IREQ() {
        return this.#IREQ;
    };
    
    get sex() {
        return this.#check_value(this.#input_data_package.sex, 'eq', undefined, 'm')
    };

    get length() {
        switch(this.sex.toLowerCase()) {
            case 'm':
                return this.#check_value(this.#input_data_package.length, 'eq', undefined, 175);
            case 'v':
                return this.#check_value(this.#input_data_package.length, 'eq', undefined, 170);
        };
    };

    get weight() {
        switch(this.sex.toLowerCase()) {
            case 'm':
                return this.#check_value(this.#input_data_package.weight, 'eq', undefined, 70);
            case 'v':
                return this.#check_value(this.#input_data_package.weight, 'eq', undefined, 60);
        };
    };

    get age() {
        return this.#check_value(this.#input_data_package.age, 'eq', undefined, 30);
    };

    #calc_basal_metabolism(length, weight, age, sex) {
        /* Calculates the amout of kcal/hour at rest for men and women
            length in cm
            weight in kg
            sex has default value 'm'
        */
        let cal_day;
        switch(sex.toLowerCase()) {
            case 'm':
                cal_day = 88.362 + (13.397 * weight) + (4.799 * length) - (5.677 * age);
            case 'v':
                cal_day = 447.593 + (9.247 * weight) + (3.098 * length) - (4.330 * age);
       };
       kcal_hour = (cal_day * Map.pow(10, -3)) / 24; // calories_per_day * 10^-3 to traform to kcalories_per_day
       return kcal_hour;
    };

    #calc_metabolism(kcal_hour, length, weight) {
        /* Calculates the metabolism based on the given kcal per hour.
            metabolism = (1.163 * kcal_hour) / body_surface_dubois
        */
        let metabolism = (1.163 * kcal_hour) / Math.root((length * weight) / 3600);
        return metabolism;
    };

    get_metabolism(activity) {
        /* Calculates the metabolism based on the given activity.
            The basal metabolism is calculated using data from #input_data_package.
                0 - "Rusten"
                1 - "Wandelen 5 km/h"
                2 - "Hardlopen 11 km/h"
                3 - "Fietsen 16 km/h"
                4 - "Fietsen 19 km/h"
        */
        switch(activity) {
            case 0:
                return this.#calc_basal_metabolism(this.length, this.weight, this.age, this.sex);
            case 1:
                activity_string = "Wandelen 5 km/h";
            case 2:
                activity_string = "Hardlopen 11 km/h";
            case 3:
                activity_string = "Fietsen 16 km/h";
            case 4:
                activity_string = "Fietsen 19 km/h";
        };
        let kcal_hour = kcal_per_activity_table[activity_string];
        return this.#calc_metabolism(kcal_hour, this.length, this.weight);  // only hit when activity in not equal to resting or 0
    };

    get_walking_speed(activity) {
        // walking speed blijft ergens nog een rare parameter in de helee bekerening
        switch(activity) {
            case 0:
                return 0;
            case 1:
                return 5;
            case 2:
                return 11;
            case 3:
                return 16;
            case 4:
                return 19;
        };
    };

    test_calc_IREQ() {
        // test function that builds the input package and executes the calc_IREQ method.
        let metabolism = this.get_metabolism(this.#input_data_package.activity);
        let walking_speed = this.get_walking_speed(this.#input_data_package.activity);
        let air_temperature = this.#input_data_package.air_temperature;
        let wind_speed = this.#input_data_package.wind_speed;
        let radiation_temperature = this.#input_data_package.radiation_temperature;
        let humidity = this.#input_data_package.humidity;

        return this.#calc_IREQ(metabolism, walking_speed, air_temperature, wind_speed, radiation_temperature, humidity);
    };

    // private function to calculate the IREQ (required isolation)
    #calc_IREQ(metabolism, walking_speed, temperature_air, wind_speed, radiation_temperature, humidity, effective_mechanical_power = 0) {
        // Inhoud is regels 11-90 van "functies voor bepalen IREQ.js"
        var skin_temperature, wetness, exhaled_air_temperature, exhaled_air_pressure,
        water_vapour_pressure_skin_surface, air_pressure, heat_balace, ratio_clothes_body, Rt, evaporation, respiratory_heat, 
        clothes_temperature, convection_transfer_coefficient, radiation, convection, boundary_layer_thermal_insulation

        // Variabelen uit input data package toewijzen naar lokale variabelen
        metabolism = this.#check_value(metabolism, 'btw', (51, 400));
        walking_speed = this.#check_value(walking_speed, 'btw', ((0.0052 * (metabolism - 58)), 1.2));
        air_temperature = this.#check_value(temperature_air, 'gte', 10);
        wind_speed = this.#check_value(wind_speed, 'btw', (0.4, 18));

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

            // Calculation of exhaled_air_temperature (C) and exhaled_air_pressure, water_vapour_pressure_skin_surface , air_pressure (Pa) 
            exhaled_air_temperature = 29 + 0.2 * air_temperature;                     
            exhaled_air_pressure = 0.1333 * Math.exp(18.6686 - 4030.183 / (exhaled_air_temperature + 235));
            water_vapour_pressure_skin_surface = 0.1333 * Math.exp(18.6686 - 4030.183 / (skin_temperature + 235)); 
            air_pressure = (humidity / 100) * 0.1333 * Math.exp(18.6686 - 4030.183 / (air_temperature + 235));

            do {
                ratio_clothes_body = 1 + 1.197 * this.IREQ;        
                Rt = (0.06 / 0.38) * (boundary_layer_thermal_insulation + this.IREQ);
                evaporation = wetness * (water_vapour_pressure_skin_surface - air_pressure) / Rt;
                respiratory_heat = 1.73E-2 * metabolism * (exhaled_air_pressure - air_pressure) + 1.4E-3 * metabolism * (exhaled_air_temperature - air_temperature);      
                clothes_temperature = skin_temperature - this.IREQ * (metabolism - effective_mechanical_power - evaporation - respiratory_heat);
                this.#radiation_transfer_coefficient = 5.67E-8 * this.#clothing_emissivity * (Math.exp(4 * Math.log(273 + clothes_temperature)) - Math.exp(4 * Math.log(273 + Tr))) / (clothes_temperature - radiation_temperature);
                convection_transfer_coefficient = 1 / boundary_layer_thermal_insulation - this.#radiation_transfer_coefficient;
                radiation = ratio_clothes_body * this.#radiation_transfer_coefficient * (clothes_temperature - radiation_temperature);
                convection = ratio_clothes_body * convection_transfer_coefficient * (clothes_temperature - air_temperature);
                heat_balace = metabolism - effective_mechanical_power - evaporation - respiratory_heat - radiation - convection;
                if (heat_balace > 0)  {
                  this.#IREQ = this.IREQ - this.#factor;
                  this.#factor = this.#factor / 2;
                }
                else {
                    this.#IREQ = this.IREQ + this.#factor;         
                }
          
              } while (Math.abs(heat_balace) > 0.01); 
              this.#IREQ = (skin_temperature - clothes_temperature) / (radiation + convection);

        } while (calculation < 2);
    };

    #check_value(variable, operator, check_value, new_value) {
        /* Method coontaining abstract code to check a given value.
            variable - the variable you want to check.
            operator - the operation how you want to compare the variable to the check_value.
            check_value - the value to compare the variable to. NOTE: this has to be a tuple '(min, max)' when the operator 'btw' is selected.
            new_value - the value to replace the variable with when it is equal to the check value.
        */
        switch(operator) {
            case 'gte': // greater than or equal '>='
                if (variable >= check_value) {
                    return check_value;
                };
            case 'lte': // less then or equal '<='
                if (variable <= check_value) {
                    return check_value;
                };
            case 'btw':  // between two values given as tuple (value1, value2)
                if (variable >= check_value[0]) {
                    return check_value[0];
                } else if (variable <= check_value[1]) {
                    return check_value[1];
                };
            case 'equ':  // equals the check value. specify
                if (variable === check_value) {
                    return new_value;
                };
        };
        return variable;  // is only executes when the if-statement in the switch case isn't hit
    };
};

module.exports = AdviceEngine;