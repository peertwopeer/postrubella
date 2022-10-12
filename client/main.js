import React from "react";
import { mount } from "react-mounter";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import App from "/imports/ui/components/App.jsx";
import Dashboard from "/imports/ui/components/Dashboard.jsx";
import ProfileView from "/imports/ui/components/ProfileView.jsx";
import Admin from "/imports/ui/components/Admin.jsx";
import NotFound from "/imports/ui/components/NotFound.jsx";
import CarriersList from "/imports/ui/components/CarriersList.jsx";
import SendersList from "/imports/ui/components/SendersList.jsx";
import postrubellaList from "/imports/ui/components/postrubellaList.jsx";
import LocationsList from "/imports/ui/components/LocationsList.jsx";
import RecipientsList from "/imports/ui/components/RecipientsList.jsx";
import ClientsList from "/imports/ui/components/ClientsList.jsx";
import ReportsPage from "/imports/ui/components/ReportsPage.jsx";
import AddToPostbag from "/imports/ui/components/AddToPostbag.jsx";
import AddToPostbagConfirm from "/imports/ui/components/AddToPostbagConfirm.jsx";
import Postbag from "/imports/ui/components/Postbag.jsx";
import PostbagConfirm from "/imports/ui/components/PostbagConfirm.jsx";
import DeliveryTypesList from "/imports/ui/components/DeliveryTypesList.jsx";
import UserList from "/imports/ui/components/UserList.jsx";
import Download from "/imports/ui/components/Download.jsx";
import NewFunctionality from "/imports/ui/components/NewFunctionality.jsx";
import AdminUserList from "/imports/ui/components/AdminUserList.jsx";
import AdminCarriersList from "/imports/ui/components/AdminCarriersList.jsx";
import Navigation from "/imports/ui/components/Navigation.jsx";
import Syncpostrubella from "/imports/ui/components/Syncpostrubella.jsx";
import OutboundEmailLogsList from "/imports/ui/components/OutboundEmailLogsList.jsx";
import DefaultValues from "/imports/ui/components/DefaultValues.jsx";
import ResetPassword from "/imports/ui/components/ResetPassword.jsx";
import LoginWithToken from "/imports/ui/components/LoginWithToken.jsx";
import ViewImageFile from "/imports/ui/components/ViewImageFile.jsx";
import DashboardWeb from "/imports/ui/components/DashboardWeb.jsx";
import TermsOfUse from "/imports/ui/components/TermsOfUse.jsx";
import TrackParcel from "/imports/ui/components/TrackParcel.jsx";

//For Demo Script
import DeliveryTypeAssign from "/imports/ui/components/DeliveryTypeAssign.jsx";
import "react-virtualized-select/node_modules/react-select/dist/react-select.css";

import {
  Inbound,
  InboundMobile,
  Outbound,
  OutboundMobile,
  postrubellaListOffline,
  PostbagOffline,
  AddToPostbagOffline,
  AddToPostbagConfirmOffline,
  PostbagConfirmOffline,
} from "/imports/ui/containers/";

import Dataset from "/imports/ui/components/Dataset";
import DebugCollection from "/imports/ui/components/DebugCollection";

Meteor.startup(() => {
  //startup codes
});

