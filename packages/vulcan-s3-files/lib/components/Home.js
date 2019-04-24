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
import Pics from "../modules/pics/collection";

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
        collection={Pics}
        columns={['_id', 'imageId', 'body', 'imageUrl']}
        emptyState={<p className="datatable-empty">No customers to display</p>}
        options={{
            fragmentName: 'PicsFragment',
            limit: 20
        }}
    />
  </div>
);

registerComponent({ name: 'Home', component: Home, hocs: [withMessages] });
