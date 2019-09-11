const Model = require('../../');

module.exports = class DateAttributeModel extends Model {

    constructor(data){

        const table = "date_attribute";

        const options = {
            schema: {
                my_date: {type: Date}
            }
        };
        
        super(table, data, options);
    }

}