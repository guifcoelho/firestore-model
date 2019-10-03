const Model = require('../../');

module.exports = class DefaultAttributeModel extends Model {

    constructor(data){

        const table = "default_attribute";

        const options = {
            schema: {
                title: {type: 'string'},
                attDefault: {type: 'string', default: 'abc'}
            },
            timestamps: true
        };
        
        super(table, data, options);
    }

}