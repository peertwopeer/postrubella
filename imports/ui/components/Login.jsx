import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { Accounts } from "meteor/accounts-base";
import Button from "@material-ui/core/Button";
import { decode } from "html-entities";
import { hotp } from "otplib";
import { Config } from "/imports/api/config";
import NoticeHeader from "/imports/ui/components/icons/NoticeHeader";
import { dbCoreReset, dbParcelsReset } from "../../lib/PouchDB";
import "/imports/languages/en/en.login.i18n.yml";
import "/imports/languages/en/en.forgotpassword.i18n.yml";
import "/imports/languages/en-JM/en-JM.login.i18n.yml";
import "/imports/languages/en-JM/en-JM.forgotpassword.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

function styles() {
  return {
    height: "90vh",
  };
}

function downloadStyles() {
  return {
    margin: "10px 0 5px",
    textAlign: "center",
    fontSize: "14px",
    display: "block",
  };
}
function directLinkStyles() {
  return {
    textAlign: "center",
    fontSize: "12px",
    display: "block",
  };
}
function otpInstructionStyles() {
  return {
    textAlign: "center",
    fontSize: "14px",
    display: "block",
  };
}
function resendOTPButtonStyles() {
  return {
    fontSize: "12px",
    height: "30px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
  };
}
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentBox: "LoginBox",
      userid: "",
      password: "",
      useridErrors: [],
      passwordErrors: [],
      forgotEmailErrors: [],
      loginError: "",
      forgotLoginError: "",
      OTPfieldValue: "",
      twoFactorAuthData: false,
      checkOTP: false,
      enableLogin: true,
      enableResendOTPButton: true,
      loading: false,
    };
  }

  componentDidMount() {
    this.resetAllDatabases();
  }

  // @TODO: Add a function to secure this reset. E.g type `DELETE` to proceed
  resetAllDatabases = async () => {
    await Promise.all([dbCoreReset(), dbParcelsReset()]);
    Session.set("parcelsOffline", []);
  };

  renderDownloadLink = () => {
    if (Meteor.isCordova) return;

    const dev = "https://dev.postrubella.org_placeholder.io/";

    let downloadLink =
      "https://postrubella.ams3.digitaloceanspaces.com/public/app/live/live.postrubella.apk";

    if (Meteor.absoluteUrl() == dev) {
      downloadLink =
        "https://postrubella.ams3.digitaloceanspaces.com/public/app/dev/postrubella.apk";
    }
    return (
      <div>
        <div>
          <a
            style={downloadStyles()}
            href="https://play.google.com/store/apps/details?id=com.app.org_placeholder.postrubella.live"
            target="_blank"
          >
            Now available on the Google Playstore!
          </a>
        </div>
        <div>
          <a style={directLinkStyles()} href={downloadLink}>
            Direct download link
          </a>
        </div>
      </div>
    );
  };

  switchBox = () => {
    if (this.state.currentBox == "LoginBox") {
      this.setState({ currentBox: "ForgotPasswordBox" });
      this.setState({ checkOTP: false });
    } else {
      this.setState({ currentBox: "LoginBox" });
      this.setState({ checkOTP: false });
    }
  };

  onChangeOTPField = () => {
    this.setState({ OTPfieldValue: this.otp.value.trim() });
  };

  currentBox = () => {
    if (this.state.currentBox == "OTPVerificationBox") {
      return (
        <div className="letter-space15">
          <div className="center mt2 ">
            <p className="h3 text-dark-gray">Two-factor authentication</p>
          </div>
          <div className="form-row ">
            <span className="mt2" style={otpInstructionStyles()}>
              <p className="h4 text-dark-gray">
                {i18n.__(
                  "login.An email with your verification code was sent to your email"
                )}
              </p>
            </span>
          </div>

          <div className="form-row block-row ">
            <input
              type="text"
              className="mt3 center letter-space15"
              ref={(c) => (this.otp = c)}
              value={this.state.OTPfieldValue}
              onChange={this.onChangeOTPField}
              placeholder={i18n.__("login.Enter OTP")}
              onKeyPress={(event) => {
                if (event.key == "Enter") {
                  this.login(event);
                }
              }}
            />
          </div>
          <div className="clearix mt3 center">
            <Button
              onClick={this.login}
              variant="contained"
              color="primary"
              fullWidth={true}
            >
              {i18n.__("login.Verify code")}
            </Button>
          </div>
          <div className="clearix mt1 ">
            <div className="mx-auto col-4 center mt3">
              <Button
                style={resendOTPButtonStyles()}
                disabled={!this.state.enableResendOTPButton}
                onClick={this.resendOTP}
                fullWidth={true}
              >
                {" "}
                <a
                  style={{
                    color: this.state.enableResendOTPButton ? "" : "#666",
                  }}
                >
                  {i18n.__("login.Resend code")}
                </a>{" "}
              </Button>
            </div>
          </div>

          <span className="login-message-warning">{this.state.loginError}</span>
        </div>
      );
    }

    if (this.state.currentBox == "LoginBox") {
      return (
        <div>
          <div className="form-row block-row">
            <input
              type="text"
              ref={(c) => {
                this.userid = c;
              }}
              placeholder={i18n.__("login.Enter username or email")}
              onKeyPress={(event) => {
                if (event.key == "Enter") {
                  this.login(event);
                }
              }}
            />
          </div>
          {this.state.useridErrors.map((message) => (
            <span className="login-message-warning" key={message}>
              {message}
              <br />
            </span>
          ))}
          <div className="form-row block-row">
            <input
              type="password"
              ref={(c) => {
                this.password = c;
              }}
              placeholder={i18n.__("login.Enter password")}
              onKeyPress={(event) => {
                if (event.key == "Enter") {
                  this.login(event);
                }
              }}
            />
          </div>
          {this.state.passwordErrors.map((message) => (
            <span className="login-message-warning" key={message}>
              {message}
              <br />
            </span>
          ))}
          <div className="form-row">
            <p className="left-align">
              {decode(i18n.__("common.Terms of use"))}
            </p>
          </div>
          <div className="clearix">
            <Button
              onClick={this.login}
              variant="contained"
              color="primary"
              disabled={!this.state.enableLogin}
              fullWidth={true}
            >
              {i18n.__("login.sign in")}
            </Button>
          </div>
          <span className="login-message-warning">{this.state.loginError}</span>
        </div>
      );
    }

    if (this.state.currentBox == "ForgotPasswordBox") {
      return (
        <div>
          <div className="form-row block-row">
            <input
              type="email"
              ref={(c) => {
                this.forgotLoginEmail = c;
              }}
              placeholder={i18n.__("forgotpassword.Enter email")}
              onKeyPress={(event) => {
                if (event.key == "Enter") {
                  this.forgotPassword(event);
                }
              }}
            />
          </div>
          {this.state.forgotEmailErrors.map((message) => (
            <span className="login-message-warning" key={message}>
              {message}
              <br />
            </span>
          ))}
          <div className="clearix">
            <Button
              onClick={this.forgotPassword}
              variant="contained"
              color="primary"
              fullWidth={true}
            >
              {i18n.__("forgotpassword.Reset your password")}
            </Button>
          </div>
          <span className="login-message-warning">
            {this.state.forgotLoginError}
          </span>
        </div>
      );
    }
  };

  login = async (event) => {
    event.preventDefault();
    var thisComponent = this;

    if (this.state.checkOTP) {
      const otp = this.state.OTPfieldValue;
      try {
        const isValid = hotp.check(otp, this.state.twoFactorAuthData.secret, 1);
        if (isValid) {
          this.userLoginWithPassword(this.state.userid, this.state.password);
        } else {
          this.setState({
            loginError: ["The OTP you entered could not be authenticated"],
          });
          setTimeout(function () {
            this.setState({ loginError: [] });
          }, 3000);
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const userid = this.userid.value.replace(/\s+/g, "").toLowerCase().trim();
    const password = this.password.value.trim();
    var useridErrors = [];
    var passwordErrors = [];
    this.setState({ userid, password });
    if (userid == "") useridErrors.push(i18n.__("login.Username is required"));
    if (password == "")
      passwordErrors.push(i18n.__("login.Password is required"));
    if (password.length < 6)
      passwordErrors.push(i18n.__("login.6 character minimum password"));

    if (useridErrors.length == 0 && passwordErrors.length == 0) {
      //disable login button
      this.setState({ enableLogin: false });
      //check password and send OTP
      Meteor.call(
        "twoFactorAuthStepOne",
        userid,
        password,
        function (Error, result) {
          if (Error) {
            thisComponent.setState({ loginError: Error.error });
            setTimeout(function () {
              thisComponent.setState({ loginError: [] });
            }, 3000);
          } else {
            //check twoFactor-auth enabled, else bypass to password login
            if (result.twoFactorEnabled) {
              thisComponent.setState({ twoFactorAuthData: result });
              thisComponent.userid.value = "";
              thisComponent.setState({ checkOTP: true });
              thisComponent.setState({ currentBox: "OTPVerificationBox" });
            } else {
              thisComponent.userLoginWithPassword(
                thisComponent.state.userid,
                thisComponent.state.password
              );
            }
          }
          //enable login button
          thisComponent.setState({ enableLogin: true });
        }
      );
    } else {
      this.setState({ useridErrors, passwordErrors });
      setTimeout(function () {
        thisComponent.setState({ useridErrors: [], passwordErrors: [] });
      }, 3000);
    }
  };

  //resend otp
  resendOTP = (event) => {
    event.preventDefault();
    var thisComponent = this;
    this.setState({ enableResendOTPButton: false });
    Meteor.call(
      "twoFactorAuthStepOne",
      this.state.userid,
      this.state.password,
      function (Error, result) {
        if (Error) {
          thisComponent.setState({ loginError: Error.error });
          setTimeout(function () {
            thisComponent.setState({ loginError: [] });
          }, 3000);
        } else {
          thisComponent.setState({ twoFactorAuthData: result });
          thisComponent.setState({ checkOTP: true });
          thisComponent.setState({ currentBox: "OTPVerificationBox" });
          setTimeout(function () {
            thisComponent.setState({ enableResendOTPButton: true });
          }, 20000);
          alert(
            "Your verification code was sent to your email, In case you missed the email, you can resend the code after 20 seconds only. Thank you."
          );
        }
      }
    );
  };

  //login using password
  userLoginWithPassword = (userid, password) => {
    Meteor.loginWithPassword(userid, password, function (Error) {
      if (Error) {
        var error = Error.message;
        var formattedError = error.substring(0, error.length - 5);
        thisComponent.setState({ loginError: formattedError });
        setTimeout(function () {
          thisComponent.setState({ loginError: [] });
        }, 3000);
      } else {
        // Store login activity
        let appSource = "web";
        let appPlatform = "web";
        if (window.cordova) {
          document.addEventListener("deviceready", onDeviceReady, false);
          function onDeviceReady() {
            if (device.platform == "iOS") {
              appSource = "appstore";
              appPlatform = "iOS";
            }
            if (device.platform == "Android") {
              appPlatform = "android";
              if (
                cordova.appInfoSync.identifier ==
                "com.app.org_placeholder.postrubella.live"
              ) {
                appSource = "playstore";
              } else {
                appSource = "standalone";
              }
            }
          }
        }
        Meteor.call(
          "userLoginActivity.insert",
          Meteor.user(),
          appSource,
          appPlatform
        );
      }
    });
  };

  forgotPassword = async (event) => {
    event.preventDefault();
    var thisComponent = this;
    const forgotLoginEmail = this.forgotLoginEmail.value.trim();
    var forgotEmailErrors = [];
    if (forgotLoginEmail == "")
      forgotEmailErrors.push(i18n.__("forgotpassword.Email is required"));
    if (forgotLoginEmail.length <= 6)
      forgotEmailErrors.push(
        i18n.__("forgotpassword.Please enter a valid email address")
      );

    if (forgotEmailErrors.length == 0) {
      Accounts.forgotPassword({ email: forgotLoginEmail }, function (Error) {
        if (Error) {
          var error = Error.message;
          var formattedError = error.substring(0, error.length - 5);
          thisComponent.setState({ forgotLoginError: formattedError });
          setTimeout(function () {
            thisComponent.setState({ forgotLoginError: [] });
          }, 3000);
        } else {
          alert("Password reset link has been sent to your email");
        }
      });
    } else {
      this.setState({ forgotEmailErrors });
      setTimeout(function () {
        thisComponent.setState({ forgotEmailErrors: [] });
      }, 3000);
    }
  };

  renderNotice() {
    if (window.cordova) {
      const currentVersion = cordova.appInfoSync.version;
      const { config } = this.props;

      // no notice in offline
      if (!config) return;

      const serverVersion = config.version;

      // codeVersion - global. see getAppInfo.js
      if (serverVersion === codeVersion) return;
      if (serverVersion === currentVersion) return;

      return (
        <NoticeHeader>
          {i18n.__("common.Your app is out of date")}
          <br />
          {i18n.__("common.Please download the latest version")}
          <br />
        </NoticeHeader>
      );
    }
  }
  render() {
    return (
      <div style={styles()} className="flex flex-center px2">
        {/* Loader code- Start  */}
        {this.state.loading ? (
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
          </div>
        ) : (
          ""
        )}
        {/* Loader code- End  */}
        <div className="mx-auto width600">
          <div className="center">
            <img
              src={`${publicDir}/svg/logo.svg`}
              alt="org_placeholder postrubella"
            />
          </div>

          <div className="center mt2">{this.renderNotice()}</div>
          <div className="center mt2">{this.currentBox()}</div>
          <div className="center mt2">
            <a
              href="#"
              className="forgot-password-btn"
              onClick={this.switchBox}
            >
              {this.state.currentBox == "LoginBox"
                ? "Forgot your password?"
                : "Sign In"}
            </a>
          </div>

          {this.renderDownloadLink()}
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  Meteor.subscribe("config.version");

  return {
    config: Config.find().fetch()[0],
  };
})(Login);
