const Model = require('../../../');

module.exports = class HasOneChildModel extends Model {

    constructor(data){
        const table = "has_one_child_model_table";
        
        const HasOneModel = require('./HasOneModel.js');
        
        const options = {
            schema: {
                title: {type: 'string'},
                parent: { type: HasOneModel}
            },
        };
        
        super(table, data, options);
    }

}