const firebase = require("@firebase/testing");
const config = {
    projectId: `project-testing-${Date.now()}`
}

module.exports.initDatabase = () => {
    const app = firebase.initializeTestApp(config);
    return app.firestore();
}

module.exports.clearDatabase = () => {
    firebase.clearFirestoreData(config);
}

module.exports.deleteDatabase = () => {
    Promise.all(firebase.apps().map(app => app.delete()));
}