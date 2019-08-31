[![Build Status](https://travis-ci.com/guifcoelho/firestore-model.svg?branch=master)](https://travis-ci.com/guifcoelho/firestore-model)

<h1>Firestore Model</h1>

Database models for Firebase Firestore in Javascript. Create model classes with little configuration.

Highly inspired by [Laravel Eloquent](https://laravel.com/docs/master/eloquent).

<h1>Table of contents</h1>

- [Install](#install)
- [Configuration](#configuration)
- [Defining a model class](#defining-a-model-class)

# Install

npm install @guifcoelho/firestore-model

# Configuration

Create a script to initilize Firebase and export it.

``` js
//database.js

const firebase = require('firebase/app');
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: // The api key,
        authDomain: // The auth domain,
        projectId: // the project id
    });
}
module.exports = firebase.firestore();
```

# Defining a model class

Create your models like this:

``` js
const database = require('./database.js');
const BaseModel = require('@guifcoelho/firestore-model');

module.exports = class DummyModel extends BaseModel {
    constructor(data){
        const table = "dummy";
        super(database, table, data, options);
    }
}
```

Remember to instanciate the `database` object and inject it to the class's `super(...)` constructor.

You must define the table name, which is the same as your collection path name. For example, for a collection named `users` just use `const table = "users"`. If you want to refer to a collection inside another collection, just do `const table = "collection1/other-colletion/my-collection"`.

If you want, you can define some schema for your data. FirestoreModel will look into your defined schema to determine if all attributes in the database have the right types and whether or not they are nullable. For example:

``` js
const database = require('./database.js');
const BaseModel = require('@guifcoelho/firestore-model');
const RoleModel = require('./RoleModel.js');

module.exports = class DummyModel extends BaseModel {
    constructor(data){
        const table = "users"
        const options = {
            schema = {
                role: { type: RoleModel },
                name: { type: 'string' },
                last_name: { nullable: true }
            },
            timestamps: false
        }
        super(database, table, data, options);
    }
}
```

In that case, FirestoreModel will compare the data from the database with your `schema.type`.

If your attribute is stored as a `firebase.firestore.DocumentReference` you might pass the related FirestoreModel class as its type. If it checks out, a `Query` object will be returned with the reference to the document. More about `Query` later.

Also in the example above, the attribute `name` is defined as `string` (you can assign `string` and `number` for now). Finally, the `last_name` attribute can be of any type and also `null`. In the example, none of the other attributes are nullable.

If you want to require an attribute but not a type, just leave an empty property.

If you want to have a date attribute, just do `options.schema.my_attribute.type = Date`. If your attribute is stored as `firebase.firestore.Timestamp`, it will be converted as `Date`.

With FirestoreModel you do not have to write timestamp fields to your data. Simply use `options.timestamps = true`. Setting timestamps to `true` will make FirestoreModel retrieve the document's timestamps and return the `created_at` and `updated_at` properties.

See below the BaseModel constructor's properties:

- table: `string`
- options: `object`
  - schema
    - type: Tested for `string`, `number`, `Date`, `BaseModel` derivates or empty. Also, JS's basic types and Firestore object's types
    - nullable: boolean
  - timestamps: boolean

<!-- # Relations

You can set up relations with other tables using the `hasOne(...)`, `hasMany(...)`, `belongsTo(...)`, `belongsToMany(...)` functions.

## The `hasOne` relation

Add to your model class:

``` js
//Posts model class
const UniqueItemModel = require('./UniqueItemModel.js');

item(){
    return this.hasOne(
        UniqueItemModel /*The child class constructor*/,
        "owner" /*The child's attribute pointing to the parent model*/,
        "DocumentReference" /*The parent model's attribute name to look for. The default is its DocumentReference, which is the recommended definition. Therefore, just leave it blank. */
    );
}
```

## The `hasMany` relation

Add to your model class:

``` js
//Posts model class
const CommentModel = require('./CommentModel.js');

comments(){
    return this.hasMany(
        CommentModel /*The children class constructor*/,
        "post" /*The children's attribute pointing to the parent model*/,
        "DocumentReference" /*The parent model's attribute name to look for. The default is its DocumentReference, which is the recommended definition. Therefore, just leave it blank. */
    );
}
``` -->