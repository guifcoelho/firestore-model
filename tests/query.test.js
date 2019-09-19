const assert = require('assert');
require('./functions/firebase.js');

const DummyItemModel = require('./models/DummyItemModel.js');
const ChainedWhereModel = require('./models/ChainedWhereModel.js');
const ArrayAttributeModel = require('./models/ArrayAttributeModel.js');

describe('Query database', () => {

    it("should find by id", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });
        
        const query = DummyItemModel.find(dummy_item.data.id);
        const db_dummy_item = await query.first();
        assert.notEqual(db_dummy_item,  false);
    });

    it("should not find by id", async () => {       
        const query = DummyItemModel.find('1234');
        const db_dummy_item = await query.first();
        assert.equal(db_dummy_item,  null);
    });

    it("should find by attribute with 'where' clause", async () => {
        const dummy_item = await DummyItemModel.createNew({
            title: `Dummy item title: ${(new Date()).toString()}`
        });

        const query = DummyItemModel.where('title', '==', dummy_item.data.title);
        const db_dummy_item = await query.first();
        assert.notEqual(db_dummy_item, null);
        assert.equal(db_dummy_item instanceof DummyItemModel, true);
    });

    it("should not find by attribute with 'where' clause", async () => {
        const model = await DummyItemModel.where('title', '==', `It won't find this title in ${(new Date).toString()}`).first();
        assert.equal(model, null);
    });

    it("should find with chained 'where' clauses", async () => {
        await ChainedWhereModel.whereAll().delete();

        const itens = [
            {number_field: 10},
            {number_field: 5},
            {number_field: 0},
            {number_field: 20},
            {number_field: 15},
            {number_field: 7},
            {number_field: 13},
        ];
        await Promise.all(
            itens.map(async item => {
                return await ChainedWhereModel.createNew(item);
            })
        );

        const qtt = await ChainedWhereModel.count();
        assert.equal(qtt, itens.length);

        const query = ChainedWhereModel.where("number_field", "<", 15).where("number_field", ">", 5);

        const models = await query.get();
        assert.equal(models.length, 3);

        
    });

    it('should return all items from collection', async () => {
        await DummyItemModel.whereAll().delete();
        const data = [
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
            {title: `Dummy item title: ${(new Date()).toString()}`},
        ];

        await Promise.all(
            data.map(item=>DummyItemModel.createNew(item))
        );

        const db_all = await DummyItemModel.all();
        assert.equal(db_all.length, data.length);
        
        db_all.forEach((item, index)=>assert.equal(item.data.title, data[index].title));

    });

    it('should order results z-a', async () =>{
        await DummyItemModel.whereAll().delete();

        const data = [
            {title: "a"},
            {title: "b"},
            {title: "c"}
        ];

        await Promise.all(
            data.map(item=>DummyItemModel.createNew(item))
        );

        const db_all = await DummyItemModel.whereAll().orderBy('title', 'desc').get();
        assert.equal(db_all.length, data.length);
        db_all.forEach((item, index) => assert.equal(item.data.title, data[data.length-index-1].title));

    });

    it('should order results a-z', async () =>{
        await DummyItemModel.whereAll().delete();

        const data = [
            {title: "z"},
            {title: "h"},
            {title: "a"}
        ];

        await Promise.all(
            data.map(item=>DummyItemModel.createNew(item))
        );

        const db_all = await DummyItemModel.whereAll().orderBy('title').get();
        assert.equal(db_all.length, data.length);
        db_all.forEach((item, index) => assert.equal(item.data.title, data[data.length-index-1].title));

    });

    it('should limit queried results', async () => {
        await DummyItemModel.whereAll().delete();
        const data = [
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
            {title: `Title: ${Date.now()}`},
        ];
        await Promise.all(
            data.map(item=>DummyItemModel.createNew(item))
        );
        const db_all = await DummyItemModel.whereAll().limit(5).get();
        assert.equal(db_all.length, 5);

        const qtt = await DummyItemModel.count();
        assert.equal(qtt, data.length);
    });

    it('should find within Array attributes', async () => {
        await ArrayAttributeModel.whereAll().delete();
        await Promise.all([
            ArrayAttributeModel.createNew({strings: ['a', 'b', 'c', 'd', 'e']}),
            ArrayAttributeModel.createNew({strings: ['f', 'g', 'h', 'i', 'j']}),
            ArrayAttributeModel.createNew({strings: ['k', 'l', 'm', 'n', 'o']}),
        ]);

        const [query_model_a_e, query_model_k_o, query_model_f_j] = await Promise.all([
            ArrayAttributeModel.where('strings', 'array-contains', 'a').first(),
            ArrayAttributeModel.where('strings', 'array-contains', 'o').first(),
            ArrayAttributeModel.where('strings', 'array-contains', 'h').first()
        ]);

        assert.notEqual(query_model_a_e.data.strings.find(item => item=='a'), undefined);
        assert.notEqual(query_model_a_e.data.strings.find(item => item=='b'), undefined);
        assert.notEqual(query_model_a_e.data.strings.find(item => item=='c'), undefined);
        assert.notEqual(query_model_a_e.data.strings.find(item => item=='d'), undefined);
        assert.notEqual(query_model_a_e.data.strings.find(item => item=='e'), undefined);

        assert.notEqual(query_model_f_j.data.strings.find(item => item=='f'), undefined);
        assert.notEqual(query_model_f_j.data.strings.find(item => item=='g'), undefined);
        assert.notEqual(query_model_f_j.data.strings.find(item => item=='h'), undefined);
        assert.notEqual(query_model_f_j.data.strings.find(item => item=='i'), undefined);
        assert.notEqual(query_model_f_j.data.strings.find(item => item=='j'), undefined);

        assert.notEqual(query_model_k_o.data.strings.find(item => item=='k'), undefined);
        assert.notEqual(query_model_k_o.data.strings.find(item => item=='l'), undefined);
        assert.notEqual(query_model_k_o.data.strings.find(item => item=='m'), undefined);
        assert.notEqual(query_model_k_o.data.strings.find(item => item=='n'), undefined);
        assert.notEqual(query_model_k_o.data.strings.find(item => item=='o'), undefined);

    })

});