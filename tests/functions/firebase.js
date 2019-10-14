require('dotenv').config({path: `${process.cwd()}/.env`});
const firestoreSdk = process.env.FIRESTORE_SDK != '' ? process.env.FIRESTORE_SDK : 'default';

let firebase, firestoreNamespaces;
switch(firestoreSdk){
    case 'default': [firebase, firestoreNamespaces, projectId] = initDefault(); break;
    case 'local': [firebase, firestoreNamespaces, projectId] = initLocal(); break;
    default: [firebase, firestoreNamespaces, projectId] = initDefault(); break;
}

process.firebase = firebase;
process.firestoreNamespaces = firestoreNamespaces;
module.exports = {firestoreSdk, firebase, firestoreNamespaces, projectId};


//-----------------------
// Init functions
//-----------------------

/**
 * Initializes Firebase with the default setup
 */
function initDefault(){
    console.log("Initializing tests with default Firebase");
    const firebase = require('firebase/app');
    require('firebase/firestore');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: process.env.FIREBASE_API_KEY,
            projectId,
            authDomain: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`
        });
    }
    const firestoreNamespaces = firebase.firestore;
    return [firebase, firestoreNamespaces, projectId];
}

/**
 * Initializes Firebase with the local setup
 */
function initLocal(){
    console.log("Initializing tests with firebase/testing");
    const localFirebase = require('@firebase/testing');
    const projectId = `firestore-model-test-${parseInt(Math.random()*10000)}`;
    if (!localFirebase.apps().length){
        localFirebase.initializeTestApp({ projectId });
    }
    const firebase = localFirebase.apps().find(app => app.options_.projectId == projectId);
    const firestoreNamespaces = localFirebase.firestore;
    return [firebase, firestoreNamespaces, projectId];
}