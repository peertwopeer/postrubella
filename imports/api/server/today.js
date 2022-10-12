import moment from "moment-timezone";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Parcels, Locations, Clients, Senders } from "/imports/api/";

import { Email } from "meteor/email";
import "/imports/languages/de/de.today.i18n.yml";
import "/imports/languages/en/en.today.i18n.yml";
import "/imports/languages/en-JM/en-JM.today.i18n.yml";

import attemptedToDeliverTemplate from "../../email-templates/attemptedToDeliver.ejs";
import ejs from "ejs";

function attemptedDelvery(parcel) {
  if (parcel.attemptedToDeliver) {
    const attemptedToDeliverCount = parcel.attemptedToDeliver.length;

    if (attemptedToDeliverCount === 1) return "";
    return `<div><span style="font-weight:bold">${i18n.__(
      "today.Attempted Delivery"
    )}: </span> ${attemptedToDeliverCount}</div>`;
  }

  return "";
}
Meteor.methods({
  async attemptedToDeliverEmail(params) {
    check([params], [Object]);

    var { locationId, utcOffset } = params;
    var location = Locations.findOne(locationId);

    // console.log("Get Location : ", location);

    let to = location.locationEmail;
    console.log("Meteor.settings.private.smtp", Meteor.settings.private.smtp);
    const meteorUser = Meteor.user();
    if (!meteorUser) return;
    const userEmail = meteorUser.emails[0].address;
    const subject = `postrubella : ${i18n.__(
      "today.Urgent notice Attempted To Deliver"
    )}`;
    const { email } = Meteor.settings.private.smtp;

    // const { email }     =  Meteor.settings.private.smtp;
    var client = Clients.findOne({ _id: meteorUser.profile.clientId });
    var next_time = moment(new Date()).utcOffset(utcOffset).format("h:mm a");
    const template = ejs.render(attemptedToDeliverTemplate, {
      next_time: next_time,
      logo: client.logo,
    });

    try {
      if (to) {
        //send email
        Meteor.call(
          "emailQueue",
          to,
          `org_placeholder postrubella ${email}`,
          subject,
          template
        );
      }

      // Meteor.call('sendToSlack', `Outbound count sent for: ${clientUniqueBarcode} to: ${to} and ${numberOfParcels} item(s) `);
      // console.log(`========= Outbound Email sent to: ${to} and ${numberOfParcels} item(s) =========`);
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `Attempted To Deliver error ${error.message} sent to: ${to}`
      );
      console.log(error);
    }
  },

  /**
   *  Inbound stats for today - sends email to location about received parcels for today.
   *
   *  TODO: detect reasons of traveling error:
   *   inboundCount: Location not found.
   *   userId: imMQq96Zkq2XDLJHB,
   *   clientId: undefined.
   *   locationName: undefined.
   */

  async inboundCount(params) {
    check([params], [Object]);
    var {
      locationName,
      clientName,
      clientEmail,
      clientLogo,
      enableCustomEmail,
      deliveryUser,
      utcOffset,
    } = params;

    const user = Meteor.user();

    const { clientId } = user.profile;
    var client = Clients.findOne({ _id: clientId });
    //set timezone
    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (user) {
      if (
        typeof user.profile.timezone !== "undefined" &&
        user.profile.timezone !== ""
      ) {
        timeZone = user.profile.timezone;
      } else if (
        typeof client.defaultTimeZone !== "undefined" &&
        client.defaultTimeZone !== ""
      ) {
        timeZone = client.defaultTimeZone;
      }
    }

    // fetch location information
    const currentUserId = user._id;
    const currentUsername = user.username;
    const location = Locations.find(
      {
        clientId,
        locationName,
      },
      {
        fields: {
          locationEmail: 1,
          locationName: 1,
        },
      }
    ).fetch();

    if (location.length === 0) {
      return Meteor.call(
        "sendToSlack",
        `inboundCount: Location not found.
        userId: ${currentUserId},
        clientId: ${clientId}.
        locationName: ${locationName}.`
      );
    }

    const currentLocation = location[0].locationName;
    const to = location[0].locationEmail;
    const replyTo = clientEmail;
    const start = moment()
      .tz(timeZone)
      .startOf("day")
      .utcOffset(utcOffset)
      .toDate();

    // cancel send if no valid email address
    if (to.length <= 4) return;
    this.unblock();
    try {
      const locationParcels = await Parcels.find(
        {
          clientId,
          location: currentLocation,
          deliveredAt: { $exists: false },
          owner: currentUserId,
          type: "inbound",
          isEmail: 0,
          createdAt: { $gt: start },
        },
        {
          fields: {
            recipientSignature: 0,
            owner: 0,
            type: 0,
            deliveredByOwner: 0,
            deliveredByUsername: 0,
          },
        }
      ).fetch();

      const locationParData = await Parcels.find(
        {
          clientId,
          location: currentLocation,
          deliveredAt: { $exists: false },
          owner: currentUserId,
          type: "inbound",
          isEmail: 0,
          createdAt: { $gt: start },
        },
        {
          fields: {
            _id: 1,
          },
        }
      ).fetch();

      // sort: { createdAt: -1 },
      // limit: 1,
      const numberOfParcels = Object.keys(locationParcels).length;
      const { email } = Meteor.settings.private.smtp;
      let subject = `${i18n.__("today.Inbound")} ${numberOfParcels} ${i18n.__(
        "today.item(s) Received"
      )}`;

      if (numberOfParcels === 0) {
        Meteor.call(
          "sendToSlack",
          `_Inbound count:_ no parcels since *${start}* for username: *${currentUsername}*, clientId: *${clientId}*, location: *${currentLocation}*.`
        );
      }

      locationParData.map((locationP) => {
        const _id = locationP._id;
        Parcels.update(_id, {
          $set: {
            isEmail: 1,
          },
        });
      });

      const allBarcodes = locationParcels.map((locationParcel) => {
        const date = moment(locationParcel.createdAt)
          .tz(timeZone)
          .utcOffset(utcOffset)
          .format("Do MMMM YYYY, h:mm:ss a");
        let photoUrl = "";
        if (
          typeof locationParcel.photoName !== "undefined" &&
          locationParcel.photoName !== ""
        ) {
          if (
            Meteor.absoluteUrl().includes("localhost") ||
            Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
          ) {
            photoUrl =
              "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
              moment(locationParcel.createdAt).format("YYYY") +
              "/" +
              locationParcel.photoName;
          } else {
            photoUrl =
              "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
              moment(locationParcel.createdAt).format("YYYY") +
              "/" +
              locationParcel.photoName;
          }
        }
        return `<div style="border:1px solid #edeeef; border-radius:5px; margin-bottom:20px; padding:20px;">
            <div><span style="font-weight:bold">${i18n.__(
              "today.Received at"
            )}:</span> ${date}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Barcode"
            )}:</span> ${locationParcel.barcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.org_placeholder Nr"
            )}:</span> ${locationParcel.clientUniqueBarcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Carrier"
            )}:</span> ${locationParcel.carrier}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Sender"
            )}:</span> ${locationParcel.sender}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Location/Company"
            )}:</span> ${locationParcel.location}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Recipient / Addressee"
            )}:</span> ${locationParcel.recipientName}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Type"
            )}:</span> ${locationParcel.deliveryType}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Number of Items"
            )}:</span> ${locationParcel.numberOfItems}</div>
            ${
              locationParcel.notes
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Notes"
                  )}:</span> ${locationParcel.notes}</div>`
                : ""
            }
            ${
              locationParcel.xrayInput
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.This item has been through an x-ray"
                  )}:</span> Yes</div>`
                : ""
            }
            ${
              photoUrl !== ""
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Photo"
                  )}:</span> <a href="${photoUrl}">${i18n.__(
                    "today.Click here to open image file"
                  )}</a></div>`
                : ""
            }
          </div>`;
      });

      let deliveryOptions;

      // if (deliveryUser === 'offline') {
      //   deliveryOptions = 'Please contact your postrubella for more information.';
      // }

      if (deliveryUser === "Collect from postrubella") {
        if (enableCustomEmail) {
          deliveryOptions = `${i18n.__(
            "today.Please collect from the"
          )} ${clientName} London Mailroom. `;
        } else {
          deliveryOptions = deliveryUser;
        }
      } else if (deliveryUser === "Delivery AM") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Delivery PM") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Delivered Today") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Shortly") {
        deliveryOptions = `${i18n.__("today.We will deliver shortly")}.`;
      } else {
        deliveryOptions = `${i18n.__(
          "today.Please collect from"
        )} ${deliveryUser}.`;
      }

      let logo;
      let logoWidth;
      let logoHeight;
      if (typeof clientLogo !== "undefined" && clientLogo !== "") {
        logo = clientLogo;
        logoWidth = 300;
        logoHeight = "auto";
      } else {
        logo =
          "https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png";
        logoWidth = 300;
        logoHeight = 80;
      }
      if (enableCustomEmail) {
        var text = `
        <div>
          <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
          <div style="margin-bottom:20px">${i18n.__(
            "today.We are pleased to inform you that you have"
          )} <b> ${numberOfParcels} </b> ${i18n.__(
          "today.item(s) in the"
        )} ${clientName} London Mailroom.</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Your parcel(s) status"
          )}: ${deliveryOptions}</div>
          <div style="margin-top:20px">${allBarcodes.join("")}</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br>
          <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
        </div>
      `;
      } else {
        var text = `
        <div>
          <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
          <div style="margin-bottom:20px">${i18n.__(
            "today.We are pleased to inform you that you have"
          )} <b> ${numberOfParcels} </b> ${i18n.__(
          "today.item(s) in the"
        )} postrubella.</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Your parcel(s) status"
          )}: ${deliveryOptions}</div>
          <div style="margin-top:20px">${allBarcodes.join("")}</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br>
          <div style="margin-bottom:20px">The postrubella Team.</div>
        </div>
      `;
      }

      if (numberOfParcels === 0) {
        subject = `${i18n.__("today.Item(s) Received")}`;
        if (enableCustomEmail) {
          text = `
          <div>
            <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`}/></div>
            <div style="margin-bottom:20px">${i18n.__(
              "today.We are pleased to inform you that you have item(s) in the"
            )} ${numberOfParcels} </b> ${i18n.__(
            "today.item(s) in the"
          )} ${clientName} London Mailroom.</div>
            <div style="margin-top:20px">${deliveryOptions}</div>
            <div style="margin-top:20px">${i18n.__(
              "today.Yours sincerely"
            )},</div>
            <br>
            <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
          </div>
      `;
        } else {
          text = `
          <div>
            <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`}/></div>
            <div style="margin-bottom:20px">${i18n.__(
              "today.We are pleased to inform you that you have item(s) in the"
            )} postrubella.</div>
            <div style="margin-top:20px">${deliveryOptions}</div>
            <div style="margin-top:20px">${i18n.__(
              "today.Yours sincerely"
            )},</div>
            <br>
            <div style="margin-bottom:20px">The postrubella Team.</div>
          </div>
      `;
        }
      }

      if (enableCustomEmail) {
        text =
          text +
          `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
            "today.Note"
          )}:</b> ${i18n.__(
            "today.This is an auto generated email, please reply to"
          )} ${clientEmail}</p>`;
      } else {
        text =
          text +
          `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
            "today.Note"
          )}:</b> ${i18n.__(
            "today.This is an auto generated email, please do not reply"
          )}.</p>`;
      }
      //send email
      Meteor.call(
        "emailQueue",
        to,
        `org_placeholder postrubella ${email}`,
        subject,
        text,
        null,
        replyTo
      );

      // Meteor.call('sendToSlack', `Inbound count sent for: ${clientUniqueBarcode} to: ${to} and ${numberOfParcels} item(s) `);
      // console.log(`========= Inbound Email sent to: ${to} and ${numberOfParcels} item(s) =========`);
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `${i18n.__("today.Inbound")} error: ${error.message}`
      );
      console.log(error);
    }
  },

  /**
   *  Outbound stats for today
   */

  async outboundCount(params) {
    check([params], [Object]);
    var {
      locationName,
      clientId,
      clientName,
      clientEmail,
      clientLogo,
      enableCustomEmail,
      deliveryUser,
      utcOffset,
    } = params;

    const user = Meteor.user();
    // fetch location information
    const currentUserId = await Meteor.user()._id;
    const currentUsername = await Meteor.user().username;
    const location = await Locations.find(
      {
        clientId,
        locationName,
      },
      {
        fields: {
          locationEmail: 1,
          locationName: 1,
        },
      }
    ).fetch();

    var client = Clients.findOne({ _id: clientId });
    //set timezone
    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (user) {
      if (
        typeof user.profile.timezone !== "undefined" &&
        user.profile.timezone !== ""
      ) {
        timeZone = user.profile.timezone;
      } else if (
        typeof client.defaultTimeZone !== "undefined" &&
        client.defaultTimeZone !== ""
      ) {
        timeZone = client.defaultTimeZone;
      }
    }

    if (location.length === 0) {
      return Meteor.call(
        "sendToSlack",
        `outboundCount: Location not found.
        userId: ${currentUserId},
        clientId: ${clientId}.
        locationName: ${locationName}.`
      );
    }

    const currentLocation = location[0].locationName;
    const to = location[0].locationEmail;
    const replyTo = clientEmail;
    const start = moment()
      .tz(timeZone)
      .startOf("day")
      .utcOffset(utcOffset)
      .toDate();

    // cancel send if no valid email address
    if (to.length <= 4) return;
    this.unblock();
    try {
      const locationParcels = await Parcels.find(
        {
          clientId,
          location: currentLocation,
          deliveredAt: { $exists: false },
          owner: currentUserId,
          type: "outbound",
          createdAt: { $gt: start },
        },
        {
          fields: {
            recipientSignature: 0,
            owner: 0,
            type: 0,
            deliveredByOwner: 0,
            deliveredByUsername: 0,
          },
        }
      ).fetch();

      const numberOfParcels = Object.keys(locationParcels).length;

      const { email } = Meteor.settings.private.smtp;
      let subject = `${numberOfParcels} ${i18n.__("today.item(s) Received")}`;

      if (numberOfParcels === 0) {
        Meteor.call(
          "sendToSlack",
          `_Outbound count:_ no parcels since *${start}* for username: *${currentUsername}*, clientId: *${clientId}*, location: *${currentLocation}*.`
        );
      }

      const allBarcodes = locationParcels.map((locationParcel) => {
        const date = moment(locationParcel.createdAt)
          .tz(timeZone)
          .utcOffset(utcOffset)
          .format("Do MMMM YYYY, h:mm:ss a");
        let photoUrl = "";
        if (
          typeof locationParcel.photoName !== "undefined" &&
          locationParcel.photoName !== ""
        ) {
          if (
            Meteor.absoluteUrl().includes("localhost") ||
            Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
          ) {
            photoUrl =
              "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
              moment(locationParcel.createdAt).format("YYYY") +
              "/" +
              locationParcel.photoName;
          } else {
            photoUrl =
              "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
              moment(locationParcel.createdAt).format("YYYY") +
              "/" +
              locationParcel.photoName;
          }
        }
        return `<div style="border:1px solid #edeeef; border-radius:5px; margin-bottom:20px; padding:20px;">
            <div><span style="font-weight:bold">${i18n.__(
              "today.Processed at"
            )}:</span> ${date}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Barcode"
            )}:</span> ${locationParcel.barcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.org_placeholder Nr"
            )}:</span> ${locationParcel.clientUniqueBarcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Carrier"
            )}:</span> ${locationParcel.carrier}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Location/Company"
            )}:</span> ${locationParcel.location}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Recipient / Addressee"
            )}:</span> ${locationParcel.recipientName}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Outbound Address"
            )}:</span> ${locationParcel.outboundAddress}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Type"
            )}:</span> ${locationParcel.deliveryType}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Number of Items"
            )}:</span> ${locationParcel.numberOfItems}</div>
            ${
              locationParcel.notes
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Notes"
                  )}:</span> ${locationParcel.notes}</div>`
                : ""
            }
            ${
              photoUrl !== ""
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Photo"
                  )}:</span> <a href="${photoUrl}">${i18n.__(
                    "today.Click here to open image file"
                  )}</a></div>`
                : ""
            }
          </div>`;
      });

      let logo;
      let logoWidth;
      let logoHeight;
      if (typeof clientLogo !== "undefined" && clientLogo !== "") {
        logo = clientLogo;
        logoWidth = 300;
        logoHeight = "auto";
      } else {
        logo =
          "https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png";
        logoWidth = 300;
        logoHeight = 80;
      }
      if (enableCustomEmail) {
        var text = `
        <div>
          <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
          <div style="margin-bottom:20px">${clientName} London Mailroom ${i18n.__(
          "today.has accepted"
        )}<b> ${numberOfParcels} </b> ${i18n.__(
          "today.item(s) ready for outbound"
        )}.</div>
          <div style="margin-top:20px">${allBarcodes.join("")}</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br>
          <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
        </div>
      `;
      } else {
        var text = `
        <div>
          <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
          <div style="margin-bottom:20px">postrubella ${i18n.__(
            "today.has accepted"
          )}<b> ${numberOfParcels} </b> ${i18n.__(
          "today.item(s) ready for outbound"
        )}.</div>
          <div style="margin-top:20px">${allBarcodes.join("")}</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br>
          <div style="margin-bottom:20px">The postrubella Team.</div>
        </div>
      `;
      }

      if (numberOfParcels === 0) {
        subject = `${i18n.__("today.Item(s) Received")}`;
        if (enableCustomEmail) {
          text = `
          <div>
            <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
            <div style="margin-bottom:20px">${clientName} London Mailroom ${i18n.__(
            "today.has accepted item(s) ready for outbound"
          )}.</div>
            <div style="margin-top:20px">${i18n.__(
              "today.Yours sincerely"
            )},</div>
            <br>
            <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
          </div>
        `;
        } else {
          text = `
          <div>
            <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
            <div style="margin-bottom:20px">postrubella ${i18n.__(
              "today.has accepted item(s) ready for outbound"
            )}.</div>
            <div style="margin-top:20px">${i18n.__(
              "today.Yours sincerely"
            )},</div>
            <br>
            <div style="margin-bottom:20px">The postrubella Team.</div>
          </div>
        `;
        }
      }
      if (enableCustomEmail) {
        text =
          text +
          `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
            "today.Note"
          )}:</b> ${i18n.__(
            "today.This is an auto generated email, please reply to"
          )} ${clientEmail}</p>`;
      } else {
        text =
          text +
          `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
            "today.Note"
          )}:</b> ${i18n.__(
            "today.This is an auto generated email, please do not reply"
          )}.</p>`;
      }
      //send email
      await Meteor.call(
        "emailQueue",
        to,
        `org_placeholder postrubella ${email}`,
        subject,
        text,
        null,
        replyTo
      );

      // Meteor.call('sendToSlack', `Outbound count sent for: ${clientUniqueBarcode} to: ${to} and ${numberOfParcels} item(s) `);
      // console.log(`========= Outbound Email sent to: ${to} and ${numberOfParcels} item(s) =========`);
    } catch (error) {
      Meteor.call("sendToSlack", `Outbound error: ${error.message}`);
      console.log(error);
    }
  },

  /**
   *  All stats for today
   */

  /**
   * Send email about received parcels of both types (at sync from device)
   *
   * @param {*} {
   *     locationName,
   *     clientEmail,
   *     deliveryUser,
   *     utcOffset,
   *   }
   * @returns
   */
  async allCount(params) {
    check([params], [Object]);
    var {
      parcelsOffline,
      locationName,
      clientEmail,
      clientName,
      enableCustomEmail,
      deliveryUser,
      utcOffset,
    } = params;

    // fetch location information
    const currentUser = Meteor.user();

    if (!currentUser) {
      return console.log(
        "trying to allCount unauthorized.",
        locationName,
        clientEmail,
        deliveryUser
      );
    }
    const { clientId } = currentUser.profile;

    const currentUserId = currentUser._id;
    const currentUsername = currentUser.username;
    const location = await Locations.find(
      {
        clientId,
        locationName,
      },
      {
        fields: {
          locationEmail: 1,
          locationName: 1,
        },
      }
    ).fetch();

    if (location.length === 0) {
      return Meteor.call(
        "sendToSlack",
        `Sync count: Location not found.
        userId: ${currentUserId},
        clientId: ${clientId}.
        locationName: ${locationName}.`
      );
    }

    const currentLocation = location[0].locationName;
    const to = location[0].locationEmail;
    const replyTo = clientEmail;
    const client = await Clients.findOne({ _id: clientId });
    const start = moment().startOf("day").utcOffset(utcOffset).toDate();

    // cancel send if no valid email address
    if (!to || to.length <= 4) return;
    this.unblock();
    try {
      var inboundLocationParcels = [];
      var outboundLocationParcels = [];
      if (
        typeof parcelsOffline !== "undefined" &&
        parcelsOffline.length !== 0
      ) {
        parcelsOffline.map((parcel) => {
          if (parcel.type === "inbound") {
            inboundLocationParcels.push(parcel);
          }
          if (parcel.type === "outbound") {
            outboundLocationParcels.push(parcel);
          }
        });
      }
      const numberOfInboundParcels = inboundLocationParcels.length;
      const numberOfOutboundParcels = outboundLocationParcels.length;
      const { email } = Meteor.settings.private.smtp;
      let subject = `${i18n.__("today.item(s) Received")}`;

      if (numberOfInboundParcels === 0 && numberOfOutboundParcels === 0) {
        console.log(
          `_Sync count:_ no undelivered parcels since *${start}* for username: *${currentUsername}*, clientId: *${clientId}*, location: *${currentLocation}*.`
        );

        return;
        //Meteor.call('sendToSlack', `_Sync count:_ no undelivered parcels since *${start}* for username: *${currentUsername}*, clientId: *${clientId}*, location: *${currentLocation}*.`);
      }

      const allInboundBarcodes = inboundLocationParcels.map(
        (locationParcel) => {
          const date = moment(
            locationParcel.createdAt || locationParcel.offlineDate
          )
            .utcOffset(utcOffset)
            .format("Do MMMM YYYY, h:mm:ss a");
          let photoUrl = "";
          if (
            typeof locationParcel.photoName !== "undefined" &&
            locationParcel.photoName !== ""
          ) {
            if (
              Meteor.absoluteUrl().includes("localhost") ||
              Meteor.absoluteUrl().includes(
                "dev.postrubella.org_placeholder.io"
              )
            ) {
              photoUrl =
                "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
                moment().format("YYYY") +
                "/" +
                locationParcel.photoName;
            } else {
              photoUrl =
                "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
                moment().format("YYYY") +
                "/" +
                locationParcel.photoName;
            }
          }

          return `<div style="border:1px solid #edeeef; border-radius:5px; margin-bottom:20px; padding:20px;">

            <div><span style="font-weight:bold;text-transform: uppercase;">${
              locationParcel.type
            }</span></div>

            <div><span style="font-weight:bold">${i18n.__(
              "today.Processed at"
            )}:</span> ${date}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Barcode"
            )}:</span> ${locationParcel.barcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.org_placeholder Nr"
            )}:</span> ${locationParcel.clientUniqueBarcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Carrier"
            )}:</span> ${locationParcel.carrier}</div>
            <div><span style="font-weight:bold">Sender:</span> ${
              locationParcel.sender
            }</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Location/Company"
            )}:</span> ${locationParcel.location}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Recipient / Addressee"
            )}:</span> ${locationParcel.recipientName}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Type"
            )}:</span> ${locationParcel.deliveryType}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Number of Items"
            )}:</span> ${locationParcel.numberOfItems}</div>
            ${
              locationParcel.notes
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Notes"
                  )}:</span> ${locationParcel.notes}</div>`
                : ""
            }
            ${
              photoUrl !== ""
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Photo"
                  )}:</span> <a href="${photoUrl}">${i18n.__(
                    "today.Click here to open image file"
                  )}</a></div>`
                : ""
            }
          </div>`;
        }
      );

      const allOutboundBarcodes = outboundLocationParcels.map(
        (locationParcel) => {
          const date = moment(
            locationParcel.createdAt || locationParcel.offlineDate
          )
            .utcOffset(utcOffset)
            .format("Do MMMM YYYY, h:mm:ss a");
          let photoUrl = "";
          if (
            typeof locationParcel.photoName !== "undefined" &&
            locationParcel.photoName !== ""
          ) {
            if (
              Meteor.absoluteUrl().includes("localhost") ||
              Meteor.absoluteUrl().includes(
                "dev.postrubella.org_placeholder.io"
              )
            ) {
              photoUrl =
                "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
                moment().format("YYYY") +
                "/" +
                locationParcel.photoName;
            } else {
              photoUrl =
                "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
                moment().format("YYYY") +
                "/" +
                locationParcel.photoName;
            }
          }

          return `<div style="border:1px solid #edeeef; border-radius:5px; margin-bottom:20px; padding:20px;">

            <div><span style="font-weight:bold;text-transform: uppercase;">${
              locationParcel.type
            }</span></div>

            <div><span style="font-weight:bold">${i18n.__(
              "today.Processed at"
            )}:</span> ${date}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Barcode"
            )}:</span> ${locationParcel.barcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.org_placeholder Nr"
            )}:</span> ${locationParcel.clientUniqueBarcode}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Carrier"
            )}:</span> ${locationParcel.carrier}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Location/Company"
            )}:</span> ${locationParcel.location}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Recipient / Addressee"
            )}:</span> ${locationParcel.recipientName}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Outbound Address"
            )}:</span> ${locationParcel.outboundAddress}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Type"
            )}:</span> ${locationParcel.deliveryType}</div>
            <div><span style="font-weight:bold">${i18n.__(
              "today.Number of Items"
            )}:</span> ${locationParcel.numberOfItems}</div>
            ${
              locationParcel.notes
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Notes"
                  )}:</span> ${locationParcel.notes}</div>`
                : ""
            }
            ${
              photoUrl !== ""
                ? `<div><span style="font-weight:bold">${i18n.__(
                    "today.Photo"
                  )}:</span> <a href="${photoUrl}">${i18n.__(
                    "today.Click here to open image file"
                  )}</a></div>`
                : ""
            }
          </div>`;
        }
      );
      let deliveryOptions;

      if (deliveryUser === "Collect from postrubella") {
        if (enableCustomEmail) {
          deliveryOptions = `${i18n.__(
            "today.Please collect from the"
          )} ${clientName} London Mailroom. `;
        } else {
          deliveryOptions = deliveryUser;
        }
      } else if (deliveryUser === "Delivery AM") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Delivery PM") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Delivered Today") {
        deliveryOptions = deliveryUser;
      } else if (deliveryUser === "Shortly") {
        deliveryOptions = `${i18n.__("today.We will deliver shortly")}.`;
      } else {
        deliveryOptions = `${i18n.__("today.Collect from postrubella")}`;
      }
      let logo;
      let logoWidth;
      let logoHeight;
      const clientLogo = client.logo;
      if (typeof clientLogo !== "undefined" && clientLogo !== "") {
        logo = clientLogo;
        logoWidth = 300;
        logoHeight = "auto";
      } else {
        logo =
          "https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png";
        logoWidth = 300;
        logoHeight = 80;
      }
      if (numberOfInboundParcels !== 0) {
        subject = `${i18n.__(
          "today.Inbound"
        )} ${numberOfInboundParcels} ${i18n.__("today.item(s) Received")}`;
        if (enableCustomEmail) {
          var text = `
            <div>
              <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
              <div style="margin-bottom:20px">${i18n.__(
                "today.We are pleased to inform you that you have"
              )} <b> ${numberOfInboundParcels} </b> ${i18n.__(
            "today.item(s) in the"
          )} ${clientName} London Mailroom.</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Your parcel(s) status"
              )}: ${deliveryOptions}</div>
              <div style="margin-top:20px">${allInboundBarcodes.join("")}</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Yours sincerely"
              )},</div>
              <br>
              <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
            </div>
          `;
        } else {
          var text = `
            <div>
              <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`} /></div>
              <div style="margin-bottom:20px">${i18n.__(
                "today.We are pleased to inform you that you have"
              )} <b> ${numberOfInboundParcels} </b> ${i18n.__(
            "today.item(s) in the"
          )} postrubella.</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Your parcel(s) status"
              )}: ${deliveryOptions}</div>
              <div style="margin-top:20px">${allInboundBarcodes.join("")}</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Yours sincerely"
              )},</div>
              <br>
              <div style="margin-bottom:20px">The postrubella Team.</div>
            </div>
          `;
        }

        if (numberOfInboundParcels === 0) {
          subject = `${i18n.__("today.Item(s) Received")}`;
          if (enableCustomEmail) {
            text = `
              <div>
                <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`}/></div>
                <div style="margin-bottom:20px">${i18n.__(
                  "today.We are pleased to inform you that you have item(s) in the"
                )} ${numberOfInboundParcels} </b> ${i18n.__(
              "today.item(s) in the"
            )} ${clientName} London Mailroom.</div>
                <div style="margin-top:20px">${deliveryOptions}</div>
                <div style="margin-top:20px">${i18n.__(
                  "today.Yours sincerely"
                )},</div>
                <br>
                <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
              </div>
          `;
          } else {
            text = `
              <div>
                <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`${logo}`}/></div>
                <div style="margin-bottom:20px">${i18n.__(
                  "today.We are pleased to inform you that you have item(s) in the"
                )} postrubella.</div>
                <div style="margin-top:20px">${deliveryOptions}</div>
                <div style="margin-top:20px">${i18n.__(
                  "today.Yours sincerely"
                )},</div>
                <br>
                <div style="margin-bottom:20px">The postrubella Team.</div>
              </div>
          `;
          }
        }

        if (enableCustomEmail) {
          text =
            text +
            `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
              "today.Note"
            )}:</b> ${i18n.__(
              "today.This is an auto generated email, please reply to"
            )} ${clientEmail}</p>`;
        } else {
          text =
            text +
            `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
              "today.Note"
            )}:</b> ${i18n.__(
              "today.This is an auto generated email, please do not reply"
            )}.</p>`;
        }
        //send email
        Meteor.call(
          "emailQueue",
          to,
          `org_placeholder postrubella ${email}`,
          subject,
          text,
          null,
          replyTo
        );
      }
      if (numberOfOutboundParcels !== 0) {
        subject = `${numberOfOutboundParcels} ${i18n.__(
          "today.item(s) Received"
        )}`;
        if (enableCustomEmail) {
          var text = `
            <div>
              <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src=${`"${logo}"`} /></div>
              <div style="margin-bottom:20px">${clientName} London Mailroom ${i18n.__(
            "today.has accepted"
          )}<b> ${numberOfOutboundParcels} </b> ${i18n.__(
            "today.item(s) ready for outbound"
          )}.</div>
              <div style="margin-top:20px">${allOutboundBarcodes.join("")}</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Yours sincerely"
              )},</div>
              <br>
              <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
            </div>
          `;
        } else {
          var text = `
            <div>
              <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src=${`"${logo}"`} /></div>
              <div style="margin-bottom:20px">postrubella ${i18n.__(
                "today.has accepted"
              )}<b> ${numberOfOutboundParcels} </b> ${i18n.__(
            "today.item(s) ready for outbound"
          )}.</div>
              <div style="margin-top:20px">${allOutboundBarcodes.join("")}</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Yours sincerely"
              )},</div>
              <br>
              <div style="margin-bottom:20px">The postrubella Team.</div>
            </div>
          `;
        }

        if (numberOfOutboundParcels === 0) {
          subject = `${i18n.__("today.Item(s) Received")}`;
          if (enableCustomEmail) {
            text = `
              <div>
                <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src=${`"${logo}"`} /></div>
                <div style="margin-bottom:20px">${clientName} London Mailroom ${i18n.__(
              "today.has accepted item(s) ready for outbound"
            )}.</div>
                <div style="margin-top:20px">${i18n.__(
                  "today.Yours sincerely"
                )},</div>
                <br>
                <div style="margin-bottom:20px">The ${clientName} London Mailroom Team.</div>
              </div>
            `;
          } else {
            text = `
              <div>
                <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src=${`"${logo}"`} /></div>
                <div style="margin-bottom:20px">postrubella ${i18n.__(
                  "today.has accepted item(s) ready for outbound"
                )}.</div>
                <div style="margin-top:20px">${i18n.__(
                  "today.Yours sincerely"
                )},</div>
                <br>
                <div style="margin-bottom:20px">The postrubella Team.</div>
              </div>
            `;
          }
        }
        if (enableCustomEmail) {
          text =
            text +
            `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
              "today.Note"
            )}:</b> ${i18n.__(
              "today.This is an auto generated email, please reply to"
            )} ${clientEmail}</p>`;
        } else {
          text =
            text +
            `<p style="margin-bottom:30px; margin-bottom : 20px; font-size : 11px;"><b>${i18n.__(
              "today.Note"
            )}:</b> ${i18n.__(
              "today.This is an auto generated email, please do not reply"
            )}.</p>`;
        }

        //send email
        Meteor.call(
          "emailQueue",
          to,
          `org_placeholder postrubella ${email}`,
          subject,
          text,
          null,
          replyTo
        );
      }
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `All count error [ function:allCount ]: ${error.message}`
      );
      console.log(error);
    }
  },

  /**
   * Notify location/addresse about delivery of outbound parcels
   *
   * @param {*} {
   *     locations, // [{_id: locationId, locationName}, ...]
   *     parcelIds,
   *     utcOffset, // client timezone
   *   }
   * @returns true
   */
  async todayOutboundDelivered(params) {
    check([params], [Object]);
    var { locations, parcelIds, parcelsOffline, utcOffset } = params;

    const user = Meteor.user();

    if (!user) {
      return console.log(
        "trying to allCount unauthorized.",
        locations,
        "parcelIds",
        parcelIds
      );
    }

    const currentUserId = user._id;
    const currentUsername = user.username;
    const { clientId } = user.profile;
    const start = moment().utcOffset(utcOffset).startOf("day").toDate();
    const client = await Clients.findOne({ _id: clientId });
    const replyTo = client.clientEmail;
    const clientLogo = client.logo;
    locations.forEach(async ({ _id, locationName }) => {
      try {
        const location = await Locations.findOne({
          $or: [
            {
              _id,
            },
            {
              locationName,
            },
          ],
        });

        if (!location) {
          console.error(
            "Location not found with name and id",
            locationName,
            _id
          );

          return;
        }

        const { locationEmail } = location;

        // cancel send if no valid email address: a@a.a
        if (!locationEmail || locationEmail.length < 5) return;

        var locationParcels = await Parcels.find({
          _id: {
            $in: parcelIds,
          },
          clientId,
          deliveredAt: {
            $gt: start,
          },
          deliveredByOwner: currentUserId,
          type: "outbound",
          $or: [
            {
              locationId: location._id,
            },
            {
              location: location.locationName,
            },
          ],
        }).fetch();

        if (
          locationParcels.length === 0 &&
          typeof parcelsOffline !== "undefined"
        ) {
          parcelsOffline.map((offlineParcels) => {
            if (
              offlineParcels.type == "outbound" &&
              offlineParcels.locationId == location._id
            ) {
              locationParcels.push(offlineParcels);
            }
          });
        }

        const numberOfParcels = locationParcels.length;
        const { email } = Meteor.settings.private.smtp;
        let subject = `${numberOfParcels} ${i18n.__("today.item(s) Received")}`;

        // cancel send if no delivered outbound parcels
        if (numberOfParcels === 0) return;

        const allBarcodes = locationParcels.map((locationParcel) => {
          const date = moment(
            locationParcel.createdAt || locationParcel.offlineDate
          )
            .utcOffset(utcOffset)
            .format("Do MMMM YYYY, h:mm:ss a");

          return `<div style="border:1px solid #edeeef; border-radius:5px; margin-bottom:20px; padding:20px;">

              <div><span style="font-weight:bold;text-transform: uppercase;">${
                locationParcel.type
              }</span></div>

              <div><span style="font-weight:bold">${i18n.__(
                "today.Received at"
              )}:</span> ${date}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Barcode"
              )}:</span> ${locationParcel.barcode}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.org_placeholder Nr"
              )}:</span> ${locationParcel.clientUniqueBarcode}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Carrier"
              )}:</span> ${locationParcel.carrier}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Location/Company"
              )}:</span> ${locationParcel.location}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Recipient / Addressee"
              )}:</span> ${locationParcel.recipientName}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Type"
              )}:</span> ${locationParcel.deliveryType}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Outbound Address"
              )}:</span> ${locationParcel.outboundAddress}</div>
              ${attemptedDelvery(locationParcel)}
              <div><span style="font-weight:bold">${i18n.__(
                "today.Delivered At"
              )}: </span> ${moment(locationParcel.deliveredAt)
            .utcOffset(utcOffset)
            .format("lll")}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Delivered By"
              )}: </span> ${locationParcel.deliveredByUsername}</div>
              <div><span style="font-weight:bold">${i18n.__(
                "today.Signee"
              )}: </span> ${locationParcel.signee}</div>

              <div><span style="font-weight:bold">${i18n.__(
                "today.Number of Items"
              )}:</span> ${locationParcel.numberOfItems}</div>
              ${
                locationParcel.notes
                  ? `<div><span style="font-weight:bold">${i18n.__(
                      "today.Notes"
                    )}:</span> ${locationParcel.notes}</div>`
                  : ""
              }
            </div>`;
        });
        let logo;
        let logoWidth;
        let logoHeight;
        if (typeof clientLogo !== "undefined" && clientLogo !== "") {
          logo = clientLogo;
          logoWidth = 300;
          logoHeight = "auto";
        } else {
          logo =
            "https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png";
          logoWidth = 300;
          logoHeight = 80;
        }
        let text = `
          <div>
            <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`"${logo}"`} /></div>
            <div style="margin-bottom:20px">${i18n.__(
              "today.Carrier has successfully collected"
            )} <b> ${numberOfParcels} </b> ${i18n.__("today.item(s)")}.</div>
            <div style="margin-top:20px">${allBarcodes.join("")}</div>
            <div style="margin-top:20px">${i18n.__(
              "today.Yours sincerely"
            )},</div>
            <br>
            <div style="margin-bottom:20px">The postrubella Team.</div>
          </div>
        `;

        if (numberOfParcels === 0) {
          subject = "Item(s) Delivered";
          text = `
            <div>
              <div style="margin-bottom:20px"><img width = ${`${logoWidth}`} height = ${`${logoHeight}`} src= ${`"${logo}"`} /></div>
              <div style="margin-bottom:20px">${i18n.__(
                "today.postrubella has delivered item(s) on your behalf"
              )}.</div>
              <div style="margin-top:20px">${i18n.__(
                "today.Yours sincerely"
              )},</div>
              <br>
              <div style="margin-bottom:20px">The postrubella Team.</div>
            </div>
          `;
        }
        //send email
        Meteor.call(
          "emailQueue",
          locationEmail,
          `org_placeholder postrubella ${email}`,
          subject,
          text,
          null,
          replyTo
        );
      } catch (error) {
        Meteor.call(
          "sendToSlack",
          `All count error: [ function:todayOutboundDelivered ] ${error.message}`
        );
        console.log(error);
      }
    });

    return true;
  },

  /**
   *  Client Group Outbound stats for today
   */

  async clientGroupOutbound(params) {
    check([params], [Object]);

    const user = Meteor.user();
    if (!user) throw new Meteor.Error("not authorized");

    const location = await Locations.find(
      {
        _id: params.locationId,
      },
      {
        fields: {
          locationEmail: 1,
        },
      }
    ).fetch();

    const sender = await Senders.find(
      {
        _id: params.senderId,
      },
      {
        fields: {
          senderEmail: 1,
        },
      }
    ).fetch();

    const replyTo = params.clientEmail;

    this.unblock();
    try {
      const { email } = Meteor.settings.private.smtp;

      const date = moment().format("Do MMMM YYYY, h:mm:ss a");
      let subject = `1 ${i18n.__("today.item(s) Received")}`;

      let photoUrl = "";
      let senderContent;
      let locationContent;
      if (typeof params.photoName !== "undefined" && params.photoName !== "") {
        if (
          Meteor.absoluteUrl().includes("localhost") ||
          Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
        ) {
          photoUrl =
            "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
            moment().format("YYYY") +
            "/" +
            params.photoName;
        } else {
          photoUrl =
            "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
            moment().format("YYYY") +
            "/" +
            params.photoName;
        }
      }

      let mainContent = `
      <div
      style="
        border: 1px solid #edeeef;
        border-radius: 5px;
        margin-bottom: 20px;
        padding: 20px;
      "
      >
      <div>
        <span style="font-weight: bold"
          >${
            params.type == "inbound"
              ? i18n.__("today.Received at")
              : i18n.__("today.Processed at")
          }:</span
        >
        ${date}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Barcode")}:</span>
        ${params.barcode}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__(
          "today.org_placeholder Nr"
        )}:</span>
        ${params.clientUniqueBarcode}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Carrier")}:</span>
        ${params.carrier}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Sender")}:</span>
        ${params.sender}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Destination")}:</span>
        ${params.destination}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Location/Company")}:</span
        >
        ${params.location}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Recipient / Addressee")}:</span
        >
        ${params.recipientName}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Outbound Address")}:</span
        >
        ${params.outboundAddress}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Type")}:</span>
        ${params.deliveryType}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Number of Items")}:</span
        >
        ${params.numberOfItems}
      </div>
      ${
        params.notes
          ? `
      <div>
        <span style="font-weight: bold">${i18n.__("today.Notes")}:</span>
        ${params.notes}
      </div>
      `
          : ""
      } ${
        photoUrl !== ""
          ? `
      <div>
        <span style="font-weight: bold">${i18n.__("today.Photo")}:</span>
        <a href="${photoUrl}"
          >${i18n.__("today.Click here to open image file")}</a
        >
      </div>
      `
          : ""
      }
      </div>`;

      if (params.isUpdateMode) {
        if (params.type == "inbound") {
          locationContent = `
          <div style="margin-bottom:20px">${i18n.__(
            "today.We are pleased to inform you that you have"
          )} <b> 1 </b> 
          ${i18n.__("today.item(s) in the")} postrubella.</div>
          <div style="margin-top:20px">${i18n.__(
            "today.Your parcel(s) status"
          )}: ${i18n.__("today.Collect from postrubella")}</div>`;
          senderContent = `<div style="margin-bottom:20px">Your mail is currently in <b>${params.clientName}</b> mailroom awaiting collection</div>`;
        } else {
          locationContent = `<div style="margin-bottom:20px">Your mail is currently in <b>${params.clientName}</b> mailroom awaiting collection from courier</div>`;
          senderContent = locationContent;
        }
      } else {
        locationContent = `<div style="margin-bottom:20px">Your mail is currently in <b>${params.clientName}</b> mailroom awaiting collection</div>`;
        senderContent = locationContent;
      }

      let senderText = `
        <div>
          <div style="margin-bottom: 20px">
            <img
              width="300"
              height="80"
              src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"
            />
          </div>
          <div style="margin-bottom: 20px">${senderContent}</div>
          <div style="margin-top: 20px">${mainContent}</div>
          <div style="margin-top: 20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br />
          <div style="margin-bottom: 20px">The postrubella Team.</div>
        </div>
      
        <p style="margin-bottom: 30px; margin-bottom: 20px; font-size: 11px">
          <b>${i18n.__("today.Note")}:</b> ${i18n.__(
        "today.This is an auto generated email, please do not reply"
      )}.
      </p>`;
      let locationText = `
        <div>
          <div style="margin-bottom: 20px">
            <img
              width="300"
              height="80"
              src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"
            />
          </div>
          <div style="margin-bottom: 20px">${locationContent}</div>
          <div style="margin-top: 20px">${mainContent}</div>
          <div style="margin-top: 20px">${i18n.__(
            "today.Yours sincerely"
          )},</div>
          <br />
          <div style="margin-bottom: 20px">The postrubella Team.</div>
        </div>
      
        <p style="margin-bottom: 30px; margin-bottom: 20px; font-size: 11px">
          <b>${i18n.__("today.Note")}:</b> ${i18n.__(
        "today.This is an auto generated email, please do not reply"
      )}.
      </p>`;
      //send email to location
      if (location[0].locationEmail) {
        await Meteor.call(
          "sendEmail",
          location[0].locationEmail,
          `org_placeholder postrubella ${email}`,
          params.type == "inbound" ? "Inbound 1 item(s) Received" : subject,
          locationText,
          null,
          replyTo
        );
      }
      //send email to Sender
      await Meteor.call(
        "sendEmail",
        sender[0].senderEmail,
        `org_placeholder postrubella ${email}`,
        subject,
        senderText,
        null,
        replyTo
      );
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `client group Outbound error: ${error.message}`
      );
      console.log(error);
    }
  },

  /**
   *  Client Group Delivered stats for today
   *  Send email notification to sender
   */

  async clientGroupDelivered(params) {
    check([params], [Object]);

    const user = Meteor.user();
    if (!user) throw new Meteor.Error("not authorized");

    const sender = await Senders.find(
      {
        _id: params.senderId,
      },
      {
        fields: {
          senderEmail: 1,
        },
      }
    ).fetch();

    const replyTo = "noreply@org_placeholder.com";
    let subject = "Item successfully arrived";

    this.unblock();
    try {
      const { email } = Meteor.settings.private.smtp;

      const date = moment(params.updatedAt).format("Do MMMM YYYY, h:mm:ss a");
      let photoUrl = "";
      if (typeof params.photoName !== "undefined" && params.photoName !== "") {
        if (
          Meteor.absoluteUrl().includes("localhost") ||
          Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
        ) {
          photoUrl =
            "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
            moment().format("YYYY") +
            "/" +
            params.photoName;
        } else {
          photoUrl =
            "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
            moment().format("YYYY") +
            "/" +
            params.photoName;
        }
      }

      let text = `
        <div>
        <div style="margin-bottom: 20px">
            <img
            width="300"
            height="80"
            src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"
            />
        </div>
        <div style="margin-bottom: 20px">
            Your mail arrived with <b>${params.location}</b> successfully
        </div>
        <div style="margin-top: 20px">
            <div
            style="
                border: 1px solid #edeeef;
                border-radius: 5px;
                margin-bottom: 20px;
                padding: 20px;
            "
            >
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Received at")}:</span
        >
        ${date}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Barcode")}:</span>
        ${params.barcode}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__(
          "today.org_placeholder Nr"
        )}:</span>
        ${params.clientUniqueBarcode}
      </div>
      <div>
        <span style="font-weight: bold">${i18n.__("today.Carrier")}:</span>
        ${params.carrier}
      </div>
      <div>
        <span style="font-weight: bold">
          ${i18n.__("today.Location/Company")}:</span
        >
        ${params.location}
      </div>
      <div>
        <span style="font-weight: bold">
          ${i18n.__("today.Recipient / Addressee")}:</span
        >
        ${params.recipientName}
      </div>
      <div>
        <span style="font-weight: bold"> ${i18n.__("today.Type")}:</span>
        ${params.deliveryType}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Outbound Address")}:</span
        >
        ${params.outboundAddress}
      </div>
      <div>
        <span style="font-weight: bold">
          ${i18n.__("today.Delivered At")}: </span
        >${moment(params.deliveredAt).format("Do MMMM YYYY, h:mm:ss a")}
      </div>
      <div>
        <span style="font-weight: bold"
          >${i18n.__("today.Delivered By")}:
        </span>
        ${params.deliveredByUsername}
      </div>
      <div>
        <div>
          <span style="font-weight: bold">${i18n.__("today.Signee")}: </span>
          ${params.signee}
        </div>

        <span style="font-weight: bold"
          >${i18n.__("today.Number of Items")}:</span
        >
        ${params.numberOfItems}
      </div>
      ${
        params.notes
          ? `
      <div>
        <span style="font-weight: bold">${i18n.__("today.Notes")}:</span>
        ${params.notes}
      </div>
      `
          : ""
      } ${
        photoUrl !== ""
          ? `
      <div>
        <span style="font-weight: bold">${i18n.__("today.Photo")}:</span>
        <a href="${photoUrl}"
          >${i18n.__("today.Click here to open image file")}</a
        >
      </div>
      `
          : ""
      }
        </div>
        </div>
        <div style="margin-top: 20px">${i18n.__("today.Yours sincerely")},</div>
        <br />
        <div style="margin-bottom: 20px">The postrubella Team.</div>
        </div>

        <p style="margin-bottom: 30px; margin-bottom: 20px; font-size: 11px">
        <b>${i18n.__("today.Note")}:</b> ${i18n.__(
        "today.This is an auto generated email, please do not reply"
      )}.
        </p>`;

      //send email to Sender
      await Meteor.call(
        "sendEmail",
        sender[0].senderEmail,
        `org_placeholder postrubella ${email}`,
        subject,
        text,
        null,
        replyTo
      );
    } catch (error) {
      Meteor.call(
        "sendToSlack",
        `client group Outbound error: ${error.message}`
      );
      console.log(error);
    }
  },
});
