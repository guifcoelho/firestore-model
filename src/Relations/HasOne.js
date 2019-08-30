const BaseModel = require('../BaseModel.js');
const Query = require('../Query.js');

module.exports = class HasOne {

    /**
     * Instanciates a HasMany relation
     * @param child_class 
     * @param {BaseModel} parent 
     * @param {string} field_in_child_model
     * @param {string} field_in_parent 
     */
    constructor(child_class, parent, field_in_child_model, field_in_parent = 'ref'){
        this.child_class = child_class;
        this.parent = parent;
        this.field_in_child_model = field_in_child_model;
        this.field_in_parent = field_in_parent;
    }

    /**
     * Gets the value to be queried for in parent's table
     */
    get valueInParent(){
        return this.field_in_parent == 'ref' ? this.parent.DocumentReference : this.parent.data[this.field_in_parent];
    }
    

    /**
     * Queries child of parent
     * @returns {Query}
     */
    get query(){
        return this.child_class.where(this.field_in_child_model, '==', this.valueInParent);
    }

    /**
     * Returns the first item in the query
     */
    first(){
        return this.query.first();
    }

    /**
     * Saves a new child model refering to parent
     * @param {object} data 
     */
    save(data){
        data[this.field_in_child_model] = this.valueInParent;
        return new this.child_class.createNew(data);
    }

};