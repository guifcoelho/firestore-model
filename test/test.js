require('dotenv').config({ path: `${process.cwd()}/.env` });
const fs = require('fs');
process.firebase = require('@firebase/testing');

const projectId = "my-test-project"; 
process.firebase.initializeTestApp({ projectId });
process.firebase.loadFirestoreRules({
  projectId,
  rules: fs.readFileSync(`${process.cwd()}/test/firestore.rules`, "utf8")
});


var assert = require('assert');
const BaseModel = require('~src');

describe('FirestoreModel', function() {
  describe('BaseModel', function() {
    it("should return type of 'BaseModel'", function() {
      assert.equal(BaseModel.name, "BaseModel");
    });
  });
});

process.firebase.clearFirestoreData({ projectId });
Promise.all(process.firebase.apps().map(app => app.delete()))