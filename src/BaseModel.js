const firebase = require('firebase/app');
require('firebase/firestore');
const {DocumentReference, DocumentSnapshot, Timestamp} = firebase.firestore;
const Query = require('./Query.js');

module.exports = class BaseModel{

    /**
     * Instanciates a new BaseModel
     * @param {string} table 
     * @param {object} data 
     * @param {object} options
     */
    constructor(table, data = null, options = null){
        this.table = table;
        this.collection = firebase.firestore().collection(table);
        this.schema = options && options.hasOwnProperty('schema') ? options.schema : null;
        this.timestamps = options && options.hasOwnProperty('timestamps') ? options.timestamps : false;
        if(data != null){
            this.fill(data);
        }
    }

    /**
     * Returns the model's configuration
     */
    get config(){
        return {
            table: this.table,
            schema: this.schema,
            timestamps: this.timestamps,
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
                return value instanceof schema.type;
            }
            return typeof value == schema.type;
        }
    }

    /**
     * Converts the DocumentSnapshot to readable data
     * @param {DocumentSnapshot} documentSnapshot 
     */
    prepareModelData(documentSnapshot){
        let incoming = documentSnapshot.data();
        let data = {};
        if(this.schema == null){
            data = incoming;
        }else{
            for(let key in incoming){
                if(this.schema.hasOwnProperty(key)){
                    data[key] = incoming[key];
                    if(this.schema[key].hasOwnProperty('type')){
                        if(data[key] instanceof DocumentReference){  
                            data[key] = new Query(this.schema[key].type, data[key]);
                        }
                        else if(data[key] instanceof Timestamp){
                            data[key] = data[key].toDate();
                        }
                        if(!this.checkSchemaType(this.schema[key], data[key])){
                            throw new Error(`BaseModel::prepareModelData(): Value '${key}:${data[key]}' in '${this.table}' is not '${this.schema[key].type}'`);
                        }
                    }
                }         
            }

            //Go through the schema to see any key is missing from data. If yes, then add the key as null
            for(let key in this.schema){
                if(!data.hasOwnProperty(key)){
                    if(!this.schema[key].hasOwnProperty('nullable') || !this.schema[key].nullable){
                        throw new Error(`BaseModel::prepareModelData(): Key '${key}' in '${this.table}' is not nullable`);
                    }
                    data[key] = null;
                }
            }
        }       

        if(this.timestamps){
            try{
                const createTime = documentSnapshot._document.proto.createTime;
                const updateTime = documentSnapshot._document.proto.updateTime;
                data.created_at = new Date(createTime.seconds * 1000);
                data.updated_at = new Date(updateTime.seconds * 1000); 
            }catch(e){
                data.created_at = null;
                data.updated_at = null;
            }
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
                for(let key in incomingData){
                    if(!this.schema.hasOwnProperty(key)){
                        throw new Error(`BaseModel::compareSchemaWithData() | Attribute '${key}' is not allowed in table '${this.table}'`);
                    }else if(!this.checkSchemaType(this.schema[key], incomingData[key])){
                        throw new Error(`BaseModel::compareSchemaWithData() | Value '${key}:${incomingData[key]}' in table '${this.table}' is not '${this.schema[key].type}'`);                        
                    }else{
                        data[key] = incomingData[key];
                    }
                }
            }else{
                for(let key in this.config.schema){
                    if(
                        !this.schema[key].nullable && 
                        (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)
                    ){
                        throw new Error(`Key '${key}' in table '${this.table}' is not nullable`);
                    }
                    else if(this.schema[key].nullable && (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)){
                        data[key] = null;
                    }
                    else if(!this.checkSchemaType(this.schema[key], incomingData[key])){
                        throw new Error(`BaseModel::compareSchemaWithData(): Value '${key}:${incomingData[key]}' in table '${this.table}' is not '${this.schema[key].type}'`);
                    }else{
                        data[key] = incomingData[key];
                    }
                }
            }
        }
        return data;
    }

    
    /**
     * Returns an array of all items in the collection
     */
    static all(){
        return (new Query(this)).all();
    }

    /**
     * Queries the database against some condition
     * @param {string} field 
     * @param {string} sign 
     * @param {*} value
     */
    static where(field, sign, value){
        let data = {};
        data[field] = value;
        const preparedData = (new this()).prepareDataForDatabase(data);
        return (new Query(this)).where(field, sign, preparedData[field]);
    }

    /**
     * Finds a database object by its id
     * @param {number|string} id
     */
    static find(id){
        return (new Query(this)).find(id);
    }

    /**
     * Prepares data to be inserted in the database
     * @param {object} incomingData
     * @returns {object} The prepared data
     */
    prepareDataForDatabase(incomingData){
        for(let key in incomingData){
            if(typeof incomingData[key] == 'object' && incomingData[key] != null && incomingData[key] != undefined){
                if(incomingData[key] instanceof Date){
                    incomingData[key] = Timestamp.fromDate(incomingData[key]);
                }else if(incomingData[key] instanceof Query && incomingData[key].query instanceof DocumentReference){
                    incomingData[key] = incomingData[key].query;
                }else if(incomingData[key] instanceof BaseModel){
                    incomingData[key] = incomingData[key].DocumentReference;
                }
                //Include other types...
            }
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
                    const query = this.constructor.where(key, '==', data[key]);
                    const query_first = await query.first();
                    if(query_first){
                        throw new Error(`BaseModel::checkUniqueFields(...) | Breaking unique constraints with '${key}:${data[key]}' in table '${this.table}'`);
                    }
                }
            }
        }
        return true;
    }

    /**
     * Refreshes the model with data from the database
     */
    refresh(){
        return this.constructor.find(this.data.id).first();
    }

    /**
     * Updates the database with new data
     * 
     * @param {object} newData
     */
    async update(newData){
        let data = this.compareSchemaWithData(newData, true);
        data = this.prepareDataForDatabase(data);
        const check_unique = await this.checkUniqueFields(data);
        if(check_unique){
            const update = await (new Query(this.constructor, this.DocumentReference)).update(data);
            if(update){
                return this.refresh();
            }
        }
    }

    /**
     * Queries all data from database
     */
    static whereAll(){
        return (new Query(this)).whereAll();
    }

    /**
     * Creates a new registry in the database
     * @param {object} newData
     * @returns {*} instance of `FirestoreModel.BaseModel`
     */
    static async createNew(newData){
        const model = new this();
        let data = model.compareSchemaWithData(newData);
        data = model.prepareDataForDatabase(data);
        const check_unique = await model.checkUniqueFields(data);
        return check_unique ? await (new Query(this)).insert(data) : false;
    }

    /**
     * Deletes the model
     */
    async delete(){
        try{
            await (new Query(this.constructor, this.DocumentReference)).delete();
            return true;
        }catch(e){
            return false;
        }
    }

    /**
     * Returns the number of documents inside the collection
     * @returns {number} integer
     */
    static async count(){
        return await (new Query(this, (new this).collection)).count();
    }

    /**
     * Returns the HasOne relation
     * @param {*} child_class 
     * @param {string} field_in_child_model
     * @param {string|null} field_in_this 
     */
    hasOne(child_class, field_in_child_model, field_in_this = null){
        const HasOne = require('./Relations/HasOne.js');
        return new HasOne(child_class, this, field_in_child_model, field_in_this);
    }

    /**
     * Returns the HasMany relation
     * @param {*} child_class 
     * @param {string} field_in_child_models 
     * @param {string} field_in_this 
     */
    hasMany(child_class, field_in_child_models, field_in_this){
        const HasMany = require('./Relations/HasMany.js');
        return new HasMany(child_class, this, field_in_child_models, field_in_this);
    }

};