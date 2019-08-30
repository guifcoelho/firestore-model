const firebase = require('firebase/app');

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
            this.query = this.query.where(field, sign, value);
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
     * Returns the number of documents inside the collection
     * 
     * @returns {Promise<number>}
     */
    async count(){
        const querySnap = await this.query.get();
        return querySnap.size;
    }

    /**
     * Returns all data from the database table
     */
    async all(){
        let arrayOfModels = [];
        const self = this;
        await model.collection
            .get()
            .then(query=>{
                query.forEach(async el=>{
                    arrayOfModels.push(new self.model_class(el));
                });
            });
        return arrayOfModels;
    }

    /**
     * Returns the first model from the query
     */
    async first(){
        let model = null;
        const self = this;
        if(this.query instanceof firebase.firestore.DocumentReference){
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
        let arrayOfModels = [];
        let self = this;
        await this.query.get()
            .then(query=>{
                query.forEach(async el=>{
                    arrayOfModels.push(new self.model_class(el));
                });
            });
        return arrayOfModels;
    }

    /**
     * Orders the results
     * @param {string} attribute 
     * @param {string} order 
     */
    async orderBy(attribute, order = 'asc'){
        this.query = await this.query.orderBy(attribute, order);
        return this;
    }

    /**
     * Limits the query for the given quantity
     * @param {number} quantity 
     */
    async limit(quantity){
        this.query = await this.query.limit(quantity);
        return this;
    }

    /**
     * Returns the number of documents inside the collection
     * 
     * @returns {number}
     */
    async count(){
        if(this.query instanceof firebase.firestore.Query){
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
            if(this.query instanceof firebase.firestore.DocumentReference){
                await this.query.delete();
            }else{
                const querySnap = await this.query.get();
                await Promise.all(
                    querySnap.docs.map(item=>{
                        item.ref.delete();
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
};