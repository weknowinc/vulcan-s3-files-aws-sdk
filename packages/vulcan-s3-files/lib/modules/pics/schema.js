import Picsfiles from '../picsfiles/FSCollection';
import FilesCollection from "meteor/ostrio:files";
import { Promise } from 'meteor/promise';

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
    resolveAs: {
      fieldName: 'imageUrl',
      type: 'String',
      resolver: async (pics) => {
        if (!pics.imageId) return null;
        const pic = await Picsfiles.loader.load(pics.imageId);
        return pic ? Picsfiles.link(pic) : null;
      },
      addOriginalField: true
    },
  },

  // imageId: {
  //   label: 'Image',
  //   type: Array,
  //   optional: true,
  //   canRead: ['guests'],
  //   canUpdate: ['members'],
  //   canCreate: ['members'],
  //   control: 'Upload',
  //   resolveAs: {
  //     fieldName: 'imageUrl',
  //     type: 'String',
  //     resolver: async (pics) => {
  //       if (!pics.imageId) return null;
  //       let picList = []
  //
  //       // let picList = await Promise.all(_map(pics.imageId, addEnabledProperty));
  //
  //        await _each(pics.imageId, (fileId) => {
  //         // console.log('fileId', fileId)
  //         const pic =  Picsfiles.loader.load(fileId);
  //         // console.log('pic', pic)
  //         // let test = Picsfiles.link(pic)
  //         // console.log('test', test)
  //         picList.push(pic)
  //
  //       });
  //
  //      await _each(picList, (pic, index) => {
  //
  //         pic.then(function(value) {
  //           let link = Picsfiles.link(value)
  //           console.log('value', value);
  //           console.log('link', link);
  //           picList[index] = link
  //           // expected output: 123
  //         });
  //       });
  //       console.log('picList', picList)
  //       // const pic = await Picsfiles.loader.load(pics.imageId);
  //       console.log('resolver', pics)
  //       // return pic ? Picsfiles.link(pic) : null;
  //       return picList.toString();
  //       },
  //     addOriginalField: true
  //   },
  // },
  // 'imageId.$': {type: String},
};

export default schema;
