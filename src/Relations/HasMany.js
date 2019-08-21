module.exports = class HasMany {

    constructor(child_class, parent, field_in_child_models, field_in_parent){
        
        this.child_class = child_class;
        this.parent = parent;
        this.field_in_child_models = field_in_child_models;
        this.field_in_parent = field_in_parent == null ? 'ref' : field_in_parent;
    }

    getValueToQuery(){
        return this.field_in_parent == 'ref' ? this.parent.getRef() : this.parent.getData()[this.field_in_parent];
    }

    query(){
        return this.child_class.where(this.field_in_child_models, '==', this.getValueToQuery());
    }

    async first(){
        const query = await this.query();
        return query.first();
    }

    async get(){
        const query = await this.query();
        return query.get();
    }

    async orderBy(attribute, order = 'asc'){
        const query = await this.query();
        return await query.orderBy(attribute, order);
    }

};