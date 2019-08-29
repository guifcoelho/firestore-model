const BaseModel = require('../../');
const firebase = require('../functions/firebase.js');

module.exports = class UniqueFieldModel extends BaseModel {

    constructor(data){
        const table = "unique_field";

        const schema = {
            email: {type: 'string', unique:true}
        }

        const timestamps = false;
        
        super(firebase, table, data, schema, timestamps);
    }

}