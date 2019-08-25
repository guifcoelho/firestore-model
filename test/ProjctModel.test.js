require('dotenv').config({ path: `${process.cwd()}/.env` });
var assert = require('assert');
const DummyModel = require('./models/DummyModel.js');

describe('DummyModel', function() {
    it("should instanciate the model", function() {
        let dummy = new DummyModel({
            name: "DummyModel 1",
            description: "Description of DummyModel 1"
        });
        // assert.equal(dummy.data.name, "DummyModel 1");
        // assert.equal(dummy.data.description, "Description of DummyModel 1");
    });

    // it("should not instanciate the model", function() {
    //     let dummy = new DummyModel({
    //         name: "DummyModel 1",
    //         // description: "Description of DummyModel 1"
    //     });
    // });
  });