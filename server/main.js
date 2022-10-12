// api
import "../imports/api/server/sync";
import "../imports/api/parcels.js";
import "../imports/api/carriers.js";
import "../imports/api/defaultCarriers.js";
import "../imports/api/senders.js";
import "../imports/api/locations.js";
import "../imports/api/recipients.js";
import "../imports/api/clients.js";
import "../imports/api/deliveryTypes.js";
import "../imports/api/defaultDeliveryTypes.js";
import "../imports/api/users.js";
import "../imports/startup/email.js";
import "../imports/startup/accounts-config-server.js";
import "../imports/api/locationStats.js";
import "../imports/api/pdf.js";
import "../imports/api/server/today.js";
import "../imports/api/s3.js";
import "../imports/api/debug.js";
import "../imports/api/slack.js";
import "../imports/api/autoComplete.js";
import "../imports/api/migrations.js";
import "../imports/api/config";
import "../imports/api/helper";
import "../imports/api/outboundEmailLogs";
import "../imports/api/s3UploadLogs";
import "../imports/api/languages";
import "../imports/api/timeZones";
import "../imports/api/userLoginActivity";
import "../imports/api/parcelLogs";
import "../imports/api/clientsGroups";
import "../imports/api/emailQueue";
import { Inject } from "meteor/meteorhacks:inject-initial";
import helmet from "helmet";
const permissionsPolicy = require("permissions-policy");

// Server-side startup function
Meteor.startup(() => {
  if (process.env.NODE_ENV === "production") {
    Meteor.call("sendToSlack", "postrubella server started!");
  } else {
    Meteor.call("sendToSlack", "postrubella dev server started!");
  }
  const live = "https://postrubella.org_placeholder.io/";
  let downloadLink =
    "https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella.apk";

  if (Meteor.absoluteUrl() !== live) {
    downloadLink =
      "https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella-dev.apk";
  }
  // Inject noscript and meta
  Inject.rawHead(
    "noscript",
    '<noscript><style>body {font-size: 25px;text-align: center;line-height: 100vh;}</style><div>Please enable JavaScript in your browser to view this site.</div><br></br><div><a href=" ' +
      downloadLink +
      ' " >Download postrubella for Android</a></div></noscript>'
  );
  Inject.rawHead(
    "meta",
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
  );

  // Browser policies
  BrowserPolicy.content.allowOriginForAll(
    "postrubella.ams3.digitaloceanspaces.com"
  );
  BrowserPolicy.content.allowOriginForAll("https://www.gstatic.com");
  // Helmet configuration
  WebApp.connectHandlers.use(helmet.hsts());
  WebApp.connectHandlers.use(helmet.referrerPolicy());
  WebApp.connectHandlers.use(helmet.noSniff());
  WebApp.connectHandlers.use(helmet.ieNoOpen());
  WebApp.connectHandlers.use(helmet.xssFilter());
  WebApp.connectHandlers.use(helmet.frameguard());
  WebApp.connectHandlers.use(helmet.expectCt());
  WebApp.connectHandlers.use(helmet.dnsPrefetchControl());
  WebApp.connectHandlers.use(helmet.permittedCrossDomainPolicies());
  WebApp.connectHandlers.use(helmet.hidePoweredBy());
  // Permissions Policy
  WebApp.connectHandlers.use(
    permissionsPolicy({
      features: {
        fullscreen: ["self"],
        vibrate: ["none"],
        payment: ["self"],
        syncXhr: [],
      },
    })
  );
});
