const Model = require('../../');

module.exports = class TableParamsModel extends Model {

    constructor(data, tableParams){

        const table = "table_params/$param1/$param2";

        const options = {
            schema: {
                title: {type: 'string'}
            },
            timestamps: true
        };
        
        super(table, data, options, tableParams);
    }

}