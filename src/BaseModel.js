let firebase;
if(process.hasOwnProperty('firebase')){
    firebase = process.firebase;
}else{
    firebase = require('firebase/app');
    require('firebase/firestore');
}
const firestoreNamespaces = process.hasOwnProperty('firestoreNamespaces') ? process.firestoreNamespaces : firebase.firestore;

const {DocumentReference, DocumentSnapshot, Timestamp} = firestoreNamespaces;
const Query = require('./Query.js');

module.exports = class BaseModel{

    /**
     * Instanciates a new BaseModel
     * @param {string} table 
     * @param {object} data 
     * @param {object} options
     * @param {array} tableParams
     */
    constructor(table, data = null, options = null, tableParams = []){
        this.table = table;
        this.tableParams = tableParams;
        this.at(tableParams);
        
        this.schema = options && options.hasOwnProperty('schema') ? options.schema : null;
        this.timestamps = options && options.hasOwnProperty('timestamps') ? options.timestamps : false;
        this.triggers = options && options.hasOwnProperty('triggers') ? options.triggers : null;

        if(data != null){
            this.fill(data);
        }
    }

    /**
     * Redefines the collection based on a list of parameters
     * @param {array} tableParams
     * @returns {this}
     */
    at(tableParams = []){
        if(tableParams.length > 0) this.tableParams = tableParams;
        if(this.tableParams.length > 0){
            let routeSplit = this.table.split('/');
            let index = 0;
            routeSplit = routeSplit.map(route => {
                if(route.charAt(0) == '$'){
                    route = this.tableParams[index];
                    index++;
                }
                return route;
            });
            this.table = routeSplit.join('/');
        }
        return this;
    }

    /**
     * Returns the model's configuration
     */
    get config(){
        return {
            table: this.table,
            schema: this.schema,
            timestamps: this.timestamps,
            triggers: this.triggers
            //Add others...
        }
    }

    /**
     * Returns the document reference from Firestore
     * 
     * @returns {DocumentReference} `DocumentReference`
     */
    get DocumentReference(){
        return this.data.hasOwnProperty('id') ? this.collection.doc(this.data.id) : null;
    }

    /**
     * Returns the document's collection
     */
    get collection(){
        return firebase.firestore().collection(this.table);
    }

    /**
     * Fills the model with data
     * @param {object} data 
     */
    fill(data){
        if(data instanceof DocumentSnapshot){
            this.data = this.prepareModelData(data);
        }else{
            if(this.compareSchemaWithData(data)){
                this.data = data;
            }
        }
    }

    /**
     * Verifies a value with its related schema
     * 
     * @param {object} schema
     * @param {*} value
     */
    checkSchemaType(schema, value){
        if(value == null || value == undefined){
            return schema.nullable;
        }
        if(schema.hasOwnProperty('type')){
            if(typeof value == 'object'){
                if(value instanceof Query){
                    return value.model instanceof schema.type && value.query instanceof DocumentReference;
                }
                if(schema.type == Array){
                    return Array.isArray(value);
                }

                // if(schema.type == Other){
                //     return test;
                // }
                
                //And the last one
                if(schema.type == Object){
                    return value === Object(value);
                }
                return value instanceof schema.type;
            }
            return typeof value == schema.type;
        }
    }

    validateSchema(data, key, schema){
        if(schema.hasOwnProperty('type') && !this.checkSchemaType(schema, data)){
            throw new Error(`BaseModel:: Value '${key}:${data}' in '${this.table}' is not '${schema.type}'`);
        }
        if(Array.isArray(data) && schema.hasOwnProperty('arrayOf')){
            data.forEach((item, index) => {
                if(!this.checkSchemaType({type: schema.arrayOf}, item)){
                    throw new Error(`BaseModel:: Value '${key}[${index}]:${item}' in '${this.table}' is not '${schema.arrayOf}'`);
                }
            })
        }
    }

    /**
     * Converts the DocumentSnapshot to readable data
     * @param {DocumentSnapshot} documentSnapshot 
     */
    prepareModelData(documentSnapshot){
        function convertType(item, schema){
            if(typeof item == 'object'){
                if(item instanceof DocumentReference && schema.hasOwnProperty('type')){  
                    const tableParams = schema.hasOwnProperty('tableParams') ? schema.tableParams : [];
                    return new Query(schema.type, item, tableParams);
                }
                else if(item instanceof Timestamp){
                    return new Date(item.toDate());
                }
                else if(Array.isArray(item) && schema.hasOwnProperty('arrayOf')){
                    return item.map(subItem => convertType(subItem, {type: schema.arrayOf}));
                }else if(item === Object(item)){
                    for(const prop in item){
                        item[prop] = convertType(item[prop]);
                    }
                }
            }
            return item;
        }

        let incoming = documentSnapshot.data();
        let data = {};
        if(this.schema == null){
            data = incoming;
        }else{
            for(let key in incoming){
                if(this.schema.hasOwnProperty(key)){
                    data[key] = incoming[key];
                    if(this.schema[key].hasOwnProperty('type')){
                        data[key] = convertType(data[key], this.schema[key]);
                        this.validateSchema(data[key], key, this.schema[key]);
                    }
                }         
            }
            //Go through the schema to see any key is missing from data. If yes, then use the default property (if assigned) or add the key as null
            for(let key in this.schema){
                if(!data.hasOwnProperty(key) || data[key] === null || data[key] === undefined){
                    if(!this.schema[key].hasOwnProperty('default') && (!this.schema[key].hasOwnProperty('nullable') || !this.schema[key].nullable)){
                        throw new Error(`BaseModel:: Key '${key}' in '${this.table}' is not nullable`);
                    }else if(this.schema[key].hasOwnProperty('default')){
                        data[key] = typeof this.schema[key].default == 'function' ? this.schema[key].default() : this.schema[key].default;
                        this.validateSchema(data[key], key, this.schema[key]);
                    }else{
                        data[key] = null;
                    }
                }
            }
        }

        if(this.timestamps){
            data.createdAt = incoming.hasOwnProperty('createdAt') ? new Date(incoming.createdAt.toDate()) : null;
            data.updatedAt = incoming.hasOwnProperty('updatedAt') ? new Date(incoming.updatedAt.toDate()) : null;
        }

        data.id = documentSnapshot.id;

        return data;
    }

    /**
     * Compares the schema with the some data
     * @param {object} incomingData 
     * @param {boolean} partial 
     * @returns {object}
     */
    compareSchemaWithData(incomingData, partial = false){
        let data = {};

        if(this.schema != null){
            if(partial){
                //Analysing schema with partial data. Default property is not applied.
                for(let key in incomingData){
                    if(this.schema.hasOwnProperty(key)){
                        data[key] = incomingData[key];
                        this.validateSchema(data[key], key, this.schema[key]);
                    }
                }
            }else{
                //Analysing schema with complete data. Default property is applied.
                for(let key in this.schema){
                    if(!incomingData.hasOwnProperty(key) || incomingData[key] === null || incomingData[key] === undefined){
                        if(!this.schema[key].hasOwnProperty('default') && (!this.schema[key].hasOwnProperty('nullable') || !this.schema[key].nullable)){
                            throw new Error(`BaseModel:: Key '${key}' in '${this.table}' is not nullable`);
                        }else if(this.schema[key].hasOwnProperty('default')){
                            data[key] = typeof this.schema[key].default == 'function' ? this.schema[key].default() : this.schema[key].default;
                        }else{
                            data[key] = null;
                        }
                    }else{
                        data[key] = incomingData[key];
                    }
                    this.validateSchema(data[key], key, this.schema[key]);
                }
            }
        }
        return data;
    }

    
    /**
     * Returns an array of all items in the collection
     * @param {array} tableParams
     */
    static all(tableParams = []){
        return (new Query(this, null, tableParams)).all();
    }

    /**
     * Queries all data from database
     * @param {array} tableParams
     */
    static whereAll(tableParams = []){
        return (new Query(this, null, tableParams)).whereAll();
    }

    /**
     * Queries the database against some condition
     * @param {string} field 
     * @param {string} sign 
     * @param {*} value
     * @param {array} tableParams
     */
    static where(field, sign, value, tableParams = []){
        let data = {};
        data[field] = value;
        const preparedData = this.prepareDataForDatabase(data);
        return (new Query(this, null, tableParams)).where(field, sign, preparedData[field]);
    }

    /**
     * Finds a database object by its id
     * @param {number|string} id
     * @param {array} tableParams
     */
    static find(id, tableParams = []){
        return (new Query(this, null, tableParams)).find(id);
    }

    /**
     * Prepares data to be inserted in the database
     * @param {object} incomingData
     * @returns {object} The prepared data
     */
    static prepareDataForDatabase(incomingData){
        function convertItem(item){
            if(typeof item == 'object' && item != null && item != undefined){
                if(item instanceof Date){
                    return Timestamp.fromDate(item);
                }else if(item instanceof Query && item.query instanceof DocumentReference){
                    return item.query;
                }else if(item instanceof BaseModel){
                    return item.DocumentReference;
                }else if(Array.isArray(item)){
                    return item.map(subItem => convertItem(subItem));
                }else if(item === Object(item)){
                    for(const prop in item){
                        item[prop] = convertItem(item[prop]);
                    }
                }
                //Include other types...
            }
            return item;
        }
        for(let key in incomingData){
            incomingData[key] = convertItem(incomingData[key]);
        }
        return incomingData;
    }

    /**
     * Checks if there are unique fields constraints. Throws exception if any constraint is broken.
     * 
     * @param {object} data
     * @returns {true|void} True if it passes and `Error` if not
     */
    async checkUniqueFields(data){
        if(this.schema){
            for(let key in this.schema){
                if(this.schema[key].hasOwnProperty('unique') && this.schema[key].unique && data.hasOwnProperty(key)){
                    if(this.schema[key].type instanceof Array){
                        throw new Error(`BaseModel:: Do not check for unicity with array fields`);
                    }else{
                        const first = await this.constructor.where(key, '==', data[key], this.tableParams).first();
                        if(first){
                            throw new Error(`BaseModel:: Breaking unique constraints with '${key}:${data[key]}' in table '${this.table}'`);
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Refreshes the model with data from the database
     * @returns {this|null}
     */
    refresh(){
        return this.constructor.find(this.data.id, this.tableParams).first();
    }

    /**
     * Triggers a registered event of type 'onWrite' (set function), 'onDelete' (delete function), 'onCreate' (create function), and 'onUpdate' (update function).
     * 
     * - 'onWrite' and 'onCreate' will receive the new data as parameter
     * - 'onDelete' will receive the delete document's data as parameter
     * - 'onUpdate' triggers will receive the old and new data as parameter ({old, new}).
     * 
     * @param {string} event 
     * @param {object} data 
     */
    triggerEvent(event, data){
        if(this.triggers != null && this.triggers.hasOwnProperty(event) && typeof this.triggers[event] == 'function'){
            this.triggers[event](data);
        }
    }

    /**
     * Updates the database with new data
     * @param {object} newData
     * @returns {this|null}
     */
    async update(newData){
        let data = this.compareSchemaWithData(newData, true);
        if(this.timestamps){
            data.updatedAt = new Date();
        }
        data = this.constructor.prepareDataForDatabase(data);
        const check_unique = await this.checkUniqueFields(data);
        if(check_unique){
            const update = await (new Query(this.constructor, this.DocumentReference, this.tableParams)).update(data);
            if(update){
                const updatedItem = await this.refresh();
                if(updatedItem != null){
                    const oldData = {...this.data};
                    const newData = {...updatedItem.data};
                    this.triggerEvent('onUpdate', {old: oldData, new: newData});
                }
                return updatedItem;
            }
        }
    }

    

    /**
     * Creates a new registry in the database
     * @param {object} newData
     * @param {array} tableParams
     * @returns {BaseModel} instance of `FirestoreModel.BaseModel`
     */
    static async createNew(newData, tableParams = []){
        const model = (new this).at(tableParams);

        let data = model.compareSchemaWithData(newData);
        if(model.timestamps){
            const currentTime = new Date();
            data.createdAt = currentTime;
            data.updatedAt = currentTime;
        }
        data = this.prepareDataForDatabase(data);
        
        const check_unique = await model.checkUniqueFields(data);
        const newItem = check_unique ? await (new Query(this, null, model.tableParams)).insert(data) : null;
        if(newItem != null){
            newItem.triggerEvent('onCreate', {...newItem.data});
        }
        return newItem;
    }

    /**
     * Sets a document to the database by its id. It will replace existing document with the same id
     * @param {string|number} docId 
     * @param {object} newData 
     * @param {array} tableParams 
     */
    static async setById(docId, newData, tableParams = []){
        const model = (new this).at(tableParams);

        let data = model.compareSchemaWithData(newData);
        if(model.timestamps){
            const currentTime = new Date();
            data.createdAt = currentTime;
            data.updatedAt = currentTime;
        }
        data = this.prepareDataForDatabase(data);
        const newItem =  await (new Query(this, null, model.tableParams)).setById(docId, data);
        if(newItem != null){
            newItem.triggerEvent('onWrite', {...newItem.data});
        }
        return newItem;
    }

    /**
     * Deletes the model
     * @returns {boolean}
     */
    async delete(){
        const deleted = await (new Query(this.constructor, this.DocumentReference, this.tableParams)).delete();
        if(deleted){
            this.triggerEvent('onDelete', {...this.data});
        }
        return deleted;
    }

    /**
     * Returns the number of documents inside the collection
     * @param {array} tableParams
     * @returns {number} integer
     */
    static async count(tableParams = []){
        const model = (new this).at(tableParams);
        return await (new Query(this, model.collection, tableParams)).count();
    }


    /**
     * Paginates the a database query
     * @param {int} quantity Number of items to paginate
     * @param {this} cursor Model object to paginate from
     * @param {array} tableParams
     */
    static paginate(quantity = 5, cursor = null, tableParams = []){
        return (new Query(this, null, tableParams)).whereAll().paginate(quantity, cursor);
    }


    /**
     * Returns the HasOne relation
     * @param {*} child_class 
     * @param {string} field_in_child_model
     * @param {string|null} field_in_this
     * @param {array} child_tableParams
     */
    hasOne(child_class, field_in_child_model, field_in_this = null, child_tableParams = []){
        const HasOne = require('./Relations/HasOne.js');
        return new HasOne(child_class, child_tableParams, this, field_in_child_model, field_in_this);
    }

    /**
     * Returns the HasMany relation
     * @param {*} child_class 
     * @param {string} field_in_child_models 
     * @param {string} field_in_this 
     * @param {array} child_tableParams
     */
    hasMany(child_class, field_in_child_models, field_in_this, child_tableParams = []){
        const HasMany = require('./Relations/HasMany.js');
        return new HasMany(child_class, child_tableParams, this, field_in_child_models, field_in_this);
    }
};
