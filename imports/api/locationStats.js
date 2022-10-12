import { check } from "meteor/check";
import _ from "lodash";
import ejs from "ejs";
import moment from "moment";
import emailMarkup from "../email-templates/locationStats.ejs";
import { Meteor } from "meteor/meteor";

import { Clients } from "/imports/api/";

if (!Meteor.isServer) {
  return;
}

/**
 * Location Stats Reducers.
 */

const reducerType = function (tally, item) {
  if (!tally[item.type]) {
    tally[item.type] = 1;
  } else {
    tally[item.type] += 1;
  }

  return tally;
};

const reducerDeliveryType = function (tally, item) {
  if (!tally[item.deliveryType]) {
    tally[item.deliveryType] = 1;
  } else {
    tally[item.deliveryType] += 1;
  }

  return tally;
};

/**
 * Location Methods
 */

Meteor.methods({
  "parcels.stats": (parcelsByLocation, searchParams) => {
    check(parcelsByLocation, Array);
    check(searchParams, Object);

    const meteorUser = Meteor.user();
    const { clientId } = meteorUser.profile;
    const to = meteorUser.emails[0].address;
    const from = "org_placeholder: postrubella <no-reply@org_placeholder.io>";
    const subject = "Your postrubella Report";

    // Fetch collections and sort
    const parcels = _.groupBy(parcelsByLocation, "location");
    const locations = _.keys(parcels);

    // Location Tallys
    function locationTally() {
      return locations.map((_location) => {
        // initial values
        const tallyValues = {
          type: {},
          deliveryType: {},
        };
        let postTotal = parcels[_location].length;
        let totalInboundItems = 0;
        let totalOutboundItems = 0;
        let totalItems = 0;
        parcels[_location].forEach((parcel, index) => {
          if (parcel.type == "inbound") {
            totalInboundItems +=
              +parcel.numberOfItems > 0 ? +parcel.numberOfItems : 1;
          }
          if (parcel.type == "outbound") {
            totalOutboundItems +=
              +parcel.numberOfItems > 0 ? +parcel.numberOfItems : 1;
          }
          totalItems = totalInboundItems + totalOutboundItems;
        });

        // @TODO: check this very strange logic with unused variables
        // reduce
        const parcelDeliveryType = parcels[_location].reduce(
          reducerDeliveryType,
          tallyValues.deliveryType
        );
        const parcelType = parcels[_location].reduce(
          reducerType,
          tallyValues.type
        );
        if (tallyValues.type.outbound === undefined) {
          tallyValues.type.outbound = 0;
        }
        if (tallyValues.type.inbound === undefined) {
          tallyValues.type.inbound = 0;
        }

        const html = `
                        <div style="margin-bottom:20px;">
                            <div><h4 style="margin-bottom:0;">${_location}</h4></div>
                            <div>Number of items in inbound: ${totalInboundItems}</div>
                            <div>Number of items in outbound: ${totalOutboundItems}</div>
                            <div>Total Items: ${totalItems}</div>
                            <div>Number of inbound: ${tallyValues.type.inbound}</div>
                            <div>Number of outbound: ${tallyValues.type.outbound}</div>
                            <div>Total: ${postTotal}</div>
                        </div> `;

        return html.replace(/^\s+|,+|\s+$|\s+(?=\s)/g, "");
      });
    }

    // Run and format for ejs
    const tallyHtml = locationTally().join("");

    const {
      carrier,
      location,
      deliveryUser: user,
      deliveryType,
      deliveryStatus,
      type: itemType,
    } = searchParams;
    let { $gte: fromDate, $lte: toDate } = searchParams.$or[0].createdAt;

    fromDate = moment(fromDate).format("LLLL");
    toDate = moment(toDate).format("LLLL");
    const client = Clients.findOne({ _id: clientId }).clientName;
    // Email Template
    const template = ejs.render(emailMarkup, {
      tallyHtml,
      clientId,
      to,
      from,
      subject,
      fromDate,
      toDate,
      client,
      carrier,
      location,
      user,
      deliveryType,
      deliveryStatus,
      itemType,
    });

    const { email } = Meteor.settings.private.smtp;
    //send email
    Meteor.call(
      "emailQueue",
      to,
      `org_placeholder postrubella ${email}`,
      subject,
      template
    );
  },
});
