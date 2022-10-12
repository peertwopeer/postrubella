import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import DashboardButton from "/imports/ui/components/DashboardButton.jsx";
import fetchPouchDB from "/imports/client/cordova/fetchPouchDB";
import { Clients } from "/imports/api/clients.js";
import "/imports/languages/en/en.dashboard.i18n.yml";
import "/imports/languages/de/de.dashboard.i18n.yml";
import "/imports/languages/en-JM/en-JM.dashboard.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      receiveFlag: 0,
    };
    if (!this.props.parcelsOffline) Session.set("parcelsOffline", []);
  }
  componentDidMount() {
    this._isMounted = true;
    {
      this.showSyncAlert();
    }
    if (!this.props.status.connected) this.setLanguageFromPouchdb();
  }

  async setLanguageFromPouchdb() {
    const pouchData = await fetchPouchDB();
    if (pouchData.syncStatus) {
      if (pouchData.currentUser) {
        i18n.setLocale(pouchData.currentUser.language);
      }
    }
  }

  showSyncAlert() {
    if (Meteor.isCordova) {
      const offlineParcels = Session.get("parcelsOffline")
        ? Session.get("parcelsOffline")
        : [];
      if (offlineParcels.length !== 0) {
        return (
          <div>
            {alert(
              i18n.__(
                "dashboard.Please sync your postrubella before taking any other actions on offline inbound or outbound items"
              )
            )}
          </div>
        );
      }
    }
  }

  render() {
    let inboundLink = "/inbound";
    let outboundLink = "/outbound";
    let postrubellaLink = "/postrubella";
    let addLink = "/add";
    let postbagLink = "/postbag";

    if (Meteor.isCordova) {
      inboundLink = "/inbound/offline";
      outboundLink = "/outbound/offline";
      postrubellaLink = "/postrubella/offline";
      addLink = "/add/offline";
      postbagLink = "/postbag/offline";
    }

    return (
      <div className="width-narrow">
        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-receive.svg`} alt="Inbound" />}
          title={i18n.__("dashboard.Inbound")}
          description={i18n.__(
            "dashboard.Scan an item, assign location and add to the postrubella"
          )}
          link={inboundLink}
        />

        <DashboardButton
          icon={
            <img src={`${publicDir}/svg/icon-receive.svg`} alt="Outbound" />
          }
          title={i18n.__("dashboard.Outbound")}
          description={i18n.__(
            "dashboard.Scan an item, assign location to be sent out"
          )}
          link={outboundLink}
        />

        <DashboardButton
          icon={
            <img
              src={`${publicDir}/svg/icon-postrubella.svg`}
              alt="postrubella"
            />
          }
          title={i18n.__("dashboard.postrubella")}
          description={i18n.__(
            "dashboard.All items in the postrubella awaiting delivery"
          )}
          link={postrubellaLink}
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-postbag.svg`} alt="Postbag" />}
          title={i18n.__("dashboard.Postbag")}
          description={i18n.__(
            "dashboard.Add to your Postbag awaiting to delivered"
          )}
          link={addLink}
        />

        <DashboardButton
          icon={
            <img src={`${publicDir}/svg/icon-deliver.svg`} alt="My Delivery" />
          }
          title={i18n.__("dashboard.My Delivery")}
          description={i18n.__(
            "dashboard.View post in your Postbag awaiting delivery"
          )}
          link={postbagLink}
        />

        <DashboardButton
          icon={<img src={`${publicDir}/svg/icon-reports.svg`} alt="Sync" />}
          title={i18n.__("dashboard.Sync")}
          description={i18n.__("dashboard.Sync core postrubella")}
          link="/sync"
        />
      </div>
    );
  }
}
export default withTracker(() => {
  const user = Meteor.user();
  const currentClientSub = Meteor.subscribe("currentClient").ready();
  //set language
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
      if (currentClientSub) {
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
  return {
    parcelsOffline: Session.get("parcelsOffline") || [],
    status: Meteor.status(),
  };
})(Dashboard);
