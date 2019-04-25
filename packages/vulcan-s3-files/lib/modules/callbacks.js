import { addCallback } from 'meteor/vulcan:core';
import MultipleFilesCollection from './multiplePics/FSCollection';
import SingleFilesCollection from './singlePic/FSCollection';

//Load lodash components
import _each from "lodash/each";
import _isArray from "lodash/isArray";

function SinglePicDelete (pic, user) {
  let files = _isArray(pic.document.imageId) ? pic.document.imageId : [pic.document.imageId]

  _each(files, (fileId) => {
    SingleFilesCollection.remove({_id: fileId})
  });

  return pic;
}
addCallback("singlepic.delete.async", SinglePicDelete);

function MultiplePicsDelete (pic, user) {
  let files = _isArray(pic.document.imageId) ? pic.document.imageId : [pic.document.imageId]

  _each(files, (fileId) => {
    MultipleFilesCollection.remove({_id: fileId})
  });

  return pic;
}
addCallback("multiplepic.delete.async", MultiplePicsDelete);