// Routes: Core
FlowRouter.route("/", {
  action() {
    if (Meteor.isCordova) {
      //check the mob app version is compatible for galaxy server
      const currentVersion = parseFloat(cordova.appInfoSync.version).toFixed(2);
      if (currentVersion >= 19.08) {
        console.log("The version is compatible for galaxy server.");
      } else {
        alert(
          'Your App is out of date. Please download the latest version to login by going to  https://postrubella.org_placeholder.io and select the "Download postrubella for Android" link that appears under the sign in details, and follow the prompts.'
        );
        Meteor.logout(function (err) {
          if (!err) {
            FlowRouter.go("/login");
          }
        });
      }
      //mount the app mobile
      mount(App, {
        content: <Dashboard />,
        title: "Dashboard",
      });
    } else {
      //mount the app web
      mount(App, {
        content: <DashboardWeb />,
        title: "Your Daily Summary",
        navigation: <Navigation />,
      });
    }
  },
  name: "Dashboard",
});
FlowRouter.route("*", {
  name: "undefined",
  action() {
    mount(App, { content: <NotFound />, title: "404" });
  },
});
// Routes: Core: Receive
FlowRouter.route("/receive", {
  action() {
    mount(App, {
      content: <Inbound />,
      title: "Inbound",
      navigation: <Navigation />,
    });
  },
  name: "Inbound",
});
// Routes: Core: postrubella
FlowRouter.route("/postrubella", {
  action(params) {
    mount(App, {
      content: <postrubellaList {...params} />,
      title: "postrubella",
      navigation: <Navigation />,
    });
  },
  name: "postrubellaList",
});
// Routes: Core: Deliver
FlowRouter.route("/add", {
  action() {
    mount(App, {
      content: <AddToPostbag />,
      title: "Fill your postbag",
      navigation: <Navigation />,
    });
  },
  name: "AddToPostbag",
});
FlowRouter.route("/add-postbag-confirm/:parcels", {
  action(params) {
    params.parcels = params.parcels.split(",");
    mount(App, {
      content: <AddToPostbagConfirm {...params} />,
      title: "Confirm Postbag",
      navigation: <Navigation />,
    });
  },
  name: "AddToPostbagConfirm",
});
FlowRouter.route("/postbag", {
  action() {
    mount(App, {
      content: <Postbag />,
      title: "Sign for Parcels",
      navigation: <Navigation />,
    });
  },
  name: "Postbag",
});
FlowRouter.route("/postbag-confirm/:parcels", {
  action(params, queryParams) {
    params.parcels = params.parcels.split(",");
    params.redirectUrl = queryParams.redirect_url;
    mount(App, {
      content: <PostbagConfirm {...params} />,
      title: "Confirm Delivery",
      navigation: <Navigation />,
    });
  },
  name: "PostbagConfirm",
});
// Routes: Admin
FlowRouter.route("/admin", {
  action() {
    mount(App, { content: <Admin />, title: "Admin" });
  },
  name: "Admin",
});
FlowRouter.route("/admin/users", {
  action() {
    mount(App, { content: <AdminUserList />, title: "All Users" });
  },
  name: "Users",
});
FlowRouter.route("/carriers", {
  action() {
    mount(App, { content: <CarriersList />, title: "Carriers" });
  },
  name: "Carriers",
});
FlowRouter.route("/admin/carriers", {
  action() {
    mount(App, { content: <AdminCarriersList />, title: "All Carriers" });
  },
  name: "Carriers Admin",
});
FlowRouter.route("/senders", {
  action() {
    mount(App, { content: <SendersList />, title: "Senders" });
  },
  name: "Senders",
});
FlowRouter.route("/locations", {
  action() {
    mount(App, { content: <LocationsList />, title: "Locations" });
  },
  name: "Locations",
});
FlowRouter.route("/recipients", {
  action() {
    mount(App, { content: <RecipientsList />, title: "Recipients" });
  },
  name: "Recipients",
});
FlowRouter.route("/clients", {
  action() {
    mount(App, { content: <ClientsList />, title: "Clients" });
  },
  name: "Clients",
});
FlowRouter.route("/delivery-type", {
  action() {
    mount(App, { content: <DeliveryTypesList />, title: "Delivery Type" });
  },
  name: "DeliveryType",
});
FlowRouter.route("/users", {
  action() {
    mount(App, { content: <UserList />, title: "Users" });
  },
  name: "Users",
});
FlowRouter.route("/delivery-type-assign", {
  action() {
    mount(App, {
      content: <DeliveryTypeAssign />,
      title: "DeliveryType Assign to Client",
    });
  },
  name: "DeliveryTypeAssign",
});
// Routes: Search + Logs
FlowRouter.route("/reports", {
  action() {
    mount(App, {
      content: <ReportsPage />,
      title: "Search + Generate Reports",
      navigation: <Navigation />,
    });
  },
  name: "Search + Generate Reports",
});
// Routes: Profile
FlowRouter.route("/me", {
  action() {
    mount(App, { content: <ProfileView />, title: "Your Profile" });
  },
  name: "ProfileView",
});
// Routes: Dataset
FlowRouter.route("/dataset/:_id", {
  action() {
    mount(App, {
      content: <Dataset />,
      title: "Load Default Dataset",
    });
  },
  name: "Dataset",
});
FlowRouter.route("/debug", {
  action() {
    mount(App, {
      content: <DebugCollection />,
      title: "Debug Collection",
    });
  },
  name: "Debug Collection",
});
// Routes: Dowwnload
FlowRouter.route("/download", {
  action() {
    mount(Download);
  },
  name: "Download",
});

FlowRouter.route("/newfunctionality", {
  action() {
    mount(NewFunctionality);
  },
  name: "NewFunctionality",
});

