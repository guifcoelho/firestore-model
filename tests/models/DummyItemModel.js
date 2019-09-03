const Model = require('./Model.js');

module.exports = class DummyItemModel extends Model {

    constructor(data){

        const table = "dummy_itens";

        const options = {
            schema: {
                title: {type: 'string'}
            },
            timestamps: true
        };
        
        super(table, data, options);
    }

}