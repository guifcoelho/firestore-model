const Model = require('../../../');
module.exports = class HasOneModel extends Model {

    constructor(data){

        const table = "has_one_model_table";

        const options = {
            schema: {
                title: {type: 'string'}
            }
        };
        
        super(table, data, options);
    }

    item(){
        const HasOneChildModel = require('./HasOneChildModel.js');
        return this.hasOne(HasOneChildModel, 'parent');
    }

}