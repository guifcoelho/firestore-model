const {firebase, firestore} = require('./BootFirestore.js');
const Query = require('./Query.js');
const HasMany = require('./Relations/HasMany.js');

module.exports = class BaseModel{

    /**
     * Instanciates a new BaseModel
     * @param {string} table 
     * @param {object} data 
     * @param {object} schema
     */
    constructor(
        table,
        data = null,
        schema = null,
        timestamps = false
    ){
        this.table = table;
        this.setCollection();
        this.schema = schema;
        this.timestamps = timestamps;
        if(data != null){
            this.fill(data);
        }
    }

    static getConfig(){
        const model = new this();
        return {
            table: model.table,
            schema: model.schema,
            timestamps: model.timestamps,
            //Add others...
        }
    }

    /**
     * Returns the documento reference from Firestore
     * 
     * @returns `firebase.firestore.DocumentReference`
     */
    getRef(){
        return this.collection.doc(this.data.id);
    }

    /**
     * Returns the Firestore collection related to the model
     * 
     * @returns `firebase.firestore.CollectionReference`
     */
    getCollection(){
        return this.collection;
    }

    /**
     * Return the model data
     * 
     * @returns `object`
     */
    getData(){
        return this.data;
    }

    /**
     * Fills the model with data
     * @param {object} data 
     */
    fill(data){
        if(
            data.constructor.name == 'DocumentSnapshot' ||
            data.constructor.name == 'QueryDocumentSnapshot'
        ){
            data = this.prepareModelData(data);
        }
        this.data = data;
        return this;
    }

    /**
     * Sets the collection reference of the model
     * 
     * @returns `void`
     */
    setCollection(){
        this.collection = firestore.collection(this.table);
        return this;
    }

    /**
     * Verifies the given data with the types defined in the schema
     * 
     * @param {object} schema
     * @param {*} value 
     * @param {string} client_server_any
     */
    static checkSchemaType(schema, value, client_server_any = 'any'){
        if(value == null || value == undefined){
            return schema.nullable;
        }
        if(schema.hasOwnProperty('type')){
            let type = schema.type.split("|");
            switch(client_server_any){
                case 'client': type = [type[0]]; break;
                case 'server': type = [type[Math.min(type.length-1, 1)]]; break;
            }
            const check = type.map(el => {
                if(typeof value == 'object'){
                    return value.constructor.name == el;
                }
                return typeof value == el;
            });          
            return check.find(e=>e);
        }
    }

    /**
     * Converts the DocumentSnapshot to readable data
     * @param {DocumentSnapshot} documentSnapshot 
     */
    prepareModelData(documentSnapshot){
        let incoming = documentSnapshot.data();

        let data = {};
        for(let key in incoming){
            if(typeof incoming[key] == "object" && incoming[key] != null & incoming[key] != undefined){
                
                if(incoming[key].constructor.name == 'Timestamp'){
                    incoming[key] = incoming[key].toDate();
                }
                if(incoming[key].constructor.name == 'DocumentReference'){
                    incoming[key] = incoming[key].id;
                }
            }

            //If schema is null, it will accept anything
            //If schema is not null, it will check if key is in schema and its type
            if(this.schema == null || this.schema.hasOwnProperty(key)){
                if(!this.constructor.checkSchemaType(this.schema[key], incoming[key], 'client')){
                    throw new Error(`prepareModelData: Value '${key}:${incoming[key]}' in '${this.constructor.name}' is not '${this.schema[key].type}'`);
                }else{
                    data[key] = incoming[key];
                }
            }         
        }

        //Go through the schema to see any key is missing from data. If yes, then add the key as null
        if(this.schema != null){
            for(let key in this.schema){
                if(!data.hasOwnProperty(key)){
                    if(!this.schema[key].hasOwnProperty('nullable') || !this.schema[key].nullable){
                        throw new Error(`prepareModelData: Key '${key}' in '${this.constructor.name}' is not nullable`);
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
                    data.created_at = (new firebase.firestore.Timestamp(createTime.seconds, createTime.nanos)).toDate();
                    data.updated_at = (new firebase.firestore.Timestamp(updateTime.seconds, updateTime.nanos)).toDate();
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
     * Returns an array of all items in the collection
     * 
     * @return `Promise<array>`
     */
    static all(){
        let queryObj = new Query(this);
        return queryObj.all();        
    }

    /**
     * Queries the database against the provided condition
     * @param {string} field 
     * @param {string} sign 
     * @param {*} value 
     * 
     * @returns `Promise<FirestoreModel.Query>`
     */
    static where(field, sign, value){
        let queryObj = new Query(this);
        return queryObj.where(field, sign, value);
    }

    /**
     * Finds data by its id
     * @param {*} id 
     */
    static find(id){
        let queryObj = new Query(this);
        return queryObj.find(id);
    }

    static compareSchemaWithDataForDatabase(schema, incomingData){
        let data = {};
        if(schema != null){
            for(let key in schema){
                if(
                    !schema[key].nullable && 
                    (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)
                ){
                    throw new Error(`Key '${key}' in '${this.name}' is not nullable`);
                }
                else if(schema[key].nullable && (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)){
                    data[key] = null;
                }
                else if(!this.checkSchemaType(schema[key], incomingData[key], 'server')){
                    throw new Error(`compareSchemaWithDataForDatabase: Value '${key}:${incomingData[key]}' in '${this.name}' is not '${schema[key].type}'`);
                }else{
                    data[key] = incomingData[key];
                }
            }
        }
        return data;
    }


    static prepareDataForDatabase(incomingData){
        for(let key in incomingData){
            if(typeof incomingData[key] == 'object' && incomingData[key] != null && incomingData[key] != undefined){
                
                if(incomingData[key].constructor.name == "Date"){
                    incomingData[key] = firebase.firestore.Timestamp.fromDate(incomingData[key]);
                }

                //Include other types...


            }
        }
        return incomingData;
    }

    /**
     * Updates database with new data
     * @param {object} newData 
     */
    async update(newData){

        let data = this.compareSchemaWithDataForDatabase(this.schema, newData);
        let query = await this.constructor.find(this.data.id);
        const update = await query.update(this.constructor.prepareDataForDatabase(data));
        if(update){
            for(const prop in data){
                this.data[prop] = data[prop];
            }
        }
        return this;
    }

    /**
     * Queries all data from database
     */
    static whereAll(){
        let queryObj = new Query(this);
        return queryObj.whereAll();
    }

    /**
     * Creates a new registry in the database
     * @param {object} newData 
     */
    static async createNew(newData){

        let data = this.compareSchemaWithDataForDatabase(this.getConfig().schema, newData);
        let queryObj = new Query(this);
        return await queryObj.insert(this.prepareDataForDatabase(data));
    }

    /**
     * Returns the number of documents inside the collection
     * 
     * @returns int
     */
    static async count(){
        let query = await this.whereAll();
        query = query.getQuery();
        query = await query.get();
        return query.size;
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