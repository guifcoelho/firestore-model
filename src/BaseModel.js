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
     */
    constructor(firebase, table, data = null, schema = null, timestamps = false){
        this.firebase = firebase;
        this.table = table;
        this.schema = schema;
        this.timestamps = timestamps;
        if(data != null){
            this.fill(data);
        }
    }

    /**
     * Return the model's collection reference
     */
    static get collection(){
        const instance = new this();
        return instance.firebase.firestore().collection(instance.table);
    }

    /**
     * Return the model's configuration
     */
    static get config(){
        const instance = new this();
        return {
            table: instance.table,
            schema: instance.schema,
            timestamps: instance.timestamps,
            //Add others...
        }
    }

    /**
     * Returns the documento reference from Firestore
     * 
     * @returns `firebase.firestore.DocumentReference`
     */
    get ref(){
        return this.collection.doc(this.data.id);
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

        const modelClass = this.constructor;
        if(modelClass.compareSchemaWithData(modelClass.config, data, 'client')){
            this.data = data;
        }
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
     * Returns an array of all items in the collection
     * 
     * @return `Promise<array>`
     */
    static all(){
        return (new Query(this)).all();
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
        return (new Query(this)).where(field, sign, value);
    }

    /**
     * Finds data by its id
     * @param {*} id 
     */
    static find(id){
        return new Query(this).find(id);
    }

    static compareSchemaWithData(config, incomingData, client_server_any = "any"){
        let data = {};
        const schema = config.schema;
        const table = config.table;
        if(schema != null){
            for(let key in schema){
                if(
                    !schema[key].nullable && 
                    (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)
                ){
                    throw new Error(`Key '${key}' in '${table}' is not nullable`);
                }
                else if(schema[key].nullable && (!incomingData.hasOwnProperty(key) || incomingData[key] == null || incomingData[key] == undefined)){
                    data[key] = null;
                }
                else if(!this.checkSchemaType(schema[key], incomingData[key], client_server_any)){
                    throw new Error(`compareSchemaWithData: Value '${key}:${incomingData[key]}' in '${table}' is not '${schema[key].type}'`);
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
                    incomingData[key] = this.firebase.firestore.Timestamp.fromDate(incomingData[key]);
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
        const modelClass = this.constructor;
        newData = modelClass.compareSchemaWithData(modelClass.config, newData, 'server');
        let query = await modelClass.find(this.data.id);
        const update = await query.update(modelClass.prepareDataForDatabase(newData));
        if(update){
            return new modelClass({
                id: this.data.id,
                ...newData
            });
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
     */
    static async createNew(newData){
        newData = this.compareSchemaWithData(this.config.schema, newData, 'server');
        return await (new Query(this)).insert(this.prepareDataForDatabase(newData));
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