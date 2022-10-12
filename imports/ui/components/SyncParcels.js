import React, { Component }            from 'react';
import { Meteor }                      from 'meteor/meteor';
import { withTracker }                 from 'meteor/react-meteor-data';
import { getParcelsDb }                from '../../lib/PouchDB';
import { Session }                     from 'meteor/session';
import { FlowRouter }                  from 'meteor/ostrio:flow-router-extra';
import _                               from 'lodash';

/**
 * MongoDB API: Getting collection for PouchDB put.
 */

import { Clients } from '/imports/api/';
import moment from 'moment/moment';
import '/imports/languages/en/en.sync.i18n.yml';
import '/imports/languages/de/de.sync.i18n.yml';
import '/imports/languages/en-JM/en-JM.sync.i18n.yml';

class SyncParcels extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inProgress: false,
    };

    if (!this.props.parcelsOffline) Session.set('parcelsOffline', []);
  }

  componentDidMount() {
    this.checkSyncStatus();
  }
  componentWillUnmount() {

  }

  checkSyncStatus = async () => {
    const options = {
      include_docs: true,
    };

    let parcelsOffline = [];

    try {
      const parcelsDb = await getParcelsDb();
      const allDocs = await parcelsDb.allDocs(options);

      parcelsOffline = allDocs.rows
        .filter(({ doc }) => doc.offline)
        .map(({ doc }) => doc);
    } catch (err) {
      console.log(err);
    }
    Session.set('parcelsOffline', parcelsOffline);
  };

  /**
   * Sync offline created/edited parcels to server.
   *
   * 1. Gets parcels with offline==true from pouchDB
   * 2. sync each parcel to server
   * 3. remove parcel from pouchDb (to avoid conflicts) or
   * 4. add parcel to pouchDb if it is not delivered
   * 5. send emails about new received or inbound delivered parcels
   *
   * @returns {Promise<void>}
   *
   * TODO: don't reload page by updating all relative data
   * TODO: detect reason of errors:
   *  - Error Syncing: database is destroyed.
   *  - Error Syncing: missing.
   *  - Error Syncing: Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing..
   *  - Error Syncing: Document update conflict.
   */
  syncParcels = async () => {
    const {
      currentClient,
      parcelsOffline,
      status,
    } = this.props;
    const {
      inProgress,
    } = this.state;

    if (!status.connected) return console.log('You are offline!');
    if (inProgress) return console.log('already syncing!');

    const parcelsDb = await getParcelsDb();

    if (!currentClient) return;

    this.setState({
      inProgress: true,
    });

    let parcelsToSendemail = [];
    let locationsToSendemail = [];

    for (let i = 0; i < parcelsOffline.length; i += 1) {
      const doc = parcelsOffline[i];
      let temp = false
      if(doc.temp){
        delete doc.temp;
        temp = true
      }
      
      const {
        _id: parcelId,
        location,
        locationId,
        deliveredAt,
        attemptedToDeliver,
      } = doc;
      if ((typeof attemptedToDeliver !== 'undefined' || null) && (typeof deliveredAt === 'undefined')) {
        await Meteor.call('attemptedToDeliverEmail',{ 
          locationId: locationId, 
          utcOffset: moment().utcOffset()
        });
      }
      
      
      if((typeof doc.deliveredAt !== 'undefined' &&  typeof doc.deliveredByUsername !== 'undefined' && typeof doc.signee !== 'undefined')){
        locationsToSendemail.push({_id: locationId,locationName: location});
        parcelsToSendemail.push(doc);
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          Meteor.call("parcels.sync", doc.parcelId != undefined ? doc.parcelId : parcelId, doc, (error, newDoc) => {
            if (error) {
              reject(error);
            } else {
              if (newDoc.destination != undefined) {
                if (newDoc.deliveredByOwner == undefined && doc.parcelId == undefined) {
                  Meteor.call(
                    "parcelLogs.add",
                    {
                      parcelId: newDoc._id,
                      barcode: newDoc.barcode,
                      clientId: currentClient.clientId,
                      clientName: currentClient.clientName,
                      clientUniqueBarcode: newDoc.clientUniqueBarcode,
                      destination: newDoc.destination,
                      destinationId: newDoc.destinationId,
                      createdAt: newDoc.createdAt,
                      updatedAt: newDoc.updatedAt,
                    },
                    function (error, result) {
                      if (error) {
                        console.log(error);
                        reject(error);
                      }
                    }
                  );
                }
                if (doc.parcelId != undefined || newDoc.deliveredByOwner != undefined) {
                  Meteor.call(
                    "parcelLogs.update",
                    {
                      parcelId: doc.parcelId != undefined ? doc.parcelId : parcelId,
                      status: newDoc.deliveredByOwner != undefined ? "delivered" : "sorting",
                      clientId: currentClient.clientId,
                      clientName: currentClient.clientName,
                      destination: newDoc.destination,
                      destinationId: newDoc.destinationId,
                      updatedAt: newDoc.updatedAt,
                      ...(newDoc.deliveredByOwner != undefined && {
                        deliveredAt: newDoc.deliveredAt,
                      }),
                      ...(newDoc.deliveredByOwner != undefined && {
                        deliveredByUsername: newDoc.deliveredByUsername,
                      }),
                    },
                    function (error, result) {
                      if (error) console.log(error);
                    }
                  );
                  if(newDoc.deliveredByOwner != undefined) {
                    // send email notification to sender
                    Meteor.call("clientGroupDelivered", {
                      location: newDoc.location,
                      senderId: newDoc.senderId,
                      photoName: newDoc.photoName,
                      type: newDoc.type,
                      barcode: newDoc.barcode,
                      clientUniqueBarcode: newDoc.clientUniqueBarcode,
                      updatedAt: newDoc.updatedAt,
                      carrier: newDoc.carrier,
                      recipientName: newDoc.recipientName,
                      outboundAddress: newDoc.outboundAddress,
                      deliveryType: newDoc.deliveryType,
                      numberOfItems: newDoc.numberOfItems,
                      notes: newDoc.notes,
                      signee: newDoc.signee,
                      deliveredAt: newDoc.deliveredAt,
                      deliveredByOwner: newDoc.deliveredByOwner,
                      deliveredByUsername: newDoc.deliveredByUsername,
                    });
                  }
                }
              }
              parcelsDb
                .get(doc._id)
                .then((oldDoc) => parcelsDb.remove(oldDoc))
                .then(() => {
                  if ((!newDoc.deliveredAt && !temp) || (temp && newDoc.type == "inbound")) {
                    return parcelsDb.put(newDoc);
                  }
                })
                .then(resolve)
                .catch(reject);
            }
          });
        });
      } catch (err) {
        console.error("Error Syncing: ", err);
        Meteor.call(
          "sendToSlack",
          `Error Syncing: ${err.message}. \n${getAppInfo()}`
        );
      }        
    }

    //create unique locations array
    var uniqueLocations = _.uniqBy(locationsToSendemail,'_id');

    // send today Outbound Delivered email 
    if((parcelsOffline.length !== 0) && (uniqueLocations.length !== 0)){
      Meteor.call('todayOutboundDelivered', {
        locations: uniqueLocations,
        parcelsOffline: parcelsToSendemail,
        utcOffset: moment().utcOffset(),
      });
    }
    
    Session.set('sessionParcelCount', 0);
    Session.set('sessionLastParcel', 0);
    Session.set('parcelsOffline', []);
    await this.checkSyncStatus();
    // @FIXME To ensure pouchDB to re-register within the browser
    window.location.reload();
    this.setState({
      inProgress: false,
    });
  };

  redirectToSync = () => {
    FlowRouter.go('/sync');
  };

  renderSyncDetails() {
    const parcelsCount = this.props.parcelsOffline.length;
    const { smallDialog, status } = this.props;
    let color = '';

    if (!status.connected) {
      color = 'grey';
    } else if (parcelsCount) {
      color = 'red';
    } else {
      color = 'green';
    }
    if (smallDialog) {
      if (parcelsCount) {
        return (
          <div className="sync-status-small-btn" style={{ color, borderColor: color }} onClick={this.syncParcels}>
            {i18n.__("sync.Sync")}
          </div>
        );
      }
      if (!parcelsCount) {
        return (
          <div className="sync-status-small-btn" style={{ color, borderColor: color }} onClick={this.redirectToSync}>
            {i18n.__("sync.Sync")}
          </div>
        );
      }
    }
    if (!smallDialog) {
      if (parcelsCount) {
        return (
          <div className="sync-status" style={{ backgroundColor: color }} onClick={this.syncParcels}>
            <div className="sync-status-text"> {i18n.__("sync.You have")} { parcelsCount } {i18n.__("sync.item(s) offline")}.</div>
            <div className="sync-status-button">{i18n.__("sync.Click to SYNC to the cloud")}.</div>
          </div>
        );
      }
      if (!parcelsCount) {
        return (
          <div className="sync-status" style={{ backgroundColor: color }}>
            <div className="sync-status-text">{i18n.__("sync.You`re up to date")}!</div>
            <div className="sync-status-button">{i18n.__("sync.All your item(s) have been synced to the cloud")}.</div>
          </div>
        );
      }
    }
  }
  render() {
    return (
      <div>
        { this.renderSyncDetails() }
      </div>
    );
  }
}



export default withTracker(() => {

  Meteor.subscribe('currentClient');
  
  return {
    status: Meteor.status(),
    parcelsOffline: Session.get('parcelsOffline') || [],
    currentClient: Clients.find().fetch()[0]
  };
})(SyncParcels);
