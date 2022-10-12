import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { withTracker }   from 'meteor/react-meteor-data';
import Paper   from '@material-ui/core/Paper';
import Button  from '@material-ui/core/Button';
import Checkbox from "@material-ui/core/Checkbox";
import { Clients }  from '/imports/api/clients.js';
import '/imports/languages/en/en.users.i18n.yml';
import '/imports/languages/de/de.users.i18n.yml';
import '/imports/languages/en-JM/en-JM.users.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;

class User extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      userFirstname: this.props.user.profile.firstname,
      userLastname: this.props.user.profile.lastname,
      userEmail: this.props.user.emails[0].address,
      twoFactorEnabled: this.props.user.twoFactorEnabled,
      userPassword: null,
      roleValue: this.props.user.roles,
      timezone:  '',
      language: '',
    };
  }

  handleUserFirtstnameChange = (event) => {
    this.setState({ userFirstname: event.target.value });
  };
  handleUserLastnameChange = (event) => {
    this.setState({ userLastname: event.target.value });
  };
  handleUserEmailChange = (event) => {
    this.setState({ userEmail: event.target.value });
  };
  handleUserPasswordChange = (event) => {
    this.setState({ userPassword: event.target.value });
  };
  deleteInputChange = (event) => {
    this.setState({ deleteInputValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.user._id });
  };
  handleRoleChange = (event) => {
    this.setState({ roleValue: event.target.value });
  };
// languages
renderLanguages() {
  const clientId =  this.props.user.profile.clientId;
  if(this.props.clientSubscription){
    const client = Clients.findOne({_id : clientId });
    if((typeof this.props.user.profile.language !== 'undefined') && (this.props.user.profile.language !== '')){
      if((typeof client.optionalLanguages !== 'undefined') && (client.optionalLanguages !== '')){
      return client.optionalLanguages.map(language =>(
      <option selected={(language.value == this.props.user.profile.language) || false} key={language.value} value={language.value}>{language.label}</option>
    ))
   }
  }
  if((typeof client.optionalLanguages !== 'undefined') && (client.optionalLanguages !== '')){
   return client.optionalLanguages.map(language =>(
    <option  key={language.value} value={language.value}>{language.label}</option>
  ))
  }
 }
 }
// timezones
renderTimeZones() {
  const clientId =  this.props.user.profile.clientId;
  if(this.props.clientSubscription){
    const client = Clients.findOne({_id : clientId });
    if((typeof this.props.user.profile.timezone !== 'undefined') && (this.props.user.profile.timezone !== '')){
      if((typeof client.optionalTimeZones !== 'undefined') && (client.optionalTimeZones !== '')){
      return client.optionalTimeZones.map(timezone =>(
        <option selected={(timezone.value == this.props.user.profile.timezone) || false} key={timezone.value} value={timezone.value}>{timezone.label}</option>
    ))
    }
  }
  if((typeof client.optionalTimeZones !== 'undefined') && (client.optionalTimeZones !== '')){
    return client.optionalTimeZones.map(timezone =>(
      <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
  ))
  }
}
 }
handleLanguage = (event) => {
  this.setState({ language: event.target.value });
};
handleTimeZone = (event) => {
  this.setState({ timezone: event.target.value });
};
changeTwoFactorEnabled = ({target}) => {
  this.setState({ twoFactorEnabled: target.checked });
}; 
cancelEditing = () => {
  this.setState({ editing: null });
};

