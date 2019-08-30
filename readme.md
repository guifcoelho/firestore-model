[![Build Status](https://travis-ci.com/guifcoelho/firestore-model.svg?branch=master)](https://travis-ci.com/guifcoelho/firestore-model)

# Firestore Model

Database models for Firebase Firestore in Javascript. Create model classes with little configuration.

Inspired by Laravel Eloquent.

# Install

npm install @guifcoelho/firestore-model

# Usage

## Configuration

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

## Defining a model class

Create your models like this:

``` js
const database = require('./database.js');
const BaseModel = require('@guifcoelho/firestore-model');

module.exports = class DummyModel extends BaseModel {

    constructor(data){
        const table = "dummy";

        const schema = null

        const timestamps = true;
        
        super(database, table, data, schema, timestamps);
    }
}
```

Remember to instanciate the `database` object and inject it to the class `super(...)` constructor.

You must define the table name, which is the same as your collection path name. For example, for a collection named `users` just use `const table = "users"`. If you want to refer to a collection inside another collection, just do `const table = "collection1/other-colletion/my-collection"`.

If you want, you can define a simple schema for your data. FirestoreModel will look into your defined schema to determine if all attributes in the database have the right types and whether or not they are nullable. Certain types, like Firestore's `DocumentReference` and JS's `Date` will be transformed accordingly.

If one of your document's attributes is a reference to another you can do:

``` js
const database = require('./database.js');
const {DocumentReference} = require('firebase/app').firestore;
const BaseModel = require('@guifcoelho/firestore-model');
const RoleModel = require('./RoleModel.js');

module.exports = class DummyModel extends BaseModel {

    constructor(data){
        const table = "users"
        
        const schema = {
            role: {
                type: DocumentReference, 
                modelClass: RoleModel
            },

            name: {
                type: 'string'
            },

            last_name: {
                nullable: true
            }
        }

        const timestamps = false;

        super(database, table, data, schema, timestamps);
    }
}
```

In that case, FirestoreModel will compare the data from the database with your `schema.type`. If it checks, it will return a `Query` object with the reference to the document. More about `Query` later. Also in the example above, the attribute `name` is defined as `string` (you can assign `string` and `number` for now). Finally, the `last_name` attribute can be of any type and also `null`. In the example, none of the other attributes are nullable.

If you want to have a date attribute, just do:
```js
const squema:{
    my_date: {
        type: Date
    }
}
```
This definition will tell FirestoreModel to transform `firebase.firestore.Timestamp` into `Date` and vice versa. 

With FirestoreModel you do not have to write timestamp fields to your data. Simply use `const timestamps = true`. Setting timestamps to `true` will make FirestoreModel retrieve the document's timestamps and return the `created_at` and `updated_at` properties.

### Relations

You can set up relations with other table using the `hasOne(...)`, `hasMany(...)`, `belongsTo(...)`, `belongsToMany(...)` functions.

#### The `hasMany` relation

Add to your model class:

``` js
//Posts model class
const CommentModel = require('./CommentModel.js');

comments(){
    return this.hasMany(
        CommentModel /*The children class constructor*/,
        "post" /*The children attribute pointing to the parent model*/,
        /*The parent model attribute to look for. Default is the document's id, which is the recommended definition*/
    );
}
```

With the above configuration, when you run the `comments()` function FirestoreModel will query the database comments related to the post model.