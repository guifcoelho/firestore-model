const firebase = require('firebase/app');
const config = require('../config');
if (!firebase.apps.length) {
    firebase.initializeApp(config);
}
module.exports = firebase;