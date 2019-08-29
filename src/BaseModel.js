require('firebase/firestore');
const Query = require('./Query.js');
const HasMany = require('./Relations/HasMany.js');

module.exports = class BaseModel{

    /**
     * Instanciates a new BaseModel
     * @param firebase
     * @param {string} table 
     * @param {object} data 
     * @param {object} schema
     * @param {boolean} timestamps
     */
    constructor(firebase, table, data = null, schema = null, timestamps = false){
        this.firebase = firebase;
        this.table = table;
        this.collection = firebase.firestore().collection(table);
        this.schema = schema;
        this.timestamps = timestamps;
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
     * @returns `firebase.firestore.DocumentReference`
     */
    get DocumentReference(){
        return this.collection.doc(this.data.id);
    }

    /**
     * Fills the model with data
     * @param {object} data 
     */
    fill(data){
        if( data instanceof this.firebase.firestore.DocumentSnapshot || data instanceof this.firebase.firestore.QueryDocumentSnapshot ){
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
                return value instanceof schema.type;
            }
            return typeof value == schema.type;
        }
    }

    /**
     * Converts the DocumentSnapshot to readable data
     * @param {firebase.firestore.DocumentSnapshot} documentSnapshot 
     */
    prepareModelData(documentSnapshot){
        let incoming = documentSnapshot.data();

        let data = {};
        for(let key in incoming){

            //If schema is null, it will accept anything
            //If schema is not null, it will check if key is in schema and its type
            if(this.schema == null || this.schema.hasOwnProperty(key)){
                if(!this.checkSchemaType(this.schema[key], incoming[key])){
                    throw new Error(`BaseModel::prepareModelData(): Value '${key}:${incoming[key]}' in '${this.table}' is not '${this.schema[key].type}'`);
                }else{
                    if(incoming[key] instanceof this.firebase.firestore.DocumentReference && this.schema[key].hasOwnProperty('modelClass')){  
                        data[key] = new Query(this.schema[key].modelClass, incoming[key]);
                    }
                    else if(incoming[key] instanceof Date){
                        data[key] = incoming[key].toDate();
                    }else{
                        data[key] = incoming[key];
                    }
                }
            }         
        }

        //Go through the schema to see any key is missing from data. If yes, then add the key as null
        if(this.schema != null){
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
                if(documentSnapshot.createTime && typeof documentSnapshot.createTime.toDate == 'function'){
                    data.created_at = documentSnapshot.createTime.toDate();
                    data.updated_at = documentSnapshot.updateTime.toDate();
                }else{
                    const createTime = documentSnapshot._document.proto.createTime;
                    const updateTime = documentSnapshot._document.proto.updateTime;
                    data.created_at = (new this.firebase.firestore.Timestamp(createTime.seconds, createTime.nanos)).toDate();
                    data.updated_at = (new this.firebase.firestore.Timestamp(updateTime.seconds, updateTime.nanos)).toDate();
                }  
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
        return (new Query(this)).where(field, sign, value);
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
     * @returns {object}
     */
    async prepareDataForDatabase(incomingData){
        for(let key in incomingData){
            if(typeof incomingData[key] == 'object' && incomingData[key] != null && incomingData[key] != undefined){
                
                if(incomingData[key] instanceof Date){
                    incomingData[key] = this.firebase.firestore.Timestamp.fromDate(incomingData[key]);
                }else if(incomingData[key] instanceof Query && incomingData[key].query instanceof this.firebase.firestore.DocumentReference){
                    incomingData[key] = incomingData[key].query;
                }else if(incomingData[key] instanceof BaseModel){
                    incomingData[key] = await incomingData[key].DocumentReference;
                }
                //Include other types...
            }
        }
        return incomingData;
    }


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
     * Updates the database with new data
     * 
     * @param {object} newData
     * @returns {this|false} false is errored and this if ok
     */
    async update(newData){
        const query = await (new Query(this.constructor)).find(this.data.id);
        const model = await query.first();
        if(model){
            let data = await this.prepareDataForDatabase(newData);
            data = this.compareSchemaWithData(data, true);
            const check_unique = await model.checkUniqueFields(data);
            if(check_unique){
                const update = await query.update(data);
                if(update){
                    for(let prop in this.data){
                        if(data.hasOwnProperty(prop)){
                            this.data[prop] = data[prop];
                        }
                    }
                }
                return true;
            }
        }
        return false;
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
        let data = await model.prepareDataForDatabase(newData);
        data = model.compareSchemaWithData(newData);
        const check_unique = await model.checkUniqueFields(data);
        return check_unique ? await (new Query(this)).insert(data) : false;
    }

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
     * 
     * @returns {number} integer
     */
    static async count(){
        const model = new this();
        const collRef = model.collection;
        return await (new Query(this, collRef)).count();
    }

    /**
     * Returns the HasMany relation
     * @param {*} child_class 
     * @param {string} field_in_child_models 
     * @param {string} field_in_this 
     * 
     * @returns `FirestoreModel.Relations.HasMany`
     */
    hasMany(child_class, field_in_child_models, field_in_this){
        return new HasMany(child_class, this, field_in_child_models, field_in_this);
    }

};