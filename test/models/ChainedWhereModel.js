const BaseModel = require('../../');
const firebase = require('../functions/firebase.js');

module.exports = class ChainedWhereModel extends BaseModel {

    constructor(data){
        const table = "chained_where";

        const schema = {
            number_field: {type: 'number'}
        }

        const timestamps = false;
        
        super(firebase, table, data, schema, timestamps);
    }

}