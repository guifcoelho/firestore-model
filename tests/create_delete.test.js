const assert = require('assert');
const {firebase} = require('./functions/firebase.js');
const {DocumentReference} = firebase.firestore;
const DummyItemModel = require('./models/DummyItemModel.js');
const DummyModel = require('./models/DummyModel.js');
const UniqueFieldModel = require('./models/UniqueFieldModel.js');
const DateAttributeModel = require('./models/DateAttributeModel.js');

describe('Create/update model', () => {

    it("should write to database and return valid models", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });
        
        assert.equal(dummy_item.data.created_at.getDate(), (new Date).getDate());
        assert.equal(dummy_item.data.created_at.getFullYear(), (new Date).getFullYear());
        assert.equal(dummy_item.data.created_at.getMonth(), (new Date).getMonth());

        const dummy = await DummyModel.createNew({
            item: dummy_item,
            description: `Dummy description: ${(new Date()).toString()}`
        });
        assert.equal(dummy instanceof DummyModel, true);
        assert.equal(dummy.data.item.query instanceof DocumentReference, true);
        
        const item = await dummy.data.item.first();
        assert.equal(item instanceof DummyItemModel, true);
        assert.equal(item.data.id, dummy_item.data.id);
    });

    it('should update existing model', async ()=>{

        const title = `Dummy item title: ${Date.now()}`;
        const dummy_item = await DummyItemModel.createNew({
            title
        });
        const updated_dummy_item = await dummy_item.update({
            title: 'Novo dummy item title'
        });
        assert.notEqual(updated_dummy_item, null);
        assert.notEqual(updated_dummy_item.data.title, title);

        const db_dummy_item = await DummyItemModel.find(dummy_item.data.id).first();
        assert.equal(db_dummy_item.data.title, updated_dummy_item.data.title);

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
        await UniqueFieldModel.whereAll().delete();

        const email = `email_${Date.now()}_${Math.random()}@email.com`;
        await UniqueFieldModel.createNew({email});
        
        try{
            await UniqueFieldModel.createNew({email});
            assert.equal(true, false);
        }catch(e){
            assert.equal(e instanceof Error, true);
            assert.equal(
                e.message,
                `BaseModel::checkUniqueFields(...) | Breaking unique constraints with 'email:${email}' in table 'unique_field'`
            );
        }
        
    });

    it('should not update with unique fields', async () => {
        await UniqueFieldModel.whereAll().delete();
        
        const models = await Promise.all(
            [
                {email: `email_${Date.now()}_${Math.random()}_1@email.com`},
                {email: `email_${Date.now()}_${Math.random()}_2@email.com`}
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

describe('Create with specific types', () => {
    
    it('should create with Date attribute', async () => {
        const model = await DateAttributeModel.createNew({
            my_date: new Date()
        });
        const query = DateAttributeModel.where('my_date', '==', model.data.my_date);
        const db_model = await query.first();
        assert.notEqual(db_model, null);
    });

});