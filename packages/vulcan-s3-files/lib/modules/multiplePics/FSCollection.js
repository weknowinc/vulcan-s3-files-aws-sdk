import { FilesCollection } from 'meteor/ostrio:files';
import SimpleSchema from 'simpl-schema';
import { GraphQLSchema } from 'meteor/vulcan:lib';
import DataLoader from 'dataloader/index';
import stream from 'stream';
import { getSetting } from 'meteor/vulcan:core';
import S3 from 'aws-sdk/clients/s3'; /* http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html */
/* See fs-extra and graceful-fs NPM packages */
/* For better i/o performance */
import fs from 'fs';
import _each from 'lodash/each';

const bound  = Meteor.bindEnvironment((callback) => {
    return callback();
});

const region = getSetting('amazonAWSS3.mainBucket.client.region');
const accessKey = getSetting('amazonAWSS3.mainBucket.client.key');
const secret = getSetting('amazonAWSS3.mainBucket.client.secret');
const bucket = getSetting('amazonAWSS3.mainBucket.client.bucket');

/* Check settings existence in `Meteor.settings` */
/* This is the best practice for app security */
// Create a new S3 object
const s3 = new S3({
    secretAccessKey: secret,
    accessKeyId: accessKey,
    region: region,
    // sslEnabled: true, // optional
    httpOptions: {
        timeout: 6000,
        agent: false
    }
});


const MultiplePics = new FilesCollection({
    collectionName: 'multiplePics',
    onAfterUpload(fileRef) {
        // Run through each of the uploaded file
        _each(fileRef.versions, (vRef, version) => {
            // We use Random.id() instead of real file's _id
            // to secure multiplePics from reverse engineering on the AWS client
            const filePath = 'multiplePics/' + (Random.id()) + '-' + version + '.' + fileRef.extension;

            // Create the AWS:S3 object.
            // Feel free to change the storage class from, see the documentation,
            // `STANDARD_IA` is the best deal for low access multiplePics.
            // Key is the file name we are creating on AWS:S3, so it will be like multiplePics/XXXXXXXXXXXXXXXXX-original.XXXX
            // Body is the file stream we are sending to AWS
            s3.putObject({
                StorageClass: 'STANDARD',
                Bucket: bucket,
                Key: filePath,
                Body: fs.createReadStream(vRef.path),
                ContentType: vRef.type,
            }, (error) => {
                bound(() => {
                    if (error) {
                        console.error(error);
                    } else {
                        // Update FilesCollection with link to the file at AWS
                        const upd = { $set: {} };
                        upd['$set']['versions.' + version + '.meta.pipePath'] = filePath;

                        this.collection.update({
                            _id: fileRef._id
                        }, upd, (updError) => {
                            if (updError) {
                                console.error(updError);
                            } else {
                                // Unlink original multiplePics from FS after successful upload to AWS:S3
                                this.unlink(this.collection.findOne(fileRef._id), version);
                            }
                        });
                    }
                });
            });
        });
    },

    // Intercept access to the file
    // And redirect request to AWS:S3
    interceptDownload(http, fileRef, version) {
        let path;

        if (fileRef && fileRef.versions && fileRef.versions[version] && fileRef.versions[version].meta && fileRef.versions[version].meta.pipePath) {
            path = fileRef.versions[version].meta.pipePath;
        }

        if (path) {
            // If file is successfully moved to AWS:S3
            // We will pipe request to AWS:S3
            // So, original link will stay always secure

            // To force ?play and ?download parameters
            // and to keep original file name, content-type,
            // content-disposition, chunked "streaming" and cache-control
            // we're using low-level .serve() method
            const opts = {
                Bucket: bucket,
                Key: path
            };

            if (http.request.headers.range) {
                const vRef  = fileRef.versions[version];
                let range   = _.clone(http.request.headers.range);
                const array = range.split(/bytes=([0-9]*)-([0-9]*)/);
                const start = parseInt(array[1]);
                let end     = parseInt(array[2]);
                if (isNaN(end)) {
                    // Request data from AWS:S3 by small chunks
                    end       = (start + this.chunkSize) - 1;
                    if (end >= vRef.size) {
                        end     = vRef.size - 1;
                    }
                }
                opts.Range   = `bytes=${start}-${end}`;
                http.request.headers.range = `bytes=${start}-${end}`;
            }

            const fileColl = this;
            s3.getObject(opts, function (error) {
                if (error) {
                    console.error(error);
                    if (!http.response.finished) {
                        http.response.end();
                    }
                } else {
                    if (http.request.headers.range && this.httpResponse.headers['content-range']) {
                        // Set proper range header in according to what is returned from AWS:S3
                        http.request.headers.range = this.httpResponse.headers['content-range'].split('/')[0].replace('bytes ', 'bytes=');
                    }

                    const dataStream = new stream.PassThrough();
                    fileColl.serve(http, fileRef, fileRef.versions[version], version, dataStream);
                    dataStream.end(this.data.Body);
                }
            });

            return true;
        }
        // While file is not yet uploaded to AWS:S3
        // It will be served file from FS
        return false;
    }
});

// Intercept FilesCollection's remove method to remove file from AWS:S3
const _origRemove = MultiplePics.remove;
MultiplePics.remove = function (search) {
    const cursor = this.collection.find(search);
    cursor.forEach((fileRef) => {
        _each(fileRef.versions, (vRef) => {
            if (vRef && vRef.meta && vRef.meta.pipePath) {
                // Remove the object from AWS:S3 first, then we will call the original FilesCollection remove
                s3.deleteObject({
                    Bucket: bucket,
                    Key: vRef.meta.pipePath,
                }, (error) => {
                    bound(() => {
                        if (error) {
                            console.error(error);
                        }
                    });
                });
            }
        });
    });

    //remove original file from database
    _origRemove.call(this, search);
};

MultiplePics.collection.attachSchema(new SimpleSchema(MultiplePics.schema));

MultiplePics.loader = new DataLoader(async ids => {
    const documents = MultiplePics.find({ _id: { $in: ids } }).fetch();
    return ids.map(id => documents.find(doc => doc._id === id));
});

GraphQLSchema.addToContext({ ['multiplePics']: MultiplePics });


export default MultiplePics;
