const BaseModel = require('../BaseModel.js');
const HasOne = require('./HasOne.js');

module.exports = class HasMany extends HasOne {

    /**
     * Instanciates a HasMany relation
     * @param child_class 
     * @param {BaseModel} parent 
     * @param {string} field_in_child_models 
     * @param {string} field_in_parent 
     */
    constructor(child_class, parent, field_in_child_models, field_in_parent = 'DocumentReference'){
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

};