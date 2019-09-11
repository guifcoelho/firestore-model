// const firebase = require("@firebase/testing");
// const config = {
//     projectId: `project-testing-${Date.now()}`
// }

require('dotenv').config({path: `${process.cwd()}/.env`});
const firebase = require('firebase/app');
require('firebase/firestore');
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID,
        authDomain: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`
    });
}

module.exports.firebase = firebase;
module.exports.database = firebase.firestore();


// module.exports.initDatabase = () => {
//     const app = firebase.initializeTestApp(config);
//     return app.firestore();
// }

// module.exports.clearDatabase = () => {
//     firebase.clearFirestoreData(config);
// }

// module.exports.deleteDatabase = () => {
//     Promise.all(firebase.apps().map(app => app.delete()));
// }