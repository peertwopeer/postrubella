import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import moment from 'moment-timezone';
import Paper  from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

import { Recipients } from '/imports/api/recipients.js';

import '/imports/languages/en/en.recipient.i18n.yml';
import '/imports/languages/de/de.recipient.i18n.yml';
import '/imports/languages/en-JM/en-JM.recipient.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class Recipient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      recipientName: this.props.recipient.recipientName,
    };
  }

  handleRecipientNameChange = (event) => {
    this.setState({ recipientName: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.recipient._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };
  handleSubmit = (event) => {
    event.preventDefault();

    const recipientId     = this.state.editing;
    const recipientName   = this.recipientName.value.trim();
    const clientId        = this.props.recipient.clientId;
  // check for a match
    if (recipientName.length   <= 0) return alert(i18n.__("recipient.Please enter a Recipient name"));
    const recipient = Recipients.findOne({
      recipientName: new RegExp(recipientName, 'i'),
      clientId,
    });
    if(recipient){
      let text = recipient.recipientName.toLowerCase().split(/\s/).join('');
      let newRecipient = recipientName.toLowerCase().split(/\s/).join('');
      if (text == newRecipient) {
        console.error(recipient, 'already exists!');
        alert(i18n.__("recipient.Recipient name already exists"));
        return;
      }
    }
  //update recipient name
    Recipients.update(recipientId, {
      $set: {
        recipientName,
        updatedAt: new Date(),
      },
    });
    
    this.setState({ editing: null });
  };
  onSelected = () => {
    this.props.onChecked(this.props.recipient._id, this.selectable.checked);
  };

  renderOrEditRecipient() {
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium capitalize">{this.props.recipient.recipientName}</div>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row"><b>{i18n.__("common.Added By:")}</b>{this.props.recipient.username}</div>
                    <div className="block-row"><b>{i18n.__("common.Added At:")}</b>{moment(this.props.recipient.createdAt).tz(this.props.timezone).format('lll')}</div>
                  </div>
                  <div className="block-meta-links">
                <div className="block-icon">
                  <input
                    type="checkbox"
                    ref={input => { this.selectable = input; }}
                    className="checkbox"
                    defaultChecked={this.props.checked}
                    name="selectRecipient"
                    value={this.props.recipient._id}
                    onClick={this.onSelected}
                  />
                </div>
                <div className="block-icon" onClick={this.toggleEditing}>
                  <img src={`${publicDir}/svg/IconSettings.svg`} />
                </div>
                </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }

    const clickedId = this.props.recipient._id;

    if (this.state.editing === clickedId) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">

                  <form>
                    <div className="form-row">
                      <input
                        type="text"
                        ref={c => { this.recipientName = c; }}
                        placeholder={i18n.__("recipient.Recipient Name")} 
                        value={this.state.recipientName}
                        onChange={this.handleRecipientNameChange}
                      />
                    </div>
                    <div className="form-row">
                      <Button onClick={this.handleSubmit} variant="contained" color="primary" fullWidth={true}>{i18n.__("common.Update")}</Button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <h6>&nbsp;</h6>
                  <div className="block-meta-links col-6">
                    <div className="block-icon" onClick={this.cancelEditing}>
                      <img src={`${publicDir}/svg/Cancel.svg`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        { this.renderOrEditRecipient() }
      </div>
    );
  }
}
// props
Recipient.propTypes = {
  recipient: PropTypes.object.isRequired,
};
