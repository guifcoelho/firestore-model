let firebase;
if(!process.hasOwnProperty('firebase')){
    firebase = require('firebase/app');
    require('firebase/firestore');
}
const firestoreNamespaces = process.hasOwnProperty('firestoreNamespaces') ? process.firestoreNamespaces : firebase.firestore;

const {DocumentReference} = firestoreNamespaces;
const FirestoreQuery = firestoreNamespaces.Query;

module.exports = class Query {

    /**
     * Instanciates a new Query object
     * @param {*} model_class Instance of `BaseModel`
     * @param {*} query
     * @param {array} tableParams
     */
    constructor(model_class, query = null, tableParams = []){
        this.model = new model_class().at(tableParams);
        this.tableParams = tableParams;
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
            this.query = this.model.at(this.tableParams).collection.where(field, sign, value);
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
        this.query = this.model.at(this.tableParams).collection.doc(id);
        return this;
    }

    /**
     * Queries the database for all data
     * 
     * @returns `FirestoreModel.Query`
     */
    whereAll(){
        this.query = this.model.at(this.tableParams).collection;
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
                model = new self.model_class(snap).at(this.model.tableParams);
            }
        }else{  
            await this.query.limit(1).get()
                .then(snap=>{
                    snap.forEach(async el=>{
                        model = new self.model_class(el).at(this.model.tableParams);
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
        return querySnap.docs.map(docSnap => new this.model_class(docSnap).at(this.model.tableParams));
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
                return new model_class(docSnap).at(this.model.tableParams);
            });
        }
        const docRef = await collection.add(data);
        const docSnap = await docRef.get();
        return new model_class(docSnap).at(this.model.tableParams);
    }

    /**
     * Sets a new document on the database by id
     * @param {string|number} docId 
     * @param {object} data 
     */
    async setById(docId, data){
        const collection = this.model.collection;
        await collection.doc(docId).set(data);
        return this.find(docId).first();
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
                    querySnap.docs.map(docSnap => {
                        const item = new this.model_class(docSnap).at(this.model.tableParams);
                        item.delete();
                    })
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
     * @param {*} startAfter The 'startAfter' cursor
     * @param {*} endBefore The 'endBefore' cursor
     */
    async paginate(quantity = 5, startAfter = null, endBefore = null){
        if(startAfter == null && endBefore == null){
            return this.limit(quantity).get();
        }else{
            const BaseModel = require('./BaseModel.js');
            startAfter = typeof startAfter == 'object' && startAfter instanceof BaseModel ? await startAfter.DocumentReference.get() : startAfter;
            endBefore = typeof endBefore == 'object' && endBefore instanceof BaseModel ? await endBefore.DocumentReference.get() : endBefore;
            
            let query = this.limit(quantity).query;
            if(startAfter != null){
                query = query.startAfter(startAfter);
            }
            if(endBefore != null){
                query = query.endBefore(endBefore);
            }
            const querySnap = await query.get();
            return querySnap.docs.map(snap => new this.model_class(snap).at(this.model.tableParams));
        }
    }
};