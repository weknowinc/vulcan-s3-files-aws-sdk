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
        this.props.clearImage(this.props.enableMultiple ? key : this.props.images[key]);
    }

    render() {
        return (
            _map(this.props.enableMultiple ? _split(this.props.images[0].imageUrl, ',') : this.props.images, (image, index) => {
                return (
                    <div key={index} className={`upload-image`}>
                        <div className="upload-image-contents">
                            <img style={{width: 150}} src={this.props.enableMultiple ? image : image.imageUrl || image.preview} />
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
Get a Query to consult to graphql
*/
const getQuery = imageId => {
    return gql`
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
};

/*
File Upload component
*/
class Upload extends PureComponent {
    constructor(props, context) {
        super(props, context);
        this.state = {
            file: [],
            filesToDelete: [],
        };

        this.context.addToSuccessForm(this.successSubmitCalback)
    }

    componentDidMount() {

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
            file: files,
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
    clearFile = (image) => {

        let imagesIdToUpdate = null
        if(this.props.formType === "edit") {
            let imageId = this.enableMultiple() ? this.props.document.imageId[image] : image.imageId;
            this.setState({
                filesToDelete: _union(this.state.filesToDelete, [imageId]),
            });

            imagesIdToUpdate = this.enableMultiple() ? this.props.document.imageId.filter((id) => this.props.document.imageId[image] != id) : imagesIdToUpdate

        }

        this.props.updateCurrentValues({[this.props.name]: imagesIdToUpdate});
        this.setState({file: []})
    };

    //Get images, with or without previews/deleted images
    getImages = (args = {}) => {
        const {includePreviews = true, includeDeleted = false} = args;
        let images = this.state.file;

        // if images is an empty string, null, etc. just return an empty array
        if (!images) {
            return [];
        }

        // if images is not array, make it one (for backwards compatibility)
        if (!Array.isArray(images)) {
            images = [images];
        }
        // remove previews if needed
        images = includePreviews ? images : images.filter(image => !image.preview);
        // remove deleted images
        images = includeDeleted
            ? images
            : images.filter((image, index) => !this.isDeleted(index));
        return images;
    };

    //Upload image to s3
    successSubmitCalback = (document) => {
        S3Service.deleteFSCollectionFile(this.state.filesToDelete, document)
        S3Service.updatePicCollection(this.state.file, document, this.enableMultiple())
    };

    render() {
        const images = this.getImages({includeDeleted: true});

        return (
            <div
                className={`form-group row`}>
                <label className="control-label col-sm-3">{this.props.label}</label>
                <Query query={getQuery(this.props.document._id)}>
                    {({ data }) => {
                        console.log(data)
                        let pic = data;

                        pic = _isEmpty(pic) || _isNull(this.props.document.imageId)? images : [pic.pic.result]

                        console.log("pic", pic)
                        return (
                            <div>
                                <div className="col-sm-9">
                                    <div className="upload-field">
                                        {_isEmpty(pic) ? <Dropzone
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

                                        {!_isEmpty(pic) && (
                                            <div className="upload-state">
                                                <div className="upload-images">
                                                    <Image
                                                        clearImage={this.clearFile}
                                                        images={pic}
                                                        enableMultiple={this.enableMultiple()}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                </Query>

            </div>
        );
    }
}

Upload.contextTypes = {
    updateCurrentValues: PropTypes.func,
    addToSuccessForm: PropTypes.func,
};

registerComponent({ name: 'Upload', component: Upload });