deleteButton() {
  if (this.state.deleteInputValue !== 'DELETE') {
    return (
      <div className="block-icon" onClick={this.cancelEditing}>
        <img src={`${publicDir}/svg/Cancel.svg`} />
      </div>
    );
  }

  if (this.state.deleteInputValue === 'DELETE') {
    return (
      <div className="block-icon" onClick={this.handleDelete}>
        <img src={`${publicDir}/svg/icon-bin.svg`} />
      </div>
    );
  }
}

  handleDelete = (event) => {
    event.preventDefault();
    if (window.confirm(i18n.__("users.Are you sure to Delete User :") + this.userFirstname.value.trim() + " " + this.userLastname.value.trim() + " ?")) {
      const userId = this.props.user._id;

      Meteor.users.remove(userId);

      alert(i18n.__("users.User") + this.userFirstname.value.trim() + " " + this.userLastname.value.trim() + ' Deleted Successfully');
      window.location.reload();
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const defaultLanguage = this.languageSelect.value ? this.languageSelect.value.trim() : ''
    const defaultTimezone = this.timeZoneSelect.value ? this.timeZoneSelect.value.trim() : ''
    const selecteduUserId = this.state.editing;
    const userFirstname = this.userFirstname.value.trim();
    const userLastname = this.userLastname.value.trim();
    const userEmail = this.userEmail.value.trim();
    const role = this.roleSelect.value.trim();
    const language = defaultLanguage;
    const timezone = defaultTimezone;
    var user_details_found = await Meteor.users.findOne({ emails: { '$elemMatch': { 'address': userEmail } }, _id: { '$ne': selecteduUserId } });
    
    if (user_details_found != "" && typeof user_details_found != "undefined" && user_details_found != undefined && user_details_found != null) {
      return alert(i18n.__("users.Please enter a Different email This email is Already used"));
    }

    let userUpdateParams = {
      "firstName":userFirstname,
      "lastName":userLastname,
      "userEmail":userEmail,
      "role":role,
      "language":language,
      "timezone":timezone,
      "twoFactorEnabled": this.state.twoFactorEnabled
    };
    
    Meteor.call('updateUserProfile',selecteduUserId,userUpdateParams,function(Error){
      if(Error) alert(Error);
    });

    if (this.userPassword.value.trim() != '' && this.userPassword.value.trim() != null && this.userPassword.value.trim() != undefined && this.userPassword.value.trim() != "undefined") {
      Meteor.call('setUserPassword', selecteduUserId, this.userPassword.value.trim());
    }

    this.setState({ editing: null });
  };

  updateUserRole() {
    const currentUserId = Meteor.userId();

    // if (!Roles.userIsInRole(currentUserId, ['super-admin','client-manager'])) return;
    if (Roles.userIsInRole(currentUserId, ['super-admin'])) {
      return (
        <div className="form-row">
          <select name="roles" ref={c => { this.roleSelect = c; }} defaultValue="0" value={this.state.roleValue} onChange={this.handleRoleChange}>
            <option value="0" disabled defaultValue>{i18n.__("users.Choose Role")}</option>
            <option value="normal-user">{i18n.__("users.Normal user")}</option>
            <option value="client-manager">{i18n.__("users.Client Manager")}</option>
            <option value="location-manager">{i18n.__("users.Location Manager")}</option>
            <option value="super-admin">{i18n.__("users.Super Admin")}</option>
            <option value="group-admin">{i18n.__("users.Group Admin")}</option>

          </select>
        </div>
      );
    }
    if (Roles.userIsInRole(currentUserId, ['client-manager'])) {
      return (
        <div className="form-row">
          <select name="roles" ref={c => { this.roleSelect = c; }} onChange={this.handleRoleChange}>
            <option value="0" disabled defaultValue>{i18n.__("users.Choose Role")}</option>
            <option value="normal-user">{i18n.__("users.Normal user")}</option>
            <option value="client-manager">{i18n.__("users.Client Manager")}</option>
          </select>
        </div>
      );
    }
  }

  updateUserPassword() {
    const currentUserId = Meteor.userId();

    if (!Roles.userIsInRole(currentUserId, ['super-admin'])) return;
    if (Roles.userIsInRole(currentUserId, ['super-admin'])) {
      return (
        <div className="form-row">
          <input
            type="password"
            ref={c => { this.userPassword = c; }}
            placeholder={i18n.__("users.User Password")}
            onChange={this.handleUserPasswordChange}
          />
        </div>
      );
    }
  }

  renderUserRole() {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ['super-admin', 'client-manager'])) {
      return (
        <div className="block-row">{this.props.user.roles}</div>
      );
    }
  }

  renderOrEditUser() {
    if (this.state.editing === null) {
      // console.log('in User Component : ',this.props.user);
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">

              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title medium">{this.props.user.profile.firstname} {this.props.user.profile.lastname}</div>
                  <div className="block-row">{this.props.user.username}</div>
                  <div className="block-row">{this.props.user.emails[0].address}</div>
                  {this.renderUserRole()}
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row"><b>{i18n.__("users.User ID:")}</b> {this.props.user._id}</div>
                    <div className="block-row"><b>{i18n.__("users.Client ID:")}</b> {this.props.user.profile.clientId}</div>
                    <div className="block-row">
                      <a href={`/clients`} target="_blank">
                        <b>{i18n.__("users.Client Name:")}</b>
                        {
                          (this.props.user.client_detail != "" && typeof this.props.user.client_detail != "undefined" && this.props.user.client_detail != undefined && this.props.user.client_detail != null) ?
                            (this.props.user.client_detail.clientName != "" && typeof this.props.user.client_detail.clientName != "undefined" && this.props.user.client_detail.clientName != undefined && this.props.user.client_detail.clientName != null) ?
                              this.props.user.client_detail.clientName
                              :
                              this.props.clientName
                            :
                            this.props.clientName
                        }
                      </a>
                    </div>
                  </div>
                  <div className="block-meta-links">
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

    const clickedId = this.props.user._id;

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
                        ref={c => { this.userFirstname = c; }}
                        placeholder={i18n.__("users.User Firstname")}
                        value={this.state.userFirstname}
                        onChange={this.handleUserFirtstnameChange}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="email"
                        ref={c => { this.userLastname = c; }}
                        placeholder={i18n.__("users.User Lastname")}
                        value={this.state.userLastname}
                        onChange={this.handleUserLastnameChange}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="email"
                        ref={c => { this.userEmail = c; }}
                        placeholder={i18n.__("users.User Email")}
                        value={this.state.userEmail}
                        onChange={this.handleUserEmailChange}
                      />
                    </div>

                    {this.updateUserPassword()}

                    {this.updateUserRole()}
                    <div className="form-row">
                    <label><span className={"client-form-logo-label"}>{i18n.__('users.Set App language and timezone for Users')}</span></label>
                     <br></br>
                      <p className={"client-form-logo-description"}>{i18n.__('users.Set language and timezone of the application')}</p>
                      <select name="clients" ref={c => { this.languageSelect = c; }}  onChange={this.handleLanguage}>
                        <option value=""  defaultValue>{i18n.__("users.Set a default Language")}</option>
                        {this.renderLanguages()}
                      </select>
                    </div>
                    <div className="form-row">
                      <select name="clients" ref={c => { this.timeZoneSelect = c; }}  onChange={this.handleTimeZone}>
                        <option value=""  defaultValue>{i18n.__("users.Set a default TimeZone")}</option>
                        {this.renderTimeZones()}
                      </select>
                    </div>
                    <div className="form-row">
                    <label>{i18n.__("users.Enable Two-factor authentication")}</label>
                      <Checkbox
                        color="primary"
                        onChange={this.changeTwoFactorEnabled}
                        checked={this.state.twoFactorEnabled}
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
                  <div className="block-meta-text col-6">
                    <div className="block-row">
                      <input
                        type="text"
                        placeholder="DELETE"
                        value={this.state.deleteInputValue}
                        onChange={this.deleteInputChange}
                      />
                    </div>
                  </div>
                  <div className="block-meta-links col-6">
                    {this.deleteButton()}
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
        {this.renderOrEditUser()}
      </div>
    );
  }
}
// props
User.propTypes = {
  user: PropTypes.object.isRequired,
};

export default withTracker(() => {
  const clientSubscription = Meteor.subscribe('clients').ready();
  const user = Meteor.user();
  const query = {};

  if (user) query.clientId = user.profile.clientId;
  const currentClient = Clients.find({ _id: query.clientId }).fetch()
  
  
  return {
    currentClient,
    clientSubscription: clientSubscription,
   };
})(User);