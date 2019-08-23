import Query from '../Query'

export default class HasMany {

    protected child_class;
    protected parent;
    protected field_in_child_models;
    protected field_in_parent;

    constructor(child_class, parent, field_in_child_models:string, field_in_parent:string = 'ref'){
        
        this.child_class = child_class;
        this.parent = parent;
        this.field_in_child_models = field_in_child_models;
        this.field_in_parent = field_in_parent;
    }

    getValueToQuery():string{
        return this.field_in_parent == 'ref' ? this.parent.getRef() : this.parent.getData()[this.field_in_parent];
    }

    query():Query{
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

    async orderBy(attribute:string, order:string = 'asc'){
        const query = await this.query();
        return await query.orderBy(attribute, order);
    }

};