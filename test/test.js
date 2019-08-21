var assert = require('assert');
const BaseModel = require('~src');

describe('FirestoreModel', function() {
  describe('BaseModel', function() {
    it("should return type of 'BaseModel'", function() {
      assert.equal(BaseModel.name, "BaseModel");
    });
  });
});