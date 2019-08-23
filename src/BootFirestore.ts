declare var process : { 
    firebase,
    env: { [key: string]: string; }
}

const firebase = process.hasOwnProperty('firebase') ? process.firebase : require('firebase/app');
import 'firebase/firestore';

if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: process.env.FIREBASE_API_KEY || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        authDomain: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`
    });
}
export { firebase };
export const firestore = firebase.firestore();