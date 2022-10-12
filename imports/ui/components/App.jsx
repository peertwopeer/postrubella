import React, { Component } from "react";
import PropTypes from "prop-types";
import { withTracker } from "meteor/react-meteor-data";
import Login from "/imports/ui/components/Login";
import { SyncParcels } from "/imports/ui/components/";
import { Config } from "/imports/api/config";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import IconButton from "@material-ui/core/IconButton";
import Checkbox from "@material-ui/core/Checkbox";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Button from "@material-ui/core/Button";
import Slide from "@material-ui/core/Slide";
import { MuiThemeProvider } from "@material-ui/core/styles";
import org_placeholderTheme from "/imports/lib/AppTheme";
import IconSettings from "/imports/ui/components/icons/IconSettings";
import IconAccount from "/imports/ui/components/icons/IconAccount";
import AppLogo from "/imports/ui/components/icons/AppLogo";
import PageHeader from "/imports/ui/components/icons/PageHeader";
import NoticeHeader from "/imports/ui/components/icons/NoticeHeader";
import { Meteor } from "meteor/meteor";
import { Clients } from "/imports/api/clients.js";
import i18n from "meteor/universe:i18n";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Footer from "/imports/ui/components/Footer";
import NavigatorForTabletView from "/imports/ui/components/NavigatorForTabletView";
import fetchPouchDB from "/imports/client/cordova/fetchPouchDB";
//styles
import "/imports/lib/AppTheme.min.css";
//languages
import "/imports/languages/en/en.common.i18n.yml";
import "/imports/languages/de/de.common.i18n.yml";
import "/imports/languages/en-JM/en-JM.common.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      termsAccepted: false,
      showTermsDialog: true,
      isTablet: window.innerWidth < 1000,
    };
  }

  getChildContext() {
    return { muiTheme: org_placeholderTheme };
  }

  componentDidMount() {
    if (window.cordova) {
      // app permissions
      const { permissions } = cordova.plugins;
      const error = () => console.warn("permission is not turned on");
      const success = (status) => {
        if (!status.hasPermission) error();
      };

      permissions.requestPermission(permissions.CAMERA, success, error);
      permissions.requestPermission(
        permissions.WRITE_EXTERNAL_STORAGE,
        success,
        error
      );
      if (!this.props.status.connected) this.setLanguageFromPouchdb();
    }
  }
  async setLanguageFromPouchdb() {
    const pouchData = await fetchPouchDB();
    if (pouchData.syncStatus) {
      if (pouchData.currentUser) {
        i18n.setLocale(pouchData.currentUser.language);
      }
    }
  }
  routeHome() {
    FlowRouter.go("/");
  }
  routeMe() {
    FlowRouter.go("/me");
  }
  routeAdmin() {
    FlowRouter.go("/admin");
  }

  appBarStyles() {
    return {
      minHeight: "45px",
      background: "#fff",
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
    };
  }
  logoStyles() {
    return {
      maxWidth: "190px",
      height: "auto",
    };
  }
  handleAcceptTerms(userId) {
    this.setState({ showTermsDialog: false });
    Meteor.call(
      "updateUserProfile",
      userId,
      { termsAccepted: true },
      function (Error) {
        if (Error) console.log(Error);
      }
    );
  }
  /**
   * Shows notice if need to update the version.
   *
   * Check that build or code (hot pushed) version is matching server
   * @returns {*}
   */
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
    const currentUserId = this.props.currentUserId;
    const isTablet = this.state.isTablet;

    if (FlowRouter.getRouteName() == "Reset Password")
      return (
        <MuiThemeProvider theme={org_placeholderTheme}>
          {" "}
          {this.props.content}{" "}
        </MuiThemeProvider>
      );

    if (FlowRouter.getRouteName() == "Login With Token")
      return (
        <MuiThemeProvider theme={org_placeholderTheme}>
          {" "}
          {this.props.content}{" "}
        </MuiThemeProvider>
      );

    if (currentUserId === null)
      return (
        <MuiThemeProvider theme={org_placeholderTheme}>
          <Login />
        </MuiThemeProvider>
      );

    return (
      <MuiThemeProvider theme={org_placeholderTheme}>
        <div className="app">
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

          {/* Terms Modal - Start  */}
          {typeof this.props.currentUser !== "undefined" &&
          !this.props.currentUser.profile.termsAccepted &&
          FlowRouter.getRouteName() !== "termsOfUse" ? (
            <Dialog
              open={this.state.showTermsDialog}
              TransitionComponent={Transition}
              disableEscapeKeyDown
              keepMounted
            >
              <DialogContent dividers>
                <Typography variant="h6" align="center" gutterBottom>
                  <b>{i18n.__("common.Updated Terms")}</b>
                </Typography>
                <Typography
                  variant="h6"
                  component="h2"
                  align="center"
                  gutterBottom
                >
                  {i18n.__("common.We ve revised our Terms of Use")}
                </Typography>
                <DialogContentText align="center">
                  <Checkbox
                    size="small"
                    onChange={() =>
                      this.setState({
                        termsAccepted: !this.state.termsAccepted,
                      })
                    }
                  />
                  {i18n.__(
                    "common.By ticking this box i agree to org_placeholder s"
                  )}{" "}
                  <Link
                    href=""
                    color="initial"
                    noWrap
                    underline="always"
                    onClick={() => {
                      this.setState({ termsAccepted: false });
                      FlowRouter.go("/termsOfUse");
                    }}
                  >
                    {i18n.__("common.Terms of Use")}
                  </Link>
                </DialogContentText>
                <div className="clearfix">
                  <div className="form-row left col col-6 sm-col-6 md-col-6">
                    <Button
                      onClick={() =>
                        this.handleAcceptTerms(this.props.currentUser._id)
                      }
                      fullWidth={true}
                      color="primary"
                      variant="contained"
                      disabled={!this.state.termsAccepted}
                    >
                      {i18n.__("common.Accept")}
                    </Button>
                  </div>
                  <div className="form-row right col col-6 sm-col-6 md-col-6">
                    <Button
                      onClick={() =>
                        Meteor.logout(function (err) {
                          if (!err) {
                            FlowRouter.go("/");
                          }
                        })
                      }
                      fullWidth={true}
                      color="inherit"
                      variant="contained"
                      disabled={this.state.termsAccepted}
                    >
                      {i18n.__("common.Deny")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
          {/* Terms Modal - End  */}
          <AppBar position="static" style={this.appBarStyles()}>
            <Toolbar>
              <div style={{ width: "25px" }}>
                {Roles.userIsInRole(currentUserId, [
                  "normal-user",
                  "group-admin",
                ]) ? (
                  ""
                ) : (
                  <IconButton
                    onClick={this.routeAdmin}
                    style={{
                      height: "25px",
                      padding: 0,
                      margin: "6px",
                      display: "block",
                    }}
                  >
                    <IconSettings viewBox="0 0 18 18" />
                  </IconButton>
                )}
                <IconButton
                  onClick={this.routeMe}
                  style={{
                    height: "25px",
                    padding: 0,
                    margin: "6px",
                    display: "block",
                  }}
                >
                  <IconAccount />
                </IconButton>
              </div>
              <AppLogo
                onClick={this.routeHome}
                style={this.logoStyles()}
                className="mx-auto py1 center logo"
              />
              <SyncParcels smallDialog />
              {!Meteor.isCordova && isTablet && (
                <div className="tablet-view">
                  <NavigatorForTabletView />
                </div>
              )}
            </Toolbar>
          </AppBar>
          <PageHeader title={i18n.__("common." + this.props.title)} />
          {this.renderNotice()}
          <main className="clearfix main-body">
            {this.props.navigation}
            <div className="inside">{this.props.content}</div>
          </main>
          <Footer />
        </div>
      </MuiThemeProvider>
    );
  }
}

App.childContextTypes = {
  muiTheme: PropTypes.object.isRequired,
};

export default withTracker(() => {
  const clientSubscription = Meteor.subscribe("currentClient").ready();
  const currentUserId = Meteor.userId();

  const user = Meteor.user();

  if (user) {
    //if user set the language
    if (
      typeof user.profile.language !== "undefined" &&
      user.profile.language !== ""
    ) {
      i18n.setLocale(user.profile.language);
    }
    //if user not set the language
    else {
      if (clientSubscription) {
        const currentClient = Clients.find({}).fetch();
        if (
          typeof currentClient[0].defaultLanguage !== "undefined" &&
          currentClient[0].defaultLanguage !== ""
        ) {
          i18n.setLocale(currentClient[0].defaultLanguage);
        }
      }
    }
  }

  Meteor.subscribe("config.version");

  return {
    currentUserId,
    currentUser: user,
    config: Config.find().fetch()[0],
    status: Meteor.status(),
  };
})(App);
