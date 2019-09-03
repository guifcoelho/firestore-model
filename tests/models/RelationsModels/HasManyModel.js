const Model = require('../Model.js');
module.exports = class HasManyModel extends Model {

    constructor(data){

        const table = "has_many_model_table";

        const options = {
            schema: {
                title: {type: 'string'}
            }
        };
        
        super(table, data, options);
    }

    itens(){
        const HasManyChildModel = require('./HasManyChildModel.js');
        return this.hasMany(HasManyChildModel, 'parent');
    }

}