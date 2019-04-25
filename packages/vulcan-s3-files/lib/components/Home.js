/*

Show a list of all reviews

http://docs.vulcanjs.org/core-components.html#Datatable

*/

import React from 'react';
import {
  Components,
  registerComponent,
  withMessages,
} from 'meteor/vulcan:core';
import SinglePic from "../modules/singlePic/collection";
import MultiplePics from "../modules/multiplePics/collection";

const Home = () => (
  <div className="dashboard">
    <Components.FlashMessages />

    <div
      style={{
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: '1px solid #ccc',
      }}
    >
      <Components.AccountsLoginForm />
    </div>

    <Components.Datatable
        collection={SinglePic}
        columns={['_id', 'imageId', 'body', 'imageUrl']}
        emptyState={<p className="datatable-empty">No single pic to display</p>}
        options={{
            fragmentName: 'SinglePicFragment',
            limit: 20
        }}
        editFormOptions={{data: 'hola'}}
    />

    <Components.Datatable
        collection={MultiplePics}
        columns={['_id', 'imageId', 'body', 'imageUrl']}
        emptyState={<p className="datatable-empty">No multiple pics to display</p>}
        options={{
            fragmentName: 'MultiplePicsFragment',
            limit: 20
        }}
        editFormOptions={{data: 'hola'}}
    />
  </div>
);

registerComponent({ name: 'Home', component: Home, hocs: [withMessages] });
