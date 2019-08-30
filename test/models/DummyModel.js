const firebase = require('firebase/app');
const BaseModel = require('../../');
const DummyItemModel = require('./DummyItemModel.js');
const {initDatabase} = require('../functions/firebase.js');

module.exports = class DummyModel extends BaseModel {

    constructor(data){
        
        const table = "dummy";

        const schema = {
            item: { type: firebase.firestore.DocumentReference, modelClass: DummyItemModel },
            description: { type: 'string' }
        }

        const timestamps = true;
        
        super(initDatabase(), table, data, schema, timestamps);
    }

}