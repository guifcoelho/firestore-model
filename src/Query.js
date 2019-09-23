const firebase = process.hasOwnProperty('firebase') ? process.firebase : require('firebase/app');
require('firebase/firestore');
const {DocumentReference} = firebase.firestore;
const FirestoreQuery = firebase.firestore.Query;

module.exports = class Query {

    /**
     * Instanciates a new Query object
     * @param {*} model_class Instance of `BaseModel`
     */
    constructor(model_class, query = null){
        this.model = new model_class();
        this.model_class = model_class;
        this.query = query;
    }

    /**
     * Queries the database with the provided condition
     * @param {string} field 
     * @param {string} sign 
     * @param {*} value 
     */
    where(field, sign, value){
        if(this.query == null){
            this.query = this.model.collection.where(field, sign, value);
        }else{
            let data = {};
            data[field] = value;
            const preparedData = this.model_class.prepareDataForDatabase(data);
            this.query = this.query.where(field, sign, preparedData[field]);
        }
        return this;
    }

    /**
     * Search for a document with the given id
     * @param {string|number} id 
     */
    find(id){
        this.query = this.model.collection.doc(id);
        return this;
    }

    /**
     * Queries the database for all data
     * 
     * @returns `FirestoreModel.Query`
     */
    whereAll(){
        this.query = this.model.collection;
        return this;
    }

    /**
     * Returns all data from the database table
     */
    async all(){
        return await this.whereAll().get();
    }

    /**
     * Returns the first model from the query
     */
    async first(){
        let model = null;
        const self = this;
        if(this.query instanceof DocumentReference){
            const snap = await this.query.get();
            if(snap.exists){
                model = new self.model_class(snap);
            }
        }else{  
            await this.query.limit(1).get()
                .then(snap=>{
                    snap.forEach(async el=>{
                        model = new self.model_class(el);
                    });
                });
        }
        
        return model;
    }

    /**
     * Returns an array of models after querying
     */
    async get(){
        const querySnap = await this.query.get();
        return querySnap.docs.map(docSnap => new this.model_class(docSnap));
    }

    /**
     * Orders the results
     * @param {string} attribute 
     * @param {string} order 
     */
    orderBy(attribute, order = 'asc'){
        this.query = this.query.orderBy(attribute, order);
        return this;
    }

    /**
     * Limits the query for the given quantity
     * @param {number} quantity 
     */
    limit(quantity){
        this.query = this.query.limit(quantity);
        return this;
    }

    /**
     * Returns the number of documents inside the collection
     * 
     * @returns {number}
     */
    async count(){
        if(this.query instanceof FirestoreQuery){
            const querySnap = await this.query.get();
            return querySnap.size;
        }
        return this.query.size;
    }

    /**
     * Inserts an element or collection to the database
     * @param {object|array} data 
     */
    async insert(data){
        const model_class = this.model_class;
        const collection = this.model.collection;
        if(Array.isArray(data)){
            return data.map(async item=>{
                const docRef = await collection.add(item);
                const docSnap = await docRef.get();
                return new model_class(docSnap);
            })
        }
        const docRef = await collection.add(data);
        const docSnap = await docRef.get();
        return new model_class(docSnap);
    }

    /**
     * Deletes all documents from query.
     * @returns {boolean}
     */
    async delete(){
        try{
            if(this.query instanceof DocumentReference){
                await this.query.delete();
            }else{
                const querySnap = await this.query.get();
                await Promise.all(
                    querySnap.docs.map(item=>item.ref.delete())
                );
            }
            return true;
        }catch(e){
            return false;
        }
    }

    /**
     * Updates a document with new data
     * @param {*} newData 
     * @returns {boolean}
     */
    async update(newData){
        try{
            await this.query.update(newData);
            return true;
        }catch(e){
            return false;
        }
    }

    /**
     * Paginates the a database query
     * @param {int} quantity Number of items to paginate
     * @param {BaseModel} cursor Model object to paginate from
     */
    async paginate(quantity = 5, cursor = null){
        const BaseModel = require('./BaseModel.js');
        if(cursor != null && !(cursor instanceof BaseModel)){
            throw new Error("Paginate cursor must either be 'null' or an instance of 'FirestoreModel.BaseModel'");
        }
        if(cursor == null){
            return this.limit(quantity).get();
        }else{
            const snapshot = await cursor.DocumentReference.get();
            const querySnap = await this.limit(quantity+1).query.startAt(snapshot).get();
            let docs = querySnap.docs;
            docs.shift();
            return docs.map(snap => new this.model_class(snap));
        }
    }
};