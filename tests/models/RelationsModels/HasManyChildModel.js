const Model = require('../../../');

module.exports = class HasManyChildModel extends Model {

    constructor(data){
        const table = "has_many_child_model_table";
    
        const HasManyModel = require('./HasManyModel.js');
        
        const options = {
            schema: {
                title: {type: 'string'},
                parent: { type: HasManyModel},
            },
        };
        
        super(table, data, options);
    }

}