import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import Button from "@material-ui/core/Button";
import AppLogo from "/imports/ui/components/icons/AppLogo";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
export default class Download extends Component {
  handleAndroidSubmit = (event) => {
    const live = "https://postrubella.org_placeholder.io/";
    let downloadLink =
      "https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella.apk";

    if (Meteor.absoluteUrl() !== live) {
      downloadLink =
        "https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella-dev.apk";
    }
    window.open(downloadLink);
  };
  routeHome = () => {
    FlowRouter.go("/");
  };

  render() {
    return (
      <div className="block-download flex flex-center px2">
        <div className="mx-auto">
          <div className="center">
            <div className="inside">
              <div className="block-download-logo">
                <AppLogo onClick={this.routeHome} />
              </div>

              <div className="block-download-link">
                <Button
                  onClick={this.handleAndroidSubmit}
                  fullWidth={true}
                  color="primary"
                  variant="contained"
                >
                  Download Android App
                </Button>
              </div>

              <p
                style={{
                  maxWidth: "280px",
                  height: "auto",
                  margin: "20px auto",
                }}
              >
                If you're having any issues, then please ensure you've deleted
                the previous app from your android device before installing the
                latest version.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
