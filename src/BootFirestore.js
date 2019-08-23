const firebase = process.hasOwnProperty('firebase') ? process.firebase : require('firebase/app');
require('firebase/firestore');

if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API_KEY || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        authDomain: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`
    });
}
module.exports = firebase;