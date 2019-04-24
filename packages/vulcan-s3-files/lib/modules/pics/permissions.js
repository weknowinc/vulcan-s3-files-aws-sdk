/*

Declare permissions for the comments collection.

*/

import Users from 'meteor/vulcan:users';

Users.groups.members.can([
  'pics.new',
  'pics.edit.own',
  'pics.remove.own',
])
