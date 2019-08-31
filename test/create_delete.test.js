const {initDatabase, clearDatabase, deleteDatabase} = require('./functions/firebase.js');
before(async () => {
    await initDatabase();
});

beforeEach(async () => {
    await clearDatabase();
});

after(async () => {
    await deleteDatabase();
});


var assert = require('assert');
const firebase = require('firebase/app');
const DummyItemModel = require('./models/DummyItemModel.js');
const DummyModel = require('./models/DummyModel.js');
const UniqueFieldModel = require('./models/UniqueFieldModel.js');


describe('Create/update model', () => {

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

    });

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

describe('Create/update with unique fields', () => {

    it('should not create with unique fields', async () => {
        const query_all = UniqueFieldModel.whereAll();
        const query_delete = await query_all.delete();
        assert.equal(query_delete, true);

        await UniqueFieldModel.createNew({email: 'email@email.com'});
        
        try{
            await UniqueFieldModel.createNew({email: 'email@email.com'});
            assert.equal(true, false);
        }catch(e){
            assert.equal(e instanceof Error, true);
            assert.equal(
                e.message,
                "BaseModel::checkUniqueFields(...) | Breaking unique constraints with 'email:email@email.com' in table 'unique_field'"
            );
        }
        
    });

    it('should not update with unique fields', async () => {
        const query_all = UniqueFieldModel.whereAll();
        const query_delete = await query_all.delete();
        assert.equal(query_delete, true);
        
        const models = await Promise.all(
            [
                {email: `email_${Date.now()}_1@email.com`},
                {email: `email_${Date.now()}_2@email.com`}
            ]
            .map(item=>{
                return UniqueFieldModel.createNew(item);
            })
        );

        try{
            const result = await models[0].update({email: models[1].data.email});
            assert.equal(result, false);
        }catch(e){
            assert.equal(e instanceof Error, true);
            assert.equal(
                e.message,
                `BaseModel::checkUniqueFields(...) | Breaking unique constraints with 'email:${models[1].data.email}' in table 'unique_field'`
            );
        }
    });

});