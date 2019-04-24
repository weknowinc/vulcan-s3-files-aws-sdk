import { addCallback } from 'meteor/vulcan:core';
import FilesCollection from '../modules/picsfiles/FSCollection';

//Load lodash components
import _each from "lodash/each";
import _isArray from "lodash/isArray";

function PicsDelete (pic, user) {
  let files = _isArray(pic.document.imageId) ? pic.document.imageId : [pic.document.imageId]

  _each(files, (fileId) => {
    FilesCollection.remove({_id: fileId})
  });

  return pic;
}
addCallback("pic.delete.async", PicsDelete);
