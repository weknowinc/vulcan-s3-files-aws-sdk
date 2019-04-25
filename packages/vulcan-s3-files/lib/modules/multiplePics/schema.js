import fsCollection from './FSCollection';
import multipleCollection from './collection';
//Load lodash component
import _each from "lodash/each";
import _map from "lodash/map";

const schema = {
  _id: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => {
      return new Date();
    }
  },
  userId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver(pic, args, context) {
        return context.Users.findOne({ _id: pic.userId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users) });
      },
      addOriginalField: true
    }
  },

  body: {
    label: 'Body',
    type: String,
    optional: true,
    control: 'textarea', // use a textarea form component
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
  },

  imageId: {
    label: 'Image',
    type: Array,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    control: 'Upload',
    options: {collectionName: 'multiplePic', picCollection: multipleCollection, fsCollection: fsCollection},
    resolveAs: {
      fieldName: 'imageUrl',
      type: 'String',
      resolver: async (pics) => {
        if (!pics.imageId) return null;
        let picList = []

        await _each(pics.imageId, (fileId) => {
          const pic =  fsCollection.loader.load(fileId);
          picList.push(pic)

        });

        await _each(picList, (pic, index) => {

          pic.then(function(value) {
            let link = fsCollection.link(value)
            // console.log('value', value);
            // console.log('link', link);
            picList[index] = link
          });
        });
        // console.log('picList', picList)
        // console.log('resolver', pics)
        return picList.toString();
      },
      addOriginalField: true
    },
  },
  'imageId.$': {type: String},
};

export default schema;
