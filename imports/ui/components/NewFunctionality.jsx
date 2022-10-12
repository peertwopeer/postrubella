import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import AppLogo from "/imports/ui/components/icons/AppLogo";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import "/imports/languages/en/en.newfunctionality.i18n.yml";
import "/imports/languages/de/de.newfunctionality.i18n.yml";
import "/imports/languages/en-JM/en-JM.newfunctionality.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

export default class NewFunctionality extends Component {
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
      <div className="block-download1 flex flex-center px2">
        <div className="mx-auto">
          {Meteor.userId() !== null ? null : (
            <div className="center">
              <div className="inside">
                <div className="block-download-logo">
                  <AppLogo onClick={this.routeHome} />
                </div>
                <h2
                  style={{
                    maxWidth: "360px",
                    height: "auto",
                    margin: "40px auto",
                  }}
                >
                  {i18n.__("newfunctionality.What’s new in version  23.15")}{" "}
                </h2>
              </div>
            </div>
          )}

          <div
            className="row"
            style={{ margin: "20px auto", boxShadow: "0px 0px 5px #d9d9d9" }}
          >
            <div className="inside">
              <div className="md-col-12 lg-col-12" style={{}}>
                <h2>
                  {i18n.__(
                    "newfunctionality.Update: postrubella is now available on the Google Play store for Android!"
                  )}
                </h2>
                <p>
                  {i18n.__(
                    "newfunctionality.Using postrubella on a mobile device has never been easier Download on the Play store and never worry about updates again turn auto updates ON on your device and we will do the rest!"
                  )}
                </p>
                <br />

                <div className="container">
                  <p>
                    {i18n.__(
                      "newfunctionality.You will require a Google account on your device.If there is not one already please do the following:"
                    )}
                  </p>
                  <ol>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Head into the Settings of your device"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Scroll down and tap on the Accounts option"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Tap on the Add account option at the bottom of your screen"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>{i18n.__("newfunctionality.Select Google")}</b>
                    </li>
                    <li>
                      <b>{i18n.__("newfunctionality.Tap on create account")}</b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Follow on-screen instructons by entering your info, selecting a username (EG:SmlthStreetpostrubella),  etc"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Tap the I Agree button to create your Google account"
                        )}
                      </b>
                    </li>
                  </ol>
                </div>
                <div className="container">
                  <p>{i18n.__("newfunctionality.To download the app:")}</p>
                  <ol>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Tap the Play store icon on your device"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Enter in the search bar postrubella"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Select the postrubella application with the org_placeholder logo"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>{i18n.__("newfunctionality.Tap Download")}</b>
                    </li>
                    <li>
                      <b>
                        {i18n.__(
                          "newfunctionality.Once downloaded login as usual"
                        )}
                      </b>
                    </li>
                    <li>
                      <b>
                        {i18n.__("newfunctionality.Head back to Play store")}
                      </b>
                    </li>
                    <li>
                      <b>{i18n.__("newfunctionality.Go to Settings")}</b>
                    </li>
                    <li>
                      <b>
                        {i18n.__("newfunctionality.Enable Auto App Updates")}
                      </b>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div
            className="row"
            style={{ margin: "20px auto", boxShadow: "0px 0px 5px #d9d9d9" }}
          >
            <div className="inside">
              <div className="md-col-12 lg-col-12" style={{}}>
                <h3>{i18n.__("newfunctionality.Update 1: New Dashboard ")}</h3>
                <p>
                  {i18n.__(
                    "newfunctionality.Get an overview of your postrubella on your home page. Track overdue mail, see your report data at a glance and filter by date/time and location!"
                  )}
                </p>

                <div className="center">
                  <div className="inside">
                    <img
                      alt="org_placeholder|postrubella"
                      src={`${publicDir}/whats_new/image_4.png`}
                      style={{
                        width: "100%",
                        maxWidth: "600px",
                        height: "auto",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="row"
            style={{ margin: "20px auto", boxShadow: "0px 0px 5px #d9d9d9" }}
          >
            <div className="inside">
              <div className="md-col-12 lg-col-12" style={{}}>
                <h3>
                  {i18n.__(
                    "newfunctionality.Update 2: Two Factor Authentication"
                  )}
                </h3>
                <p>
                  {i18n.__(
                    "newfunctionality.Increase your postrubella’s security by enabling two factor authentication! Contact the org_placeholder team to switch this feature ON!"
                  )}
                </p>

                <div className="center">
                  <div className="inside">
                    <img
                      alt="org_placeholder|postrubella"
                      src={`${publicDir}/whats_new/image_5.png`}
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "auto",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="row"
            style={{ margin: "20px auto", boxShadow: "0px 0px 5px #d9d9d9" }}
          >
            <div className="inside">
              <div className="md-col-12 lg-col-12" style={{}}>
                <h3>
                  {i18n.__(
                    "newfunctionality.Update 3: No More Duplicate Barcodes"
                  )}
                </h3>
                <p>
                  {i18n.__(
                    "newfunctionality.You no longer need to worry about barcodes being inputted twice by mistake, org_placeholder postrubella will prevent this occurring with a handy warning!"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
