
function check_value(variable, operator, check_value, new_value = undefined) {
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
            return variable;
        case 'lte': // less then or equal '<='
            if (variable <= check_value) {
                return check_value;
            };
            return variable;
        case 'btw':  // between two values given as tuple (value1, value2)
            if (variable <= check_value[0]) {
                return check_value[0];
            } else if (variable >= check_value[1]) {
                return check_value[1];
            };
        case 'eq':  // equals the check value. specify
            if (variable === check_value) {
                return new_value;
            };
            return variable;
    };
};

module.exports = check_value;