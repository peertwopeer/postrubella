import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import Button from "@material-ui/core/Button";
import { Accounts } from "meteor/accounts-base";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import "/imports/languages/en/en.resetpassword.i18n.yml";
import "/imports/languages/en-JM/en-JM.resetpassword.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

function styles() {
  return {
    height: "90vh",
  };
}

class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changePasswordMessage: [],
    };
  }

  updatePassword = async (event) => {
    const newPassword = this.usernewpassword.value.trim();
    const confirmPassword = this.userconfirmpassword.value.trim();
    var message = [];
    var strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*-])(?=.{6,})"
    );

    if (newPassword == "")
      message.push(i18n.__("resetpassword.Please fill the password field"));

    if (confirmPassword == "")
      message.push(
        i18n.__("resetpassword.Please fill the confirm password field")
      );

    if (newPassword !== confirmPassword)
      message.push(
        i18n.__("resetpassword.New Password and Confirm Password is not same")
      );

    if (strongRegex.test(newPassword)) {
      console.log("Password strength ok");
    } else {
      if (newPassword.length < 6) {
        message.push(
          i18n.__(
            "resetpassword.New Password should be minimum 6 characters long"
          )
        );
      } else {
        message.push(
          i18n.__(
            "resetpassword.New Password should contain at least 1 upper character, 1 lower character, 1 number and 1 special character"
          )
        );
      }
    }

    if (message.length == 0) {
      Accounts.resetPassword(this.props.token, newPassword, function (error) {
        if (error) {
          alert(error.message);
        } else {
          FlowRouter.go("/");
        }
      });
      // Meteor.call()
    } else {
      this.setState({ changePasswordMessage: message });
    }
  };

  routeHome() {
    FlowRouter.go("/");
  }

  render() {
    return (
      <div style={styles()} className="flex flex-center px2">
        <div className="mx-auto">
          <div className="center">
            <img
              src={`${publicDir}/svg/logo.svg`}
              alt="org_placeholder postrubella"
            />
          </div>

          <br />

          <div className="form-row block-row">
            <input
              type="password"
              ref={(c) => {
                this.usernewpassword = c;
              }}
              placeholder={i18n.__("resetpassword.New Password")}
            />
          </div>
          <div className="form-row block-row">
            <input
              type="password"
              ref={(c) => {
                this.userconfirmpassword = c;
              }}
              placeholder={i18n.__("resetpassword.Confirm New Password")}
            />
          </div>

          {this.state.changePasswordMessage.map((message) => (
            <p key={message}>{message}</p>
          ))}

          <div className="block-meta clearix">
            <Button
              onClick={this.updatePassword}
              variant="contained"
              color="primary"
              fullWidth={true}
            >
              {i18n.__("resetpassword.Reset Password")}
            </Button>
          </div>

          <form className="accounts-ui">
            <div className="buttons">
              <a onClick={this.routeHome}>{i18n.__("resetpassword.Go Home")}</a>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default withTracker(() => ({}))(ResetPassword);
