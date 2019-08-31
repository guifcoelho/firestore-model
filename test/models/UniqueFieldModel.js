const Model = require('./Model.js');

module.exports = class UniqueFieldModel extends Model {

    constructor(data){

        const table = "unique_field";

        const options = {
            schema: {
                email: {type: 'string', unique: true}
            },
            timestamps: false
        };
        
        super(table, data, options);
    }

}