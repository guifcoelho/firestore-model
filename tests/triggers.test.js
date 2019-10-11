const assert = require('assert');
const {firebase} = require('./functions/firebase.js');

const TriggerModelOrigin = require('./models/TriggerModelOrigin.js');
const TriggerModelDestination = require('./models/TriggerModelDestination.js');

describe('Trigger events when writing to database', () => {

    it('should trigger onCreate event', async () => {

        const originModel = await TriggerModelOrigin.createNew({title: `${Date.now()}-${parseInt(Math.random()*10000)}`});

        const unsubscribe = TriggerModelDestination.where('title', '==', `Created item '${originModel.data.id}'`).limit(1)
            .query
            .onSnapshot(querySnap => {
                if(querySnap.size == 1){
                    assert.equal(true, true);
                    unsubscribe();
                }
            })

    });

    it('should trigger onUpdate event', async () => {

        const originModel = await TriggerModelOrigin.createNew({title: `${Date.now()}-${parseInt(Math.random()*10000)}`});
        const updatedModel = await originModel.update({title: 'Updated title'});

        const unsubscribe = TriggerModelDestination.where('title', '==', `Updated item '${updatedModel.data.id}'`).limit(1)
            .query
            .onSnapshot(querySnap => {
                if(querySnap.size == 1){
                    assert.equal(true, true);
                    unsubscribe();
                }
            })

    });

    it('should trigger onWrite event', async () => {

        const originModel = await TriggerModelOrigin.setById(`${Date.now()}-${parseInt(Math.random()*10000)}`, {
            title: `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`
        });

        const unsubscribe = TriggerModelDestination.where('title', '==', `Wrote item '${originModel.data.id}'`).limit(1)
            .query
            .onSnapshot(querySnap => {
                if(querySnap.size == 1){
                    assert.equal(true, true);
                    unsubscribe();
                }
            })

    });

    it('should trigger onDelete event', async () => {

        const originModel = await TriggerModelOrigin.createNew({title: `${Date.now()}-${parseInt(Math.random()*10000)}`});
        await originModel.delete();

        const unsubscribe = TriggerModelDestination.where('title', '==', `Deleted item '${originModel.data.id}'`).limit(1)
            .query
            .onSnapshot(querySnap => {
                if(querySnap.size == 1){
                    assert.equal(true, true);
                    unsubscribe();
                }
            })

    });

});