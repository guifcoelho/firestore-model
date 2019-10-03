module.exports = class HasOne{

    /**
     * Instanciates a HasOne relation
     * @param child_class 
     * @param {array} child_tableParams
     * @param {BaseModel} parent 
     * @param {string} field_in_child_model
     * @param {string} field_in_parent 
     */
    constructor(child_class, child_tableParams = [], parent, field_in_child_model, field_in_parent = null){
        this.child_class = child_class;
        this.child_tableParams = child_tableParams;
        this.parent = parent;
        this.field_in_child_model = field_in_child_model;
        this.field_in_parent = field_in_parent;
    }

    /**
     * Gets the value to be queried for in parent's table
     */
    get valueInParent(){
        return this.field_in_parent ? this.parent.data[this.field_in_parent] : this.parent;
    }
    

    /**
     * Queries child of parent
     * @returns {Query}
     */
    get query(){
        return this.child_class.where(this.field_in_child_model, '==', this.valueInParent, this.child_tableParams);
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
        if(!data.hasOwnProperty(this.field_in_child_model)){
            data[this.field_in_child_model] = this.valueInParent;
        }
        return this.child_class.createNew(data, this.child_tableParams);
    }

};