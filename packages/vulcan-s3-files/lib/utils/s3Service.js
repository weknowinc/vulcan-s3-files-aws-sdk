import _isEmpty from 'lodash/isEmpty';
import _each from 'lodash/each';
import _includes from 'lodash/includes';
import _isNull from 'lodash/isNull';

class S3Service {
    updatePicCollection = (files, filesToDelete, imageId, document, props, multiple) => {

        if(_isEmpty(files)){
            return
        }

        let filesIdToSave = _isNull(imageId) ? [] : imageId.filter((id) => !_includes(filesToDelete, id))
        _each(files, (file) => {
            let resultInsert = props.options.fsCollection.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic'
            }, true);

            filesIdToSave.push(resultInsert.config.fileId)
        });

        props.options.picCollection.default.update(
            {
                _id: document._id
            },
            {
                $set: {
                    [props.name]: multiple ? filesIdToSave : filesIdToSave[0],
                }
            }
        );
    }

    deleteFSCollectionFile = (files, collections) => {

        if(_isEmpty(files)){
            return
        }

        _each(files, (fileId) => {
            collections.fsCollection.remove({_id: fileId})
        });
    }
}

export default S3Service = new S3Service();