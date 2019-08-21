const firebase = process.hasOwnProperty('firebase') ? process.firebase : require('firebase/app');
require('firebase/firestore');

if (!firebase.apps.length && firebase.constructor.name !== "Object") {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || ''
    });
}
module.exports = {
    firebase,
    firestore: firebase.constructor.name !== "Object" ? firebase.firestore() : firebase.firestore
};