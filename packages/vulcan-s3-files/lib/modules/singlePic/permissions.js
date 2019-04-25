/*

Declare permissions for the comments collection.

*/

import Users from 'meteor/vulcan:users';

Users.groups.members.can([
  'singlePic.new',
  'singlePic.edit.own',
  'singlePic.remove.own',
])
