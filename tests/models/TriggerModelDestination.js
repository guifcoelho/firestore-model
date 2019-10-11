const Model = require('../../');

module.exports = class TriggerModelDestination extends Model {

    constructor(data){

        const table = "trigger_model_destination";

        const options = {
            schema: {
                title: { type: 'string' }
            },
            timestamps: false
        };
        
        super(table, data, options);
    }

}