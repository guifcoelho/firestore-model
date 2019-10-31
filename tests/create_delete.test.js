const assert = require('assert');
let {firestoreSdk, firestoreNamespaces} = require('./functions/firebase.js');

if(firestoreSdk == 'local'){
    const localFirebase = require('@firebase/testing');
    beforeEach(async () => {
        firestoreNamespaces = require('./functions/firebase.js').firestoreNamespaces;
    });
    after(async ()=>{
        await Promise.all(localFirebase.apps().map(app => app.delete()));
    })
}

const {DocumentReference} = firestoreNamespaces;

const DummyItemModel = require('./models/DummyItemModel.js');
const DummyModel = require('./models/DummyModel.js');
const UniqueFieldModel = require('./models/UniqueFieldModel.js');
const DateAttributeModel = require('./models/DateAttributeModel.js');
const ArrayAttributeModel = require('./models/ArrayAttributeModel.js');
const DefaultAttrModel = require('./models/DefaultAttrModel.js');
const DefaultAttrFunctionModel = require('./models/DefaultAttrFunctionModel.js');
const ObjectAttributeModel = require('./models/ObjectAttributeModel.js');

describe('Create/update model', () => {

    it("should write to database and return valid models", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });
        assert.equal(dummy_item.data.createdAt.getTime(), dummy_item.data.updatedAt.getTime());
        assert.equal(dummy_item.data.createdAt < new Date(), true);
        assert.equal(dummy_item.data.updatedAt < new Date(), true);


        assert.equal(dummy_item.data.createdAt.getDate(), (new Date).getDate());
        assert.equal(dummy_item.data.createdAt.getFullYear(), (new Date).getFullYear());
        assert.equal(dummy_item.data.createdAt.getMonth(), (new Date).getMonth());

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

    it('should create by id', async () => {
        await DummyItemModel.whereAll().delete();
        const id = `id-${parseInt(Math.random()*10000)}`;
        const setModel = await DummyItemModel.setById(id, {
            title: `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`
        });

        const data = new Array(10).fill(null).map(() => `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`);
        const createModels = await Promise.all(
            data.map(title => DummyItemModel.createNew({title}))
        )

        const findModel = await DummyItemModel.find(setModel.data.id).first();
        assert.equal(findModel.data.title, setModel.data.title);

        const queryModels = await DummyItemModel.whereAll().get();
        assert.equal(queryModels.length, createModels.length + 1);

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
        assert.equal(updated_dummy_item.data.updatedAt > dummy_item.data.createdAt, true);
        assert.equal(updated_dummy_item.data.updatedAt > dummy_item.data.updatedAt, true);
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
                `BaseModel:: Breaking unique constraints with 'email:${email}' in table 'unique_field'`
            );
        }
        
    });

    it('should not update with unique fields', async () => {
        await UniqueFieldModel.whereAll().delete();
        
        const models = await Promise.all(
            [
                {email: `email_${Date.now()}_${Math.random()}_1@email.com`, other: `${Date.now()}-${parseInt(Math.random()*1000)}`},
                {email: `email_${Date.now()}_${Math.random()}_2@email.com`, other: `${Date.now()}-${parseInt(Math.random()*1000)}`}
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
                `BaseModel:: Breaking unique constraints with 'email:${models[1].data.email}' in table 'unique_field'`
            );
        }
    });

    it('should other fields without throwing exception', async () => {
        await UniqueFieldModel.whereAll().delete();
        
        const model = await UniqueFieldModel.createNew({
            email: `email_${Date.now()}_${Math.random()}_1@email.com`,
            other: `${Date.now()}-${parseInt(Math.random()*1000)}`
        });

        const modified_model = await model.update({other: 'New string'});
        assert.equal(model.data.email, modified_model.data.email);
        assert.notEqual(model.data.other, modified_model.data.other);
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

    it('should create with Array attribute and BaseModel items', async () => {

        const data = new Array(10).fill(null).map(() => `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`);
        const dummy_item_models = await Promise.all(
            data.map(item => DummyItemModel.createNew({title: item}))
        );

        await ArrayAttributeModel.whereAll().delete();
        const [model1, model2, model3] = await Promise.all([
            ArrayAttributeModel.createNew({models: dummy_item_models.slice(0,3)}),
            ArrayAttributeModel.createNew({models: dummy_item_models.slice(3, 6)}),
            ArrayAttributeModel.createNew({models: dummy_item_models.slice(6, 10)})
        ]);
        assert.equal(model1.data.models.length, 3);
        assert.equal(model2.data.models.length, 3);
        assert.equal(model3.data.models.length, 4);

        const [it_should_be_model1, it_should_be_model3, it_should_be_model2] = await Promise.all([
            ArrayAttributeModel.where('models', 'array-contains', dummy_item_models[0]).first(),
            ArrayAttributeModel.where('models', 'array-contains', dummy_item_models[8]).first(),
            ArrayAttributeModel.where('models', 'array-contains', dummy_item_models[4]).first(),
        ]);
        assert.equal(it_should_be_model1.data.id, model1.data.id);
        assert.equal(it_should_be_model2.data.id, model2.data.id);
        assert.equal(it_should_be_model3.data.id, model3.data.id);

        await ArrayAttributeModel.whereAll().delete();
        const [model4, model5] = await Promise.all([
            ArrayAttributeModel.createNew({models: [dummy_item_models[1]]}),
            ArrayAttributeModel.createNew({models: [dummy_item_models[1]]}),
        ]);
        const it_should_have_model4_and_5 = await ArrayAttributeModel.where('models', 'array-contains', dummy_item_models[1]).get();
        assert.equal(it_should_have_model4_and_5.length, 2);    
        assert.notEqual(it_should_have_model4_and_5.find(item=>item.data.id == model4.data.id), undefined);
        assert.notEqual(it_should_have_model4_and_5.find(item=>item.data.id == model5.data.id), undefined);

    });

    it('should create with Array attribute and string items', async () => {
        const data = new Array(10).fill(null).map(() => `${Date.now()}-${parseInt(Math.random()*10000)}`);
        const model = await ArrayAttributeModel.createNew({strings: data});
        assert.equal(model.data.strings.length, data.length);
        model.data.strings.forEach((item, index) => assert.equal(item, data[index]));
    });

    it('should create with Array attribute and number items', async () => {
        const data = new Array(10).fill(null).map(() => Math.random()*10000);
        const model = await ArrayAttributeModel.createNew({numbers: data});
        assert.equal(model.data.numbers.length, data.length);
        model.data.numbers.forEach((item, index) => assert.equal(item, data[index]));
    });

    it('should create with Array attribute and Date items', async () => {
        const data = new Array(10).fill(null).map(() => new Date);
        const model = await ArrayAttributeModel.createNew({dates: data});
        assert.equal(model.data.dates.length, data.length);
        model.data.dates.forEach((item, index) => assert.equal(item.getTime(), data[index].getTime()));
    });

    it('should create with Object attribute and convert known inner types', async () => {
        const model = await ObjectAttributeModel.createNew({
            objectAttr: {
                date: new Date(),
                title: 'texto'
            }
        });
        assert.equal(model.data.objectAttr.date instanceof Date, true);
    });

});

describe('Create with default attributes', () => {

    it('should create with default without function', async () => {
        const model = await DefaultAttrModel.createNew({title: `Title: ${Date.now()}`});
        assert.equal(model.data.attDefault, 'abc');
    });

    it('should create with default with function', async () => {
        const model = await DefaultAttrFunctionModel.createNew({title: `Title: ${Date.now()}`});
        assert.equal(model.data.attDefault, 'Other title');
    });
    
})