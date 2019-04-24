/**
 * Stolen from vulcan:forms. Modified to work with GraphQL `File` scalars.
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import 'isomorphic-fetch'; // patch for browser which don't have fetch implemented
import {registerComponent, Components} from 'meteor/vulcan:lib';
import {FormattedMessage} from "meteor/vulcan:i18n";
import Dropzone from 'react-dropzone';
import gql from "graphql-tag";
import { Query } from 'react-apollo';
import S3Service from '../../utils/s3Service.js';

// Load Lodash components
import _isEmpty from 'lodash/isEmpty';
import _isNull from 'lodash/isNull';
import _union from 'lodash/union';
import _map from 'lodash/map';
import _get from 'lodash/get';
import _split from 'lodash/split';
import _isUndefined from 'lodash/isUndefined';

/*
Dropzone styles
*/
const baseStyle = {
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: '10',
    padding: '10',
};
const activeStyle = {
    borderStyle: 'solid',
    borderColor: '#6c6',
    backgroundColor: '#eee',
};
const rejectStyle = {
    borderStyle: 'solid',
    borderColor: '#c66',
    backgroundColor: '#eee',
};

/*
Display a single image
*/
class Image extends PureComponent {
    constructor() {
        super();
    }

    clearImage(key, e) {
        e.preventDefault();
        this.props.clearImage(key);
    }

    render() {
        return (
            _map(this.props.images, (image, index) => {
                return (
                    <div key={index} className={`upload-image`}>
                        <div className="upload-image-contents">
                            <img style={{width: 150}} src={image.imageUrl || image.preview} />
                        </div>
                        <a href="javascript:void(0)" onClick={this.clearImage.bind(this, index)}>
                            <Components.Icon name="close" /> Remove image
                        </a>
                    </div>
                )
            })
        )
    }
}

/*
File Upload component
*/
class UploadComponent extends PureComponent {
    constructor(props, context) {
        super(props, context);
        this.state = {
            filesToSave: [],
            filesToDelete: [],
            files: [],
            load: true
        };

        this.props.addToSuccessForm(this.successSubmitCalback)
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if(!_isUndefined(nextProps.pic) && !(_isNull(nextProps.pic.result.imageId) || _isNull(nextProps.pic.result.imageUrl)) && this.state.load){
            let files = [nextProps.pic.result]
            if(this.enableMultiple()){
                let imageId = nextProps.pic.result.imageId
                let imageUrls = _split(nextProps.pic.result.imageUrl, ',')

                files = _map(imageId, (imageId, index) => {
                    return {
                        _id: nextProps.pic.result._id,
                        body: nextProps.pic.result.body,
                        imageId: imageId,
                        imageUrl: imageUrls[index]
                    }
                })
                console.log('files', files)
            }


            this.setState({
                files: files,
                load: false
            })
        }
    }

    /*
    When an file is uploaded
    */
    onDrop = files => {
        // TODO add max picsfiles
        files =  files.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));

        this.setState({
            filesToSave: files,
            files: files
        });
    };

    /*
    Check the field's type to decide if the component should handle
    multiple file uploads or not
    */
    enableMultiple = () => (
        _get(this.props, 'datatype.definitions[0].type') ||
        _get(this.props, 'datatype[0].type')
    ) === Array;

    /*
    Remove the file at `index` (or just r emove file if no index is passed)
    */
    clearFile = (key) => {
        let files = this.state.files;
        let imagesIdToUpdate = null
        if(this.props.formType === "edit") {
            let imageId = this.enableMultiple() ? this.props.document.imageId[key] : files[key].imageId;
            this.setState({
                filesToDelete: _union(this.state.filesToDelete, [imageId]),
            });

            imagesIdToUpdate = this.enableMultiple() ? this.props.document.imageId.filter((id) => this.props.document.imageId[key] != id) : imagesIdToUpdate

        }

        this.props.updateCurrentValues({[this.props.name]: imagesIdToUpdate});
        this.setState({
            files: files.filter((id) => files[key] != id)
        })
    };

    //Upload image to s3
    successSubmitCalback = (document) => {
        S3Service.deleteFSCollectionFile(this.state.filesToDelete, document)
        S3Service.updatePicCollection(this.state.filesToSave, document, this.enableMultiple())
    };

    render() {
        const {files} = this.state

        return (
            <div
                className={`form-group row`}>
                <label className="control-label col-sm-3">{this.props.label}</label>
                <div>
                    <div className="col-sm-9">
                        <div className="upload-field">
                            {_isEmpty(files) ? <Dropzone
                                multiple={this.enableMultiple()}
                                onDrop={this.onDrop}
                                accept="image/*"
                                className="dropzone-base"
                                activeClassName="dropzone-active"
                                rejectClassName="dropzone-reject"
                            >
                                {({getRootProps, getInputProps, isDragActive, isDragReject}) => {
                                    let styles = {...baseStyle};
                                    styles = isDragActive ? {...styles, ...activeStyle} : styles;
                                    styles = isDragReject ? {...styles, ...rejectStyle} : styles;
                                    return (
                                        <div {...getRootProps()} style={styles}>
                                            <input {...getInputProps()} />
                                            <div>
                                                <FormattedMessage id="upload.prompt" />
                                            </div>
                                        </div>
                                    );
                                }}
                            </Dropzone>: null}

                            {!_isEmpty(files) && (
                                <div className="upload-state">
                                    <div className="upload-images">
                                        <Image
                                            clearImage={this.clearFile}
                                            images={files}
                                            enableMultiple={this.enableMultiple()}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

/*
Get a Query to consult to graphql
*/
const getQuery = imageId => gql`
    {
        pic(input: {selector: {_id: "${imageId}"}}){
            result{
                _id
                body
                imageId
                imageUrl
            }
        }
    }
`;


const Upload = (props, context) => {
    return props.formType == "new" ?
        <UploadComponent {...props} {...context}/>
        :
        <Query query={getQuery(props.document._id)}>
            {({data}) => <UploadComponent {...data} {...props} {...context}/>}
        </Query>
}




Upload.contextTypes = {
    updateCurrentValues: PropTypes.func,
    addToSuccessForm: PropTypes.func,
};

registerComponent({ name: 'Upload', component: Upload });
