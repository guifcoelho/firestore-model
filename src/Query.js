module.exports = class Query {

    /**
     * Instanciates a new Query object
     * @param {*} model_class Instance of `BaseModel`
     */
    constructor(model_class){
        this.model = new model_class();
        this.model_class = model_class;
        this.query = null;
    }

    /**
     * Returns the Firestore query instance
     */
    getQuery(){
        return this.query;
    }

    /**
     * Queries the database with the provided condition
     * @param {string} field 
     * @param {string} sign 
     * @param {*} value 
     */
    async where(field, sign, value){
        if(this.query == null){
            this.query = await this.model.getCollection().where(field, sign, value);
        }else{
            this.query = await this.query.where(field, sign, value);
        }
        return this;
    }

    async find(id){
        this.query = await this.model.getCollection().doc(id);
        return this;
    }

    /**
     * Queries the database for all data
     * 
     * @returns `FirestoreModel.Query`
     */
    async whereAll(){
        this.query = await this.model.getCollection();
        return this;
    }

    /**
     * Returns all data from the database table
     */
    async all(){
        let arrayOfModels = [];
        const self = this;
        await (new this.model_class()).getCollection()
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
        if(this.query.constructor.name == 'DocumentReference'){
            const doc = await this.query.get();
            model = new self.model_class(doc);
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
     * @param {integer} quantity 
     */
    async limit(quantity){
        this.query = await this.query.limit(quantity);
        return this;
    }

    /**
     * Returns the number of documents inside the collection
     * 
     * @returns int
     */
    count(){
        return this.query.size;
    }

    /**
     * Inserts an element or collection to the database
     * @param {*} data 
     */
    async insert(data){
        if(Array.isArray(data)){
            const self = this;
            return data.map(async item=>{
                const docRef = await self.model.getCollection().add(item);
                const docSnap = await docRef.get();
                let model = new self.model_class();
                return model.fill(docSnap);  
            })
        }
        const docRef = await this.model.getCollection().add(data);
        const docSnap = await docRef.get();
        let model = new this.model_class();
        return model.fill(docSnap);
    }

    /**
     * Deletes all documents from query
     */
    async delete(){
        let error = null;
        if(this.query.constructor.name == 'DocumentReference'){
            await this.query.delete().catch(e => error = e);
        }else{
            const querySnap = await this.query.get();
            return await Promise.all(
                querySnap.forEach(el=>{
                    el.delete();
                })
            );
        }
        return error == null;
    }

    async update(newData){
        let error = null;
        await this.query.update(newData).catch(e=>error = e);
        return error == null;
    }
};