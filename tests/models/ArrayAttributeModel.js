const Model = require('../../');

module.exports = class ArrayAttributeModel extends Model {

    constructor(data){

        const table = "array_attribute";
        
        const DummyItemModel = require('./DummyItemModel.js');
        
        const options = {
            schema: {
                models: {type: Array, arrayOf: DummyItemModel, nullable: true},
                dates: {type: Array, arrayOf: Date, nullable: true},
                strings: {type: Array, arrayOf: 'string', nullable: true},
                numbers: {type: Array, arrayOf: 'number', nullable: true},
            }
        };
        
        super(table, data, options);
    }

}