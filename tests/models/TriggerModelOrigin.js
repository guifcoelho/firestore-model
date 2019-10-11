const Model = require('../../');

module.exports = class TriggerModelOrigin extends Model {

    constructor(data){

        const table = "trigger_model_origin";

        const TriggerModelDestination = require("./TriggerModelDestination.js");

        const options = {
            schema: {
                title: { type: 'string' }
            },
            timestamps: false,
            triggers: {
                onCreate: data => {
                    TriggerModelDestination.createNew({title: `Created item '${data.id}'`});
                },
                onUpdate: data => {
                    TriggerModelDestination.createNew({title: `Updated item '${data.new.id}'`});
                },
                onWrite: data => {
                    TriggerModelDestination.createNew({title: `Wrote item '${data.id}'`});
                },
                onDelete: data => {
                    TriggerModelDestination.createNew({title: `Deleted item '${data.id}'`});
                }
            }
        };
        
        super(table, data, options);
    }

}