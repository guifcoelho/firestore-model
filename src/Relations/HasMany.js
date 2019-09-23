const HasOne = require('./HasOne.js');

module.exports = class HasManyRelation extends HasOne {

    /**
     * Instanciates a HasMany relation
     * @param child_class 
     * @param {BaseModel} parent 
     * @param {string} field_in_child_models 
     * @param {string} field_in_parent 
     */
    constructor(child_class, parent, field_in_child_models, field_in_parent = null){
        super(child_class, parent, field_in_child_models, field_in_parent);
    }

    /**
     * Returns an array of models
     */
    get(){
        return this.query.get();
    }

    /**
     * Orders the query
     * @param {*} attribute 
     * @param {string} order 
     */
    orderBy(attribute, order = 'asc'){
        return this.query.orderBy(attribute, order);
    }

    /**
     * Limits the query for the given quantity
     * @param {number} quantity 
     */
    limit(quantity = 1){
        return this.query.limit(quantity);
    }

    /**
     * Returns the number of documents inside the collection
     * 
     * @returns {number}
     */
    count(){
        return this.query.count();
    }

    /**
     * Paginates the a database query
     * @param {int} quantity Number of items to paginate
     * @param {BaseModel} cursor Model object to paginate from
     */
    paginate(quantity = 5, cursor = null){
        return this.query.paginate(quantity = 5, cursor = null);
    }
};