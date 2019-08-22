require('dotenv').config({ path: `${process.cwd()}/.env` });
var assert = require('assert');
const BaseModel = require('../src/BaseModel.js');

describe('FirestoreModel', function() {
  describe('BaseModel', function() {
    it("should return type of 'BaseModel'", function() {
      assert.equal(BaseModel.name, "BaseModel");
    });
  });
});