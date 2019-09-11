const Model = require('../../');

module.exports = class ChainedWhereModel extends Model {

    constructor(data){

        const table = "chained_where";
        const options = {
            schema: {
                number_field: {type: 'number'}
            },
            timestamps: false
        };
        
        super(table, data, options);
    }

}
