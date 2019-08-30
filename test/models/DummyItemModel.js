const BaseModel = require('../../');
const {initDatabase} = require('../functions/firebase.js');

module.exports = class DummyItemModel extends BaseModel {

    constructor(data){

        const table = "dummy_itens";

        const schema = {
            title: {type: 'string'}
        }

        const timestamps = true;
        
        super(initDatabase(), table, data, schema, timestamps);
    }

}