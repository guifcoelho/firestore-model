var assert = require('assert');
const DummyItemModel = require('./models/DummyItemModel.js');
const DummyModel = require('./models/DummyModel.js');
const firebase = require('./functions/firebase.js');

describe('Create model', () => {

    it("should write to database and return valid models", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });
        const dummy = await DummyModel.createNew({
            item: dummy_item,
            description: `Dummy description: ${(new Date()).toString()}`
        });

        assert.equal(dummy instanceof DummyModel, true);
        assert.equal(dummy.data.item.query instanceof firebase.firestore.DocumentReference, true);
        
        const item = await dummy.data.item.first();
        assert.equal(item instanceof DummyItemModel, true);
        assert.equal(item.data.id, dummy_item.data.id);
    });

});

describe('Update model', ()=>{

    it('should update existing model', async ()=>{

        const title = `Dummy item title: ${(new Date()).toString()}`;
        const dummy_item = await DummyItemModel.createNew({
            title
        });
        const update = await dummy_item.update({
            title: 'Novo dummy item title'
        });
        assert.equal(update, true);
        assert.notEqual(dummy_item.data.title, title);

        const query = DummyItemModel.find(dummy_item.data.id);
        const updated_dummy_item = await query.first();
        assert.equal(updated_dummy_item.data.title, dummy_item.data.title);

    })

});

describe('Delete model', () => {

    it("should delete a model", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });

        const item_delete = await dummy_item.delete();
        assert.equal(item_delete, true);

        const query = DummyItemModel.find(dummy_item.data.id);
        const model = await query.first();
        assert.equal(model, null);
    });

});