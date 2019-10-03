const assert = require('assert');
const {firebase} = require('./functions/firebase.js');

const TableParamsModel = require('./models/TableParamsModel.js');


describe('Create model with table params', () => {
    
    it('should create and find model', async () => {

        const tableParams = ['nomeParam1', 'nomeParam2'];
        await TableParamsModel.whereAll(tableParams).delete();

        const model = await TableParamsModel.createNew(
            {title: `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`},
            tableParams
        );
        assert.equal(model.table, `table_params/nomeParam1/nomeParam2`);

        const queryModel = await TableParamsModel.find(model.data.id, tableParams).first();
        assert.equal(queryModel.data.title, model.data.title);

    });

    it('should create and find into different paths', async ()=> {

        const tableParams1 = ['nomeParam1', 'nomeParam2'];
        const tableParams2 = ['nomeParam3', 'nomeParam4'];

        await Promise.all([
            TableParamsModel.whereAll(tableParams1).delete(),
            TableParamsModel.whereAll(tableParams2).delete()
        ]);

        const data1 = new Array(10).fill(null).map(() => `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`);
        const data2 = new Array(5).fill(null).map(() => `Title: ${Date.now()}-${parseInt(Math.random()*10000)}`);

        const [models1, models2] = await Promise.all([
            data1.map(title => TableParamsModel.createNew({title}, tableParams1)),
            data2.map(title => TableParamsModel.createNew({title}, tableParams2))
        ]);

        const [count1, count2] = await Promise.all([
            TableParamsModel.whereAll(tableParams1).count(),
            TableParamsModel.whereAll(tableParams2).count()
        ]);

        assert.equal(count1, models1.length);
        assert.equal(count2, models2.length);

    });

})