const BaseModel = require('../../');
const firebase = require('../functions/firebase.js');

module.exports = class DummyItemModel extends BaseModel {

    constructor(data){
        const table = "dummy_itens";

        const schema = {
            title: {type: 'string'}
        }

        const timestamps = true;
        
        super(firebase, table, data, schema, timestamps);
    }

}