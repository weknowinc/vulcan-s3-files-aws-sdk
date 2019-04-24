Package.describe({
  name: 'vulcan-s3-files',
});

Package.onUse(function (api) {

  api.use([
    // vulcan core
    'vulcan:core@1.13.0',

    // vulcan packages
    'vulcan:forms@1.13.0',
    'vulcan:accounts@1.13.0',
    'vulcan:forms-upload@1.13.0',
    'vulcan:ui-bootstrap@1.13.0',

    // third-party packages
    'fourseven:scss@4.5.0',
    'ostrio:files@1.9.11'
  ]);


  api.addFiles('lib/stylesheets/react-select.css');
  api.addFiles('lib/stylesheets/bootstrap.min.css');
  api.addFiles('lib/stylesheets/style.scss');

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');

});
