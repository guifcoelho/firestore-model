const Model = require('./Model.js');
const DummyItemModel = require('./DummyItemModel.js');

module.exports = class DummyModel extends Model {

    constructor(data){
        
        const table = "dummy";

        const options = {
            schema: {
                item: { type: DummyItemModel },
                description: { type: 'string' }
            },
            timestamps: true
        };
        
        super(table, data, options);
    }

}