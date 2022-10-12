import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import moment from 'moment-timezone';
import Paper        from '@material-ui/core/Paper';
import Button       from '@material-ui/core/Button';

import { Locations } from '/imports/api/locations.js';

import '/imports/languages/en/en.location.i18n.yml';
import '/imports/languages/de/de.location.i18n.yml';
import '/imports/languages/en-JM/en-JM.location.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class Location extends Component {

  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      locationNameValue: this.props.location.locationName,
      locationEmailValue: this.props.location.locationEmail,
      // deleteInputValue    : ' '
    };
  }

  handleLocationNameChange = (event) => {
    this.setState({ locationNameValue: event.target.value });
  };
  handleLocationEmailChange = (event) => {
    this.setState({ locationEmailValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.location._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    const locationId          = this.state.editing;
    const locationName        = this.locationName.value.trim();
    const locationEmail       = this.locationEmail.value.replace(/(\s*,?\s*)*$/, "");
    const clientId            = this.props.location.clientId;

    if (locationName.length   <= 0) return alert(i18n.__("location.Please enter a Location name"));
    
    // validate email 
    if ((locationName != this.props.location.locationName || locationEmail != this.props.location.locationEmail) && locationEmail.length != 0) {
      var emails = locationEmail.replace(/\s/g, "").split(",");
      var regex =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      for (var i = 0; i < emails.length; i++) {
        if (emails[i] == "" || !regex.test(emails[i])) {
          return alert(i18n.__("location.Invalid Email Address"));
        }
      }
    }
    //check for a match
    const location = Locations.findOne({
      locationName: new RegExp("^" + locationName + "$", "i"),
      clientId,
    });
    if (location && locationName != this.props.location.locationName) {
      alert(i18n.__("location.Location name already exists"));
      return;
    }

    //update location
    Meteor.call("locations.update", locationId, locationName, locationEmail);
    this.setState({ editing: null });
  };
  onSelected = () => {
    this.props.onChecked(this.props.location._id, this.selectable.checked);
  };
  renderDocOrEditDoc() {
    const clickedLocationId = this.props.location._id;
    if (this.state.editing === clickedLocationId) {
      return (
        <div>
          <Paper>
            <div className="block">
              <div className="block-content clearix">
                <div className="inside">

                  <form>
                    <div className="form-row">
                      <input
                        type="text"
                        ref={c => { this.locationName = c; }}
                        placeholder={i18n.__("location.Location Name")}
                        value={this.state.locationNameValue}
                        onChange={this.handleLocationNameChange}
                      />
                    </div>

                    <div className="form-row">
                      <input
                        type="email"
                        ref={c => { this.locationEmail = c; }}
                        placeholder={i18n.__("location.Location Email")}
                        value={this.state.locationEmailValue}
                        onChange={this.handleLocationEmailChange}
                      />
                    </div>

                    <div className="form-row">
                      <Button onClick={this.handleSubmit} variant="contained" color="primary" fullWidth={true}>{i18n.__("common.Update")}</Button>
                    </div>
                  </form>

                </div>
              </div>

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
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium">{this.props.location.locationName}</div>
                  <div className="block-title medium">{this.props.location.locationEmail}</div>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row"><b>{i18n.__("common.Added By:")}</b>{this.props.location.username}</div>
                    <div className="block-row"><b>{i18n.__("common.Added At:")}</b>{ moment(this.props.location.createdAt).tz(this.props.timezone).format('lll') }</div>
                  </div>
                  <div className="block-meta-links">
                  <div className="block-icon">
                    <input
                      type="checkbox"
                      ref={input => { this.selectable = input; }}
                      className="checkbox"
                      defaultChecked={this.props.checked}
                      name="selectRecipient"
                      value={this.props.location._id}
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
  }

  render() {
    return (
      <div>

        {this.renderDocOrEditDoc()}

      </div>
    );
  }
}
// props
Location.propTypes = {
  location: PropTypes.object.isRequired,
};
