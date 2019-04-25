/*

Register the GraphQL fragment used to query for data

*/

import {extendFragment, registerFragment} from 'meteor/vulcan:core';

registerFragment(`
  fragment SinglePicFragment on SinglePic {
    _id
    createdAt
    userId
    imageId
    imageUrl
    body
  }
`);
