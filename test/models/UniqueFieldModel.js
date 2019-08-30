const BaseModel = require('../../');
const {initDatabase} = require('../functions/firebase.js');

module.exports = class UniqueFieldModel extends BaseModel {

    constructor(data){

        const table = "unique_field";

        const schema = {
            email: {type: 'string', unique:true}
        }

        const timestamps = false;
        
        super(initDatabase(), table, data, schema, timestamps);
    }

}