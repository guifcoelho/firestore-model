const BaseModel = require('../../');
const {initDatabase} = require('../functions/firebase.js');

module.exports = class Model extends BaseModel {

    constructor(table, data = null, options = null){
        
        super(initDatabase(), table, data, options);
    }

}

