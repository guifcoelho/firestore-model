const Model = require('../../');

module.exports = class DefaultAttrFunctionModel extends Model {

    constructor(data){

        const table = "default_attribute";

        const options = {
            schema: {
                title: {type: 'string'},
                attDefault: {type: 'string', default: () => 'Other title'}
            },
            timestamps: true
        };
        
        super(table, data, options);
    }

}