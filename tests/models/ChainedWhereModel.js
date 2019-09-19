const Model = require('../../');

module.exports = class ChainedWhereModel extends Model {

    constructor(data){

        const table = "chained_where";
        const DummyItemModel = require('./DummyItemModel.js');
        const options = {
            schema: {
                number_field: {type: 'number'},
                otherModel1: {type: DummyItemModel, nullable: true},
                otherModel2: {type: DummyItemModel, nullable: true}
            },
            timestamps: false
        };
        
        super(table, data, options);
    }

}
