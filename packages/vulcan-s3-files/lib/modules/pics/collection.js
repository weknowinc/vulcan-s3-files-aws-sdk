/*

The main Pics collection definition file.

*/

import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import schema from './schema.js';
import './fragments.js';
import './permissions.js';

import { Meteor } from 'meteor/meteor';

const Pics = createCollection({

  collectionName: 'Pics',

  typeName: 'Pic',

  schema,

  resolvers: getDefaultResolvers('Pics'),

  mutations: getDefaultMutations('Pics'),

});

/*

Set a default results view whenever the Pics collection is queried:

- Pics are sorted by their createdAt timestamp in descending order

*/

Pics.allow({
  update: function(userId) {
    // Make sure the user is logged in before inserting a task
    if (! userId ) {
      throw new Meteor.Error('not-authorized');
    }

    // add custom authentication code here
    return true;
  }
});

Pics.addDefaultView(terms => {
  return {
    options: {sort: {createdAt: -1}}
  };
});

export default Pics;
