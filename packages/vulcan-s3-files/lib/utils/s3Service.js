import FilesCollection from '../modules/picsfiles/FSCollection';
import PicCollection from '../modules/pics/collection';

import _isEmpty from 'lodash/isEmpty';
import _each from 'lodash/each';

class S3Service {
    updatePicCollection = (files, document, multiple) => {

        if(_isEmpty(files)){
            return
        }

        let filesIdToSave = []
        _each(files, (file) => {
            let resultInsert = FilesCollection.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic'
            }, true);

            filesIdToSave.push(resultInsert.config.fileId)
        });

        PicCollection.update(
            {
                _id: document._id
            },
            {
                $set: {
                    "imageId": multiple ? filesIdToSave : filesIdToSave[0],
                }
            }
        );
    }

    deleteFSCollectionFile = (files) => {

        if(_isEmpty(files)){
            return
        }

        _each(files, (fileId) => {
            FilesCollection.remove({_id: fileId})
        });
    }
}

export default S3Service = new S3Service();