const BaseModel = require('../../');
const {initDatabase} = require('../functions/firebase.js');

module.exports = class ChainedWhereModel extends BaseModel {

    constructor(data){

        const table = "chained_where";

        const schema = {
            number_field: {type: 'number'}
        }

        const timestamps = false;
        
        super(initDatabase(), table, data, schema, timestamps);
    }

}