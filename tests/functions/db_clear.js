require('dotenv').config({ path: `${process.cwd()}/.env` });
const { exec } = require('child_process');
exec(`firebase firestore:delete --all-collections --project ${process.env.FIREBASE_PROJECT_ID} -y`, (err, stdout, stderr) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log("Clearing database...");
    console.log(stdout);
  });