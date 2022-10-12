import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Paper      from '@material-ui/core/Paper';
import moment     from 'moment-timezone';

import '/imports/languages/en/en.emaillogs.i18n.yml';
import '/imports/languages/de/de.emaillogs.i18n.yml';
import '/imports/languages/en-JM/en-JM.emaillogs.i18n.yml';

export default class EmailLogs extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }


  renderEmailLog() {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">
              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium"><b>{i18n.__('emaillog.To')}</b>{this.props.log.to}</div>
                  <div className="block-title medium"><b>{i18n.__('emaillog.Subject')}</b>{this.props.log.subject}</div>
                  <div className="block-title medium"><b>{i18n.__('emaillog.Body')}</b></div>
                  <div dangerouslySetInnerHTML={{ __html: this.props.log.body }} />
                </div>
              </div>
              <div className="block-status clearix" />
              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row"><b>{i18n.__('emaillog.Created At')}</b>{ moment(this.props.log.createdAt).tz(this.props.timezone).format('lll') }</div>
                  </div>
                </div>
              </div>

            </div>
          </Paper>
        </div>
      );
    
  }

  render() {
    return (
      <div>
        { this.renderEmailLog() }
      </div>
    );
  }
}
