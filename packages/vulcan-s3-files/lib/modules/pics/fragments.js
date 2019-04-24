/*

Register the GraphQL fragment used to query for data

*/

import {extendFragment, registerFragment} from 'meteor/vulcan:core';

registerFragment(`
  fragment PicsFragment on Pic {
    _id
    createdAt
    userId
    imageId
    imageUrl
    body
  }
`);
