// npm
import React, { Component } from 'react';
import '/imports/languages/en/en.common.i18n.yml';
import '/imports/languages/de/de.common.i18n.yml';
import '/imports/languages/en-JM/en-JM.common.i18n.yml';

// component
class NotFound extends Component {
  render() {
    return (
      <div className="center m2">
        {i18n.__("common.Page not found")}
      </div>
    );
  }
}

// container 
export default NotFound;
