/*
File containing all the functions used to work with cookies.

Functions needs the use of a cookieParser to unlock the request_object.cookies call.
*/


function validate_cookie_presence(request_object, cookie_name) {
    if (cookie_name in request_object.cookies) {
        return true;
    };
    return false;
};

// function check_cookie_value(request_object, cookie_name, cookie_value) {
//     if (validate_cookie_presence(request_object, cookie_name)) {
//         if (request_object.cookie_name === cookie_value) {
//             return true;
//         };
//     };
//     return false;
// };

function check_cookie_value(request_object, cookie_name, cookie_value) {
    if ( request_object.cookies[cookie_name] === cookie_value ) {
        return true;
    };
    return false;
};

module.exports = { validate_cookie_presence, check_cookie_value }; 