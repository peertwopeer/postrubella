import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import IconAccount from "/imports/ui/components/icons/IconAccount";
import Button from "@material-ui/core/Button";
import { withTracker } from "meteor/react-meteor-data";
import { Config } from "/imports/api/config";
import { Clients } from "/imports/api/clients.js";
import { dbCoreReset, dbParcelsReset } from "../../lib/PouchDB";
import "/imports/languages/en/en.profileview.i18n.yml";
import "/imports/languages/de/de.profileview.i18n.yml";
import "/imports/languages/en-JM/en-JM.profileview.i18n.yml";

var selectedLanguage = new ReactiveVar("");
var selectedTimezone = new ReactiveVar("");
const publicDir = `${Meteor.settings.public.cdn}/public`;
function downloadStyles() {
  return {
    margin: "10px 0 5px",
    textAlign: "center",
    fontSize: "14px",
    color: "#000",
    display: "block",
  };
}

class ProfileView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      changepassword: false,
      changeSettings: false,
      userFirstname: "",
      userLastname: "",
      userEmail: "",
      changePasswordMessage: "",
      language: "",
      timezone: "",
      logoutButtonEnabled: true,
    };
  }

  componentWillUnmount() {}

  beginLogout = () => {
    if (Meteor.isCordova) {
      if (Session.get("parcelsOffline").length > 0) {
        if (
          confirm(
            i18n.__(
              "sync.All offline data will be destroyed in logout action. Do you want to continue without syncing?"
            )
          )
        ) {
          this.resetAllDatabases();
        } else {
          return;
        }
      }
    }
    this.setState({ logoutButtonEnabled: false });
    setTimeout(function () {
      this.setState({ logoutButtonEnabled: true });
    }, 10000);
    Meteor.logout(function (err) {
      if (!err) {
        FlowRouter.go("/");
      }
    });
  };

  // @TODO: Add a function to secure this reset. E.g type `DELETE` to proceed
  resetAllDatabases = async () => {
    await Promise.all([dbCoreReset(), dbParcelsReset()]);
    Session.set("parcelsOffline", []);
  };
  // languages
  renderLanguages() {
    if (
      typeof this.props.currentClient[0].optionalLanguages !== "undefined" &&
      this.props.currentClient[0].optionalLanguages !== ""
    ) {
      return this.props.currentClient[0].optionalLanguages.map((language) => (
        <option key={language.value} value={language.value}>
          {language.label}
        </option>
      ));
    }
  }
  // timezones
  renderTimeZones() {
    if (
      typeof this.props.currentClient[0].optionalTimeZones !== "undefined" &&
      this.props.currentClient[0].optionalTimeZones !== ""
    ) {
      return this.props.currentClient[0].optionalTimeZones.map((timezone) => (
        <option key={timezone.value} value={timezone.value}>
          {timezone.label}
        </option>
      ));
    }
  }
  handleTimeZone = (event) => {
    this.setState({ timezone: event.target.value });
    selectedTimezone.set(event.target.value);
  };
  handleLanguage = (event) => {
    this.setState({ language: event.target.value });
    selectedLanguage.set(event.target.value);
  };
  handleUserFirtstnameChange = (event) => {
    this.setState({ userFirstname: event.target.value });
  };
  handleUserLastnameChange = (event) => {
    this.setState({ userLastname: event.target.value });
  };
  handleUserEmailChange = (event) => {
    this.setState({ userEmail: event.target.value });
  };

  toggleEditing = () => {
    this.setState({ editing: true });
  };

  toggleChangePassword = () => {
    this.setState({ changepassword: true });
  };
  togglechangeSettings = () => {
    this.setState({ changeSettings: true });
  };
  updatePassword = async (event) => {
    const oldPassword = this.useroldpassword.value.trim();
    const newPassword = this.usernewpassword.value.trim();
    const confirmPassword = this.userconfirmpassword.value.trim();
    await this.checkPassword(oldPassword, newPassword, confirmPassword);
  };

  checkPassword = async (oldPassword, newPassword, confirmPassword) => {
    let ref = this;
    try {
      let message = "";
      var strongRegex = new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*-])(?=.{6,})"
      );
      if (oldPassword != newPassword) {
        if (strongRegex.test(newPassword)) {
          if (newPassword == confirmPassword) {
            await Accounts.changePassword(
              oldPassword,
              newPassword,
              function (error) {
                if (error) {
                  message = error.reason;
                  message = i18n.__(
                    "profileview.Old Password is not correct Please enter correct old password"
                  );
                  ref.setState({ changePasswordMessage: message });
                } else {
                  ref.useroldpassword.value = "";
                  ref.usernewpassword.value = "";
                  ref.userconfirmpassword.value = "";
                  message = i18n.__(
                    "profileview.Your Password is changed succesfully"
                  );
                  ref.setState({
                    changePasswordMessage: message,
                    changepassword: false,
                  });

                  setTimeout(
                    function () {
                      ref.setState({ changePasswordMessage: "" });
                    }.bind(this),
                    5000
                  );
                }
              }
            );
          } else {
            message = i18n.__(
              "profileview.New Password and Confirm Password is not same"
            );
            ref.setState({ changePasswordMessage: message });
          }
        } else {
          if (newPassword.length < 6) {
            message = i18n.__(
              "profileview.New Password should be minimum 6 characters long"
            );
          } else {
            message = i18n.__(
              "profileview.New Password should contain at least 1 upper character 1 lower character 1 number and 1 special character"
            );
          }
          ref.setState({ changePasswordMessage: message });
        }
      } else {
        message = i18n.__(
          "profileview.Old password and new password should not be same"
        );
        ref.setState({ changePasswordMessage: message });
      }
    } catch (e) {
      console.error(e);
    }
  };

  toggleHelp = (event) => {
    event.preventDefault();

    const user = Meteor.user();
    const userId = user._id;
    const helpStatus = user.profile.help;

    Meteor.users.update(userId, {
      $set: {
        "profile.help": !helpStatus,
        updatedAt: new Date(),
      },
    });
  };

  updateProfile = (event) => {
    event.preventDefault();

    const userFirstname = this.userFirstname.value.trim();
    const userLastname = this.userLastname.value.trim();
    const userEmail = this.userEmail.value
      .replace(/\s+/g, "")
      .toLowerCase()
      .trim();
    const userId = Meteor.userId();
    let userUpdateParams = {
      firstName: userFirstname,
      lastName: userLastname,
      userEmail: userEmail,
    };
    Meteor.call(
      "updateUserProfile",
      userId,
      userUpdateParams,
      function (Error) {
        if (Error) alert(Error);
      }
    );
    this.setState({ editing: false });
  };
  saveChanges = (event) => {
    event.preventDefault();
    const language = this.languageSelect.value.trim();
    const timezone = this.timeZoneSelect.value.trim();
    const userId = Meteor.userId();
    let userUpdateParams = {
      language: language,
      timezone: timezone,
    };
    Meteor.call(
      "updateUserProfile",
      userId,
      userUpdateParams,
      function (Error) {
        if (Error) alert(Error);
      }
    );
    this.setState({ changeSettings: false });
    window.location.reload();
  };
  cancelSettingsEditing = () => {
    this.setState({ changeSettings: false });
  };
  cancelPasswordEditing = () => {
    this.setState({ changepassword: false, changePasswordMessage: "" });
  };
  cancelProfileEditing = () => {
    this.setState({ editing: false });
  };
  renderProfileInformation() {
    const { currentUser } = this.props;

    if (!currentUser) return;

    if (
      this.state.editing === false &&
      this.state.changepassword === false &&
      this.state.changeSettings === false
    ) {
      return (
        <div className="block block-profile center" key={currentUser._id}>
          <p className="successmsg">{this.state.changePasswordMessage}</p>
          <div className="block-content clearfix">
            <div className="inside">
              <div className="block-profile-image">
                <IconAccount className="icon" color="disabled" />
              </div>
              <div className="block-row block-profile-username">
                <b>{currentUser.username}</b>
              </div>
              <div className="block-row block-profile-name">
                {currentUser.profile.firstname} {currentUser.profile.lastname}
              </div>
              <div className="block-row block-profile--email">
                {currentUser.emails[0].address}
              </div>
              <br />
              <div
                className="block-row"
                style={{
                  fontSize: "15px",
                  background: "#fac012",
                  fontWeight: "bold",
                  borderRadius: "50px",
                  padding: "5px",
                }}
              >
                {this.props.currentClient[0].clientName}
              </div>
            </div>
          </div>

          <div className="block-status clearix" />

          <div className="block-meta clearix">
            <div className="inside">
              <div className="block-meta-text">
                <div onClick={this.toggleEditing} className="block-row pointer">
                  <b>{i18n.__("profileview.Edit your account details")}</b>
                </div>
              </div>
              <div className="block-meta-text">
                <div
                  onClick={this.togglechangeSettings}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Change App Settings")}</b>
                </div>
              </div>
              <div className="block-meta-text">
                <div
                  onClick={this.toggleChangePassword}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Change Password")}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (this.state.editing === true) {
      return (
        <div className="block block-profile center" key={currentUser._id}>
          <div className="block-content clearfix">
            <div className="inside">
              <div className="block-profile-image">
                <IconAccount className="icon" color="disabled" />
              </div>
              <div className="block-row block-profile-username">
                <b>{currentUser.username}</b>
              </div>
              <div className="form-row block-row block-profile-firstname">
                <input
                  type="text"
                  ref={(c) => {
                    this.userFirstname = c;
                  }}
                  defaultValue={currentUser.profile.firstname}
                  onChange={this.handleUserFirtstnameChange}
                />
              </div>
              <div className="form-row block-row block-profile-lastname">
                <input
                  type="email"
                  ref={(c) => {
                    this.userLastname = c;
                  }}
                  defaultValue={currentUser.profile.lastname}
                  onChange={this.handleUserLastnameChange}
                />
              </div>
              <div className="form-row block-row block-profile-email">
                <input
                  type="email"
                  ref={(c) => {
                    this.userEmail = c;
                  }}
                  defaultValue={currentUser.emails[0].address}
                  onChange={this.handleUserEmailChange}
                />
              </div>
            </div>
          </div>

          <div className="block-status clearix" />

          <div className="block-meta clearix">
            <div className="inside">
              <div className="block-meta-text">
                <div onClick={this.updateProfile} className="block-row pointer">
                  <b>{i18n.__("profileview.Update Profile")}</b>
                </div>
              </div>
              <div className="block-meta-text">
                <div
                  onClick={this.cancelProfileEditing}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Cancel")}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.changepassword === true) {
      return (
        <div className="block block-profile center" key={currentUser._id}>
          <div className="block-content clearfix">
            <div className="inside">
              <div className="block-profile-image">
                <IconAccount className="icon" color="disabled" />
              </div>
              <div className="block-row block-profile-username">
                <b>{currentUser.username}</b>
              </div>
              <div className="form-row block-row block-profile-firstname">
                <input
                  type="password"
                  ref={(c) => {
                    this.useroldpassword = c;
                  }}
                  placeholder={i18n.__("profileview.Old Password")}
                />
              </div>
              <div className="form-row block-row block-profile-lastname">
                <input
                  type="password"
                  ref={(c) => {
                    this.usernewpassword = c;
                  }}
                  placeholder={i18n.__("profileview.New Password")}
                />
              </div>
              <div className="form-row block-row block-profile-email">
                <input
                  type="password"
                  ref={(c) => {
                    this.userconfirmpassword = c;
                  }}
                  placeholder={i18n.__("profileview.Confirm New Password")}
                />
              </div>
            </div>
          </div>

          <div className="block-status clearix" />
          <p>{this.state.changePasswordMessage}</p>
          <div className="block-meta clearix">
            <div className="inside">
              <div className="block-meta-text">
                <div
                  onClick={this.updatePassword}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Change Password")}</b>
                </div>
              </div>
              <div className="block-meta-text">
                <div
                  onClick={this.cancelPasswordEditing}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Cancel")}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (this.state.changeSettings === true) {
      return (
        <div className="block block-profile center" key={currentUser._id}>
          <div className="block-content clearfix">
            <div className="inside">
              <div className="block-profile-image">
                <IconAccount className="icon" color="disabled" />
              </div>
              <div className="block-row block-profile-username">
                <b>{i18n.__("profileview.Change App Settings")}</b>
              </div>
              <div className="form-row">
                <select
                  value={selectedLanguage.get()}
                  name="language"
                  ref={(c) => {
                    this.languageSelect = c;
                  }}
                  onChange={this.handleLanguage}
                >
                  <option value="">
                    {i18n.__("profileview.Change your App language")}
                  </option>
                  {this.renderLanguages()}
                </select>
              </div>
              <div className="form-row">
                <select
                  value={selectedTimezone.get()}
                  name="timezone"
                  ref={(c) => {
                    this.timeZoneSelect = c;
                  }}
                  onChange={this.handleTimeZone}
                >
                  <option value="">
                    {i18n.__("profileview.Change your App timezone")}
                  </option>
                  {this.renderTimeZones()}
                </select>
              </div>
            </div>
          </div>

          <div className="block-status clearix" />

          <div className="block-meta clearix">
            <div className="inside">
              <div className="block-meta-text">
                <div onClick={this.saveChanges} className="block-row pointer">
                  <b>{i18n.__("profileview.Save Changes")}</b>
                </div>
              </div>
              <div className="block-meta-text">
                <div
                  onClick={this.cancelSettingsEditing}
                  className="block-row pointer"
                >
                  <b>{i18n.__("profileview.Cancel")}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-red p2">
            <span className="white">
              {i18n.__(
                "profileview.To reflect these changes on mobile applications"
              )}{" "}
              {Meteor.isCordova ? (
                <a className="white" href="/sync">
                  {i18n.__("profileview.Click here to sync")}
                </a>
              ) : (
                ""
              )}
            </span>
          </div>
        </div>
      );
    }
  }

  renderHelpToggle() {
    const helpStatus = Meteor.user().profile.help;

    if (helpStatus === false) {
      return (
        <div className="help-widget notice" onClick={this.toggleHelp}>
          {i18n.__("profileview.Turn Help Mode ON")}
        </div>
      );
    }
    if (helpStatus === true) {
      return (
        <div className="help-widget notice" onClick={this.toggleHelp}>
          {i18n.__("profileview.Turn Help Mode OFF")}
        </div>
      );
    }
  }

  appVersion() {
    return {
      textAlign: "center",
      padding: "7px",
      letterSpacing: "1px",
      fontSize: "13.5px",
      lineHeight: "15.5px",
      fontWeight: "bold",
      color: "#d9d9d9",
    };
  }
  renderAppVersion() {
    if (!window.cordova) return;
    let envNotice = "";
    const { config } = this.props;
    const buildVersion = cordova.appInfoSync.version;

    if (Meteor.absoluteUrl().includes("dev.postrubella")) {
      envNotice = " (dev)";
    } else if (Meteor.absoluteUrl().includes("localhost")) {
      envNotice = " (local)";
    }

    if (config) {
      envNotice += `, Server: ${config.version}`;
    }

    return (
      <div style={this.appVersion()}>
        {i18n.__("profileview.Version: build")} {buildVersion},
        {i18n.__("profileview.update")} {codeVersion}
        {envNotice}
      </div>
    );
  }

  render() {
    const { status } = this.props;
    if (status.connected) {
      if (
        !this.props.clientSubscription ||
        !this.props.configSubscription ||
        !this.state.logoutButtonEnabled
      ) {
        return (
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>{i18n.__("common.The data is loading please wait")}</b>
            </div>
          </div>
        );
      }

      return (
        <div className="width-narrow">
          {this.renderProfileInformation()}
          <div>
            <Button
              onClick={this.beginLogout}
              disabled={!this.state.logoutButtonEnabled}
              variant="contained"
              color="primary"
              fullWidth={true}
            >
              {i18n.__("profileview.Logout")}
            </Button>
          </div>
          {this.renderAppVersion()}
          <div>
            <a style={downloadStyles()} href="/systemFunctionality">
              {i18n.__("profileview.See What is New")}
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="width-narrow">
        <div>
          <div className="simple-loader">
            <img src={`${publicDir}/img/loading.gif`} />
          </div>
          <div className="data-processing-message">
            <br></br>
            <b>
              {i18n.__(
                "common.You are offline check your internet connection and try again"
              )}
            </b>
          </div>
        </div>
      </div>
    );
  }
}

// container
export default withTracker(() => {
  const clientSubscription = Meteor.subscribe("clients").ready();
  const configSubscription = Meteor.subscribe("config.version").ready();
  const user = Meteor.user();
  const query = {};
  var currentClient = [];
  if (user) {
    query.clientId = user.profile.clientId;
    if (
      typeof user.profile.language !== "undefined" &&
      user.profile.language !== ""
    ) {
      selectedLanguage.set(user.profile.language);
    }
    if (
      typeof user.profile.timezone !== "undefined" &&
      user.profile.timezone !== ""
    ) {
      selectedTimezone.set(user.profile.timezone);
    }
  }
  if (clientSubscription) {
    currentClient = Clients.find({ _id: query.clientId }).fetch();
  }

  return {
    currentUser: Meteor.user(),
    config: Config.find().fetch()[0],
    currentClient,
    status: Meteor.status(),
    clientSubscription: clientSubscription,
    configSubscription: configSubscription,
  };
})(ProfileView);
