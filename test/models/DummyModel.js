const BaseModel = require('../../');
const firebase = require('../firebase.js');

module.exports = class DummyModel extends BaseModel {

    constructor(data){
        const table = "projects";

        const schema = {
            name: { type: 'string' },
            description: { type: 'string' }
        }

        const timestamps = true;
        
        super(firebase, table, data, schema, timestamps);
    }

}