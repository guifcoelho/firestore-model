const Model = require('../../');

module.exports = class ObjectAttributeModel extends Model {

    constructor(data){

        const table = "object_attr_model";

        const options = {
            schema: {
                objectAttr: { type: Object },
            }
        };
        
        super(table, data, options);
    }

}