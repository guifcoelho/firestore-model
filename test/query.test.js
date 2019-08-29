var assert = require('assert');
const DummyItemModel = require('./models/DummyItemModel.js');
const DummyModel = require('./models/DummyModel.js');
const ChainedWhereModel = require('./models/ChainedWhereModel.js');

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
        const query = DummyItemModel.where('title', '==', `It won't find this title in ${(new Date).toString()}`);
        const model = await query.first();
        assert.equal(model, null);
    });

    it("should find with chained 'where' clauses", async () => {
        const query_all = ChainedWhereModel.whereAll();
        const query_delete = await query_all.delete();
        assert.equal(query_delete, true);

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

        const query = ChainedWhereModel.where("number_field", "<", 15).where("number_field", ">", 5);

        const models = await query.get();
        assert.equal(models.length, 3);
    });

});