/*

Register the GraphQL fragment used to query for data

*/

import {extendFragment, registerFragment} from 'meteor/vulcan:core';

registerFragment(`
  fragment MultiplePicsFragment on MultiplePic {
    _id
    createdAt
    userId
    imageId
    imageUrl
    body
  }
`);
