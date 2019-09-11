const assert = require('assert');
const HasOne = require('../src/Relations/HasOne.js');
const HasMany = require('../src/Relations/HasMany.js');
const HasOneModel = require('./models/RelationsModels/HasOneModel.js');
const HasManyModel = require('./models/RelationsModels/HasManyModel.js');
const HasOneChildModel = require('./models/RelationsModels/HasOneChildModel.js');
const HasManyChildModel = require('./models/RelationsModels/HasManyChildModel.js');

describe('Adding relation to database', () => {

    it('should save HasOne relation to the database', async () => {

        const parent = await HasOneModel.createNew({
            title: `New title ${Date.now()}`
        });
        assert.equal(parent.item() instanceof HasOne, true);

        const title = `New other title ${Date.now()}`;
        const item = await parent.item().save({title});
        assert.equal(item.data.title, title);

        const db_child = await HasOneChildModel.where('parent', '==', parent).first()
        assert.notEqual(db_child, null);
    });

    it('should save HasMany relation to the database', async () => {

        const parent = await HasManyModel.createNew({
            title: `New title ${Date.now()}`
        });
        assert.equal(parent.itens() instanceof HasMany, true);

        await Promise.all(
            [
                {title: `New other title ${Date.now()} 1`},
                {title: `New other title ${Date.now()} 2`},
                {title: `New other title ${Date.now()} 3`}
            ].map(item => parent.itens().save(item))
        );

        const db_children = await HasManyChildModel.where('parent', '==', parent).get();
        assert.equal(db_children.length, 3);
    });

})