const firebase = require('../functions/firebase.js');
const BaseModel = require('../../');
const DummyItemModel = require('./DummyItemModel.js');

module.exports = class DummyModel extends BaseModel {

    constructor(data){
        const table = "dummy";

        const schema = {
            item: { type: firebase.firestore.DocumentReference, modelClass: DummyItemModel },
            description: { type: 'string' }
        }

        const timestamps = true;
        
        super(firebase, table, data, schema, timestamps);
    }

}