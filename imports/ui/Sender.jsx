import React, { Component }  from 'react';
import PropTypes from 'prop-types';
import { Meteor }                       from 'meteor/meteor';
import moment                           from 'moment-timezone';
import Paper                            from '@material-ui/core/Paper';
import Button                           from '@material-ui/core/Button';

import { Senders } from '/imports/api/senders.js';

const publicDir = `${Meteor.settings.public.cdn}/public`;

import '/imports/languages/en/en.sender.i18n.yml';
import '/imports/languages/de/de.sender.i18n.yml';
import '/imports/languages/en-JM/en-JM.sender.i18n.yml';

export default class Sender extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      senderName: this.props.sender.senderName,
      senderEmailValue: this.props.sender.senderEmail,
    };
  }

  handleSenderNameChange = (event) => {
    this.setState({ senderName: event.target.value });
  };
  handleSenderEmailChange = (event) => {
    this.setState({ senderEmailValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.sender._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    const senderId          = this.state.editing;
    const senderName        = this.senderName.value.trim()
    const senderEmail       = this.senderEmail.value.trim();
    const clientId          = this.props.sender.clientId;

    if (senderName.length   <= 0) return alert(i18n.__("sender.Please enter a Sender name"));

    if (
      senderName != this.props.sender.senderName ||
      senderEmail != this.props.sender.senderEmail
    ) {
      const validEmail = senderEmail
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
      if (!validEmail && senderEmail.length != 0) {
        alert(i18n.__("sender.Invalid Email Address"));
        return;
      }
      //check for a match
      const sender = Senders.findOne({
        senderName: { $regex: senderName + ".*", $options: "i" },
        clientId,
      });
      if (sender && senderName != this.props.sender.senderName) {
        alert(i18n.__("sender.Sender name already exists"));
        return;
      }
    }
    
    
  Meteor.call('senders.update', senderId, senderName, senderEmail);
    this.setState({ editing: null });
  };
  onSelected = () => {
    this.props.onChecked(this.props.sender._id, this.selectable.checked);
  };

  renderOrEditSender() {
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium capitalize">{this.props.sender.senderName}</div>
                  <div className="block-title medium">{this.props.sender.senderEmail}</div>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row"><b>{i18n.__("common.Added By:")}</b>{this.props.sender.username}</div>
                    <div className="block-row"><b>{i18n.__("common.Added At:")}</b>{ moment(this.props.sender.createdAt).tz(this.props.timezone).format('lll') }</div>
                  </div>
                  <div className="block-meta-links">
                  <div className="block-icon">
                  <input
                    type="checkbox"
                    ref={input => { this.selectable = input; }}
                    className="checkbox"
                    defaultChecked={this.props.checked}
                    name="selectSender"
                    value={this.props.sender._id}
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

    const clickedId = this.props.sender._id;

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
                        ref={c => { this.senderName = c; }}
                        placeholder={i18n.__("sender.Sender Name")}
                        value={this.state.senderName}
                        onChange={this.handleSenderNameChange}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="email"
                        ref={c => { this.senderEmail = c; }}
                        placeholder={i18n.__("sender.Sender Email")}
                        value={this.state.senderEmailValue}
                        onChange={this.handleSenderEmailChange}
                      />
                    </div>
                    <div className="form-row">
                      <Button onClick={this.handleSubmit} variant="contained" color="primary" fullWidth={true}>{i18n.__("sender.Update Sender")}</Button>
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
        { this.renderOrEditSender() }
      </div>
    );
  }
}
// props
Sender.propTypes = {
  sender: PropTypes.object.isRequired,
};
