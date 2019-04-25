# Vulcan S3 Files Example

This is an alternative to upload images to amazon s3, based on [Vulcan Files](https://github.com/OrigenStudio/vulcan-files)

The Vulcan Files project is outdated with the current version of Vulcan.js and is not currently working.

## Quick Install

If you already have Meteor up and running, read this section. Otherwise, read the [Complete Install](https://github.com/VulcanJS/Vulcan-Starter#complete-install) section of Vulcan Starter docs.

#### Step 1 - Clone

```
git clone git@github.com:harold20/example-vulcan-s3-files.git
cd example-vulcan-s3-files
```

(or, using `https`: `git clone https://github.com/harold20/example-vulcan-s3-files.git`)

#### Step 2 – Run
```
meteor npm install
meteor npm start
```

## How works

In order to create this implementation function, I have to introduce some changes listed below.

* Implemented the library aws-sdk that enable us to upload files easily.
* Used the `react-dropzone@8.2.0` version.
* Used the `react-apollo` on client to make a query if the item is being edited because the fragment doesn't work on editForm. 
* Implemented a callback to delete an imagen when the item is being deleted.
* Create a FSCollection that implements a collection of `meteor/ostrio:files` to storage the files.
* Create a service that has the methods to upload and delete files when the item is being created or updated.
* Assign by schema the collections to use on upload component as FSCollection and the PicCollection.
* Refactor the upload component to work properly.

### Next steps
* Figure out how resolve a field as an array.
