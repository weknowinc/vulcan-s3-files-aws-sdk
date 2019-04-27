import fsCollection from './FSCollection';
import singlePicCollection from './collection';
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
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    control: 'Upload',
    options: {collectionName: 'singlePic', picCollection: singlePicCollection, fsCollection: fsCollection, accept:"image/*"},
    resolveAs: {
      fieldName: 'imageUrl',
      type: 'String',
      resolver: async (singlePic) => {
        if (!singlePic.imageId) return null;
        const pic = await fsCollection.loader.load(singlePic.imageId);
        return pic ? fsCollection.link(pic) : null;
      },
      addOriginalField: true
    },
  },
};

export default schema;
