const Model = require('../../');

module.exports = class UniqueFieldModel extends Model {

    constructor(data){

        const table = "unique_field";

        const options = {
            schema: {
                email: {type: 'string', unique: true},
                other: {type: 'string', nullable: true}
            },
            timestamps: false
        };
        
        super(table, data, options);
    }

}