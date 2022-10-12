import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import moment from "moment";
import fetchPouchDB from "../../client/cordova/fetchPouchDB";
import {
  getParcelsDb,
  getCoreDb,
  dbCoreReset,
  dbParcelsReset,
} from "../../lib/PouchDB";
import "/imports/languages/en/en.sync.i18n.yml";
import "/imports/languages/de/de.sync.i18n.yml";
import "/imports/languages/en-JM/en-JM.sync.i18n.yml";

import Button from "@material-ui/core/Button";

/**
 * MongoDB API: Getting collection for PouchDB put.
 */

import {
  Carriers,
  Senders,
  Locations,
  DeliveryTypes,
  Clients,
  Recipients,
  Parcels,
} from "/imports/api/";

const fixGet = (err) => {
  if (err.status === 404) {
    return {};
  }

  return err;
};

const checkExists = (doc) => doc.collection && doc.collection.length;

class SyncCore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastSynced: false,
      inProgress: false,
      parcelsOfflineCreated: [],
      parcelsOfflineEdited: [],
      counts: {},
    };
  }

  componentDidMount() {
    this.fetchCoreData();
    this.countOfflineItems();
    this.countHandler = Meteor.setInterval(this.countOfflineItems, 5000);
  }
  componentWillUnmount() {
    Meteor.clearInterval(this.countHandler);
  }
  countOfflineItems = () => {
    Meteor.call("sync.counts", (error, counts) => {
      if (error) return console.error(error);

      this.setState({ counts });
    });
  };
  async fetchCoreData() {
    const coreData = await fetchPouchDB();

    coreData.parcelsOfflineCreated = [];
    coreData.parcelsOfflineEdited = [];
    if (coreData.parcels) {
      coreData.parcels = coreData.parcels.filter((parcel) => {
        // unchanged parcels
        if (!parcel.offline) return true;

        if (!parcel.createdAt) {
          coreData.parcelsOfflineCreated.push(parcel);

          return false;
        }

        // edited parcels but loaded from server
        coreData.parcelsOfflineEdited.push(parcel);

        return true;
      });
    }

    this.setState(coreData);
  }

  removeDocs = async () => {
    try {
      // get data from main DB
      const coreDb = await getCoreDb();
      let parcelsDb = await getParcelsDb();

      const [
        parcels,
        lastSynced,
        carriers,
        locations,
        senders,
        deliveryTypes,
        recipients,
        users,
        clients,
        currentUser,
        destinations,
        sendersWithEmail,
      ] = await Promise.all([
        parcelsDb.allDocs({ include_docs: true }).catch(fixGet),
        coreDb.get("lastSynced").catch(fixGet),
        coreDb.get("carriers").catch(fixGet),
        coreDb.get("locations").catch(fixGet),
        coreDb.get("senders").catch(fixGet),
        coreDb.get("deliveryTypes").catch(fixGet),
        coreDb.get("recipients").catch(fixGet),
        coreDb.get("users").catch(fixGet),
        coreDb.get("clients").catch(fixGet),
        coreDb.get("currentUser").catch(fixGet),
        coreDb.get("destinations").catch(fixGet),
        coreDb.get("sendersWithEmail").catch(fixGet),
      ]);

      // save offline parcels
      let parcelsOffline = [];

      // reset db ~ 80ms with 170 parcels:
      if (parcels.total_rows) {
        parcelsOffline = parcels.rows
          .map(({ doc }) => doc)
          .filter(({ offline }) => offline);
        await dbParcelsReset();
        parcelsDb = await getParcelsDb();
      }

      // remove each parcel ~ 1600ms (20x slower) with 170 parcels:
      // await Promise.all(parcels.rows.map(({ doc }) => parcelsDb.remove(doc)));
      await Promise.all([
        parcelsOffline.length && parcelsDb.bulkDocs(parcelsOffline),
        checkExists(lastSynced) && coreDb.remove(lastSynced),
        checkExists(carriers) && coreDb.remove(carriers),
        checkExists(locations) && coreDb.remove(locations),
        checkExists(senders) && coreDb.remove(senders),
        checkExists(deliveryTypes) && coreDb.remove(deliveryTypes),
        checkExists(recipients) && coreDb.remove(recipients),
        checkExists(users) && coreDb.remove(users),
        checkExists(clients) && coreDb.remove(clients),
        checkExists(currentUser) && coreDb.remove(currentUser),
        checkExists(destinations) && coreDb.remove(destinations),
        checkExists(sendersWithEmail) && coreDb.remove(sendersWithEmail),
      ]);
    } catch (err) {
      console.log(err);
      Meteor.call(
        "sendToSlack",
        `Sync removeDocs error: ${err.message}, stack: ${
          err.stack
        }. \n${getAppInfo()}`
      );
    }
  };
  syncDocs = async () => {
    const { inProgress, lastSynced } = this.state;
    const { status, remoteDataReady } = this.props;
    // const connection = Meteor.status().status;
    //
    // if (connection !== 'connected'){
    //     return alert(`You're offline. Please ensure you have an reliable internet connection before syncing to your postrubella.`);
    // }

    if (!status.connected) {
      return console.log("You are offline!");
    }
    if (!remoteDataReady) {
      return console.log("Data is not yet loaded!");
    }
    if (inProgress) {
      return console.log("Please wait!");
    }
    const user = Meteor.user();
    const syncTime = new Date();

    if (!user) {
      return console.error("Meteor.user() is undefined, aborting sync");
    }

    this.setState({
      inProgress: true,
    });

    // @TODO: OPTIMIZATION POSSIBLE - SYNC ONLY NEW DATA (1)
    // if (lastSynced !== false) {
    //   query.gt = lastSynced;
    // }

    // collections
    const {
      parcels,
      carriers,
      locations,
      senders,
      deliveryTypes,
      recipients,
      users,
      clients,
    } = this.props;

    const sendersWithEmail = [];
    const destinations = [];

    // add/re-add docs
    try {
      const coreDb = await getCoreDb();

      if (
        typeof clients[0].clientGroupId !== "undefined" &&
        clients[0].clientGroupId !== ""
      ) {
        Meteor.call("senders.sendersWithEmail", async function (err, result) {
          if (err) {
            console.log(err);
          }
          if (result) {
            result.map((value) => {
              sendersWithEmail.push({
                _id: value._id,
                senderName: value.senderName,
              });
            });
            await coreDb.bulkDocs([
              { collection: sendersWithEmail, _id: "sendersWithEmail" },
            ]);
          }
        });
        Meteor.call(
          "clientsGroups.clientsLists",
          { clientGroupId: clients[0].clientGroupId },
          async function (err, result) {
            if (err) {
              console.log(err);
            }
            if (result) {
              result.map((value) => {
                destinations.push({
                  _id: value._id,
                  clientName: value.clientName,
                });
              });
              await coreDb.bulkDocs([
                { collection: destinations, _id: "destinations" },
              ]);
            }
          }
        );
      }

      if (lastSynced === false) {
        // @TODO: OPTIMIZATION POSSIBLE - SYNC ONLY NEW DATA (2)
      }

      let currentUserLang = "en";
      //if user set the language
      if (
        typeof user.profile.language !== "undefined" &&
        user.profile.language !== ""
      ) {
        currentUserLang = user.profile.language;
      }
      //if user not set the language
      else {
        if (
          typeof clients[0].defaultLanguage !== "undefined" &&
          clients[0].defaultLanguage !== ""
        ) {
          currentUserLang = clients[0].defaultLanguage;
        }
      }

      const currentUser = {
        owner: user._id,
        username: user.username,
        clientId: user.profile.clientId,
        timezone: user.profile.timezone,
        language: currentUserLang,
      };

      // remove old docs
      await this.removeDocs();

      const parcelsDb = await getParcelsDb();

      await parcelsDb.bulkDocs(parcels);
      await coreDb.bulkDocs([
        { collection: syncTime, _id: "lastSynced" },
        { collection: carriers, _id: "carriers" },
        { collection: locations, _id: "locations" },
        { collection: senders, _id: "senders" },
        { collection: deliveryTypes, _id: "deliveryTypes" },
        { collection: recipients, _id: "recipients" },
        { collection: users, _id: "users" },
        { collection: clients, _id: "clients" },
        { collection: currentUser, _id: "currentUser" },
      ]);
      await this.fetchCoreData();
    } catch (err) {
      console.log(err);
      Meteor.call(
        "sendToSlack",
        `Sync error: ${err.message}, stack: ${err.stack}. \n${getAppInfo()}`
      );
    }
    this.setState({
      inProgress: false,
    });
  };

  // @TODO: Add a function to secure this reset. E.g type `DELETE` to proceed
  resetAllDatabases = async () => {
    this.setState({
      inProgress: true,
    });
    await Promise.all([dbCoreReset(), dbParcelsReset()]);
    Session.set("parcelsOffline", []);
    await this.fetchCoreData();
    this.setState({
      inProgress: false,
    });
  };

  renderDataStats() {
    const { connected } = this.props.status;

    const dataLabels = Object.entries({
      parcels: i18n.__("common.Parcels"),
      parcelsOffline: i18n.__("common.Parcels offline"),
      carriers: i18n.__("common.Carriers"),
      senders: i18n.__("common.Senders"),
      locations: i18n.__("common.Locations"),
      deliveryTypes: i18n.__("common.Delivery types"),
      recipients: i18n.__("common.Recipients"),
      clients: i18n.__("common.Clients"),
      users: i18n.__("common.Users"),
    });

    const rows = new Array(dataLabels.length + 1);

    dataLabels.forEach(([key, caption]) => {
      if (key === "parcelsOffline") {
        rows.push(
          <tr key="Parcels offline">
            <td>Parcels offline</td>
            <td>created:</td>
            <td>{this.state.parcelsOfflineCreated.length}</td>
            <td>edited:</td>
            <td>{this.state.parcelsOfflineEdited.length}</td>
          </tr>
        );

        return;
      }

      let remoteItemsCount = "-";

      if (connected) {
        remoteItemsCount =
          this.state.counts[key] ||
          (this.props[key] ? this.props[key].length : 0);
      }

      rows.push(
        <tr key={key}>
          <td>{caption}</td>
          <td>{i18n.__("sync.remote")}:</td>
          <td>{remoteItemsCount}</td>
          <td>{i18n.__("sync.local")}:</td>
          <td>{this.state[key] ? this.state[key].length : 0}</td>
        </tr>
      );
    });

    return (
      <table className="syncDetails">
        <tbody>{rows}</tbody>
      </table>
    );
  }

  renderStats() {
    const { lastSynced } = this.state;
    const syncedAt =
      lastSynced === false
        ? i18n.__("common.never")
        : moment(lastSynced).format("Do MMM YYYY - h:mm:ss a");

    return (
      <div className="mb1">
        {i18n.__("sync.Last Synced")}: {syncedAt}
      </div>
    );
  }

  renderSyncDetails() {
    const { inProgress, lastSynced } = this.state;
    const { status, remoteDataReady } = this.props;

    if (!status.connected || !remoteDataReady) {
      return (
        <div className="sync-status" style={{ backgroundColor: "gray" }}>
          <div className="sync-status-text">
            {" "}
            {i18n.__("sync.Connecting")}....
          </div>
        </div>
      );
    }

    if (inProgress) {
      return (
        <div className="sync-status" style={{ backgroundColor: "orange" }}>
          <div className="sync-status-text">
            {" "}
            {i18n.__("sync.Please wait")}..
          </div>
          <div className="sync-status-button">
            {i18n.__(
              "sync.Attempting to sync your item(s) and core collections"
            )}
            .
          </div>
        </div>
      );
    } else if (lastSynced === false) {
      return (
        <div
          className="sync-status"
          style={{ backgroundColor: "red" }}
          onClick={this.syncDocs}
        >
          <div className="sync-status-text">
            {" "}
            {i18n.__(
              "sync.Please sync the core postrubella collections for the first time"
            )}
            .
          </div>
          <div className="sync-status-button">
            {i18n.__("sync.Click to SYNC with live")}.
          </div>
        </div>
      );
    }

    return (
      <div
        className="sync-status"
        style={{ backgroundColor: "green", cursor: "pointer" }}
        onClick={this.syncDocs}
      >
        <div className="sync-status-text"> {i18n.__("common.Success")}!</div>
        <div className="sync-status-button">
          {i18n.__("sync.All your item(s) have been synced to live")}.<br />
          {i18n.__("sync.Make sure the remote and local counts are the same")}.
        </div>
        <div className="sync-status-button">
          <i>{i18n.__("sync.Click to RE-SYNC data")}.</i>
        </div>
      </div>
    );
  }

  renderReset() {
    return (
      <div>
        {i18n.__("sync.Are you having issue with offline storage")}?
        <div className="margin-bottom-65">
          <Button
            onClick={() => {
              if (
                confirm(
                  i18n.__("sync.ARE YOU SURE? YOU CAN NOT REVERSE THIS") + "!"
                )
              )
                this.resetAllDatabases();
            }}
            // color="secondary"
            style={{
              backgroundColor: "#f32013",
              color: "#FFFFFF",
              fontWeight: "bold",
            }}
            variant="contained"
          >
            {i18n.__("sync.Click here to reset")}
          </Button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderSyncDetails()}
        {this.renderStats()}
        {this.renderDataStats()}
        {this.renderReset()}
      </div>
    );
  }
}

export default withTracker(() => {
  const status = Meteor.status();
  let remoteDataReady = false;

  if (status.connected) {
    remoteDataReady = [
      Meteor.subscribe("parcelsUndelivered"),
      Meteor.subscribe("locations"),
      Meteor.subscribe("deliveryTypes"),
      Meteor.subscribe("allUsers"),
      Meteor.subscribe("currentClient"),
      Meteor.subscribe("carriers.app"),
      Meteor.subscribe("senders.app"),
      Meteor.subscribe("recipients.app"),
    ].every((item) => item.ready());
  }

  const user = Meteor.user();
  const query = {};
  if (user) query.clientId = user.profile.clientId;

  return {
    remoteDataReady,
    status,
    parcels: Parcels.find().fetch(),
    locations: Locations.find().fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    users: Meteor.users.find({}).fetch(),
    clients: Clients.find().fetch(),
    carriers: Carriers.find({}, { sort: { carrierName: 1 } }).fetch(),
    senders: Senders.find({}, { sort: { senderName: 1 } }).fetch(),
    recipients: Recipients.find({}, { sort: { recipientName: 1 } }).fetch(),
  };
})(SyncCore);