FlowRouter.route("/systemFunctionality", {
  action() {
    mount(App, {
      content: <NewFunctionality />,
      title: "What’s new in version 23.15",
    });
  },
  name: "systemFunctionality",
});

FlowRouter.route("/termsOfUse", {
  action() {
    mount(App, {
      content: <TermsOfUse />,
      title: "org_placeholder. LIMITED TERMS OF USE",
    });
  },
  name: "termsOfUse",
});

// // Routes: Sync postrubella
FlowRouter.route("/sync", {
  action() {
    mount(App, {
      content: <Syncpostrubella />,
      title: "Sync postrubella",
      navigation: <Navigation />,
    });
  },
  name: "Sync postrubella",
});
// Routes: Inbound + Offline
FlowRouter.route("/inbound", {
  action() {
    mount(App, {
      content: <Inbound />,
      title: "Inbound",
      navigation: <Navigation />,
    });
  },
  name: "Inbound",
});
FlowRouter.route("/inbound/offline", {
  action() {
    mount(App, {
      content: <InboundMobile />,
      title: "Inbound",
    });
  },
  name: "Inbound Offline",
});
FlowRouter.route("/outbound", {
  action() {
    mount(App, {
      content: <Outbound />,
      title: "Outbound",
      navigation: <Navigation />,
    });
  },
  name: "Outbound",
});
FlowRouter.route("/outbound/offline", {
  action() {
    mount(App, {
      content: <OutboundMobile />,
      title: "Outbound",
    });
  },
  name: "Outbound",
});
FlowRouter.route("/postrubella/offline", {
  action() {
    mount(App, {
      content: <postrubellaListOffline />,
      title: "postrubellaList Offline",
      navigation: <Navigation />,
    });
  },
  name: "postrubellaList Offline",
});
FlowRouter.route("/postbag/offline", {
  action() {
    mount(App, {
      content: <PostbagOffline />,
      title: "My Delivery Offline",
      navigation: <Navigation />,
    });
  },
  name: "My Delivery Offline",
});
FlowRouter.route("/add/offline", {
  action() {
    mount(App, {
      content: <AddToPostbagOffline />,
      title: "Fill your postbag Offline",
      navigation: <Navigation />,
    });
  },
  name: "AddToPostbagOffline",
});
FlowRouter.route("/add-postbag-confirm/offline/:parcels", {
  action(params) {
    params.parcels = params.parcels.split(",");
    mount(App, {
      content: <AddToPostbagConfirmOffline {...params} />,
      title: "Confirm Postbag Offline",
      navigation: <Navigation />,
    });
  },
  name: "AddToPostbagConfirmOffline",
});
FlowRouter.route("/postbag-confirm/offline/:parcels", {
  action(params, queryParams) {
    params.parcels = params.parcels.split(",");
    params.redirectUrl = queryParams.redirect_url;
    mount(App, {
      content: <PostbagConfirmOffline {...params} />,
      title: "Confirm Delivery Offline",
      navigation: <Navigation />,
    });
  },
  name: "PostbagConfirmOffline",
});
FlowRouter.route("/outbound-email-logs", {
  action() {
    mount(App, {
      content: <OutboundEmailLogsList />,
      title: "Outbound Email Logs",
    });
  },
  name: "OutboundEmailLogsList",
});
FlowRouter.route("/deafault-values", {
  action() {
    mount(App, {
      content: <DefaultValues />,
      title: "Set Default Values for Client",
    });
  },
  name: "Default Values",
});
FlowRouter.route("/reset-password/:token", {
  action(params) {
    params.token = params.token.trim();
    mount(App, {
      content: <ResetPassword {...params} />,
      title: "Reset Password",
    });
  },
  name: "Reset Password",
});
FlowRouter.route("/login-with-token/:token", {
  action(params) {
    params.token = params.token.trim();
    mount(App, {
      content: <LoginWithToken {...params} />,
      title: "Login With Token",
    });
  },
  name: "Login With Token",
});
FlowRouter.route("/view-image-file/", {
  action(params) {
    params.fileUrl = FlowRouter.current().queryParams.photoUrl;
    mount(App, {
      content: <ViewImageFile {...params} />,
      title: "View Image File",
    });
  },
  name: "View Image File",
});
FlowRouter.route("/view-parcel-details/", {
  action(params) {
    params.parcelId = FlowRouter.current().queryParams.parcelId;
    mount(App, {
      content: <TrackParcel {...params} />,
      title: "Parcel Details",
      navigation: <Navigation />,
    });
  },
  name: "Parcel Details",
});
