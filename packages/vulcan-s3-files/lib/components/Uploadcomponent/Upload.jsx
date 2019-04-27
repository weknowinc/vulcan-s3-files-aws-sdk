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
import _includes from 'lodash/includes';

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
                            {_includes(['image/*', '.jpg', '.jpeg', '.png'], this.props.accept) ?
                                <img style={{width: 150}} src={image.imageUrl || image.preview} />:
                                <a href={image.imageUrl || image.preview} target={'_blank'}>{image.name || 'file'}</a>
                            }
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
            imageId: null,
            load: true
        };

        this.props.addToSuccessForm(this.successSubmitCalback)
    }

    componentWillReceiveProps(nextProps, nextContext) {
        let collectionName = nextProps.options.collectionName
        let fieldName = nextProps.name

        if(!_isUndefined(nextProps[collectionName]) && !(_isNull(nextProps[collectionName].result[fieldName]) || _isNull(nextProps[collectionName].result.imageUrl)) && this.state.load){
            let document = nextProps[collectionName].result
            let files = [document]
            if(this.enableMultiple()){
                let imageId = document[fieldName]
                let imageUrls = _split(document.imageUrl, ',')

                files = _map(imageId, (imageId, index) => {
                    return {
                        _id: document._id,
                        imageId: imageId,
                        imageUrl: imageUrls[index]
                    }
                })
            }

            this.setState({
                files: files,
                imageId: this.enableMultiple() ? document[fieldName]: [document[fieldName]],
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
            filesToSave: _union(files, this.state.filesToSave),
            files: _union(files, this.state.files)
        });

        this.props.updateCurrentValues({[this.props.name]: this.enableMultiple() ? [files[0].preview]:files[0].preview});
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
            let imageId = this.enableMultiple() ? this.props.document[this.props.name][key] : files[key][this.props.name];
            this.setState({
                filesToDelete: _union(this.state.filesToDelete, [imageId]),
            });

            imagesIdToUpdate = this.enableMultiple() ? this.props.document[this.props.name].filter((id) => this.props.document[this.props.name][key] != id) : imagesIdToUpdate
        }

        this.props.updateCurrentValues({[this.props.name]: imagesIdToUpdate});
        this.setState({
            files: files.filter((id) => files[key] != id)
        })
    };

    //Upload image to s3
    successSubmitCalback = (document) => {
        const {filesToDelete, filesToSave, imageId} = this.state

        S3Service.deleteFSCollectionFile(filesToDelete, this.props.options)
        S3Service.updatePicCollection(filesToSave, filesToDelete, imageId, document, this.props, this.enableMultiple())
    };

    render() {
        const {files} = this.state;
        return (
            <div
                className={`form-group row`}>
                <label className="control-label col-sm-3">{this.props.label}</label>
                <div>
                    <div className="col-sm-9">
                        <div className="upload-field">
                            {this.enableMultiple() || _isEmpty(files) ? <Dropzone
                                multiple={this.enableMultiple()}
                                onDrop={this.onDrop}
                                accept={this.props.options.accept}
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
                                            accept={this.props.options.accept}
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
const getQuery = props => gql`
    {
        ${props.options.collectionName}(input: {selector: {_id: "${props.document._id}"}}){
            result{
                _id
                ${props.name}
                imageUrl
            }
        }
    }
`;

const Upload = (props, context) => {
    return props.formType == "new" ?
        <UploadComponent {...props} {...context}/>
        :
        <Query query={getQuery(props)}>
            {({data}) => <UploadComponent {...data} {...props} {...context}/>}
        </Query>
}

Upload.contextTypes = {
    updateCurrentValues: PropTypes.func,
    addToSuccessForm: PropTypes.func,
};

registerComponent({ name: 'Upload', component: Upload });
