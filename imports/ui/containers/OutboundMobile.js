import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import moment from "moment-timezone";
import { Creatable, createFilter } from "react-select";
import ChipInput from "material-ui-chip-input";
import SelectVirtualized from "react-virtualized-select";
import { Session } from "meteor/session";
import { Random } from "meteor/random";
import { getParcelsDb } from "../../lib/PouchDB";
import fetchPouchDB from "/imports/client/cordova/fetchPouchDB";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Parcel from "/imports/ui/Parcel.jsx";
import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import { Loading } from "/imports/ui/components/";
import { Clients } from "/imports/api/";
import "/imports/languages/en/en.outbound.i18n.yml";
import "/imports/languages/de/de.outbound.i18n.yml";

var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
const publicDir = `${Meteor.settings.public.cdn}/public`;
class OutboundMobile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      barcode: [],
      selectLocationValue: "",
      selectDestinationValue: "",
      lastProcessed: "",
      selectSenderValue: "",
      selectSenderName: "",
      selectLocationClientId: "",
      deliveryTypeValue: "",
      deliveryUserValue: "",
      clientUniqueBarcode: "",
      carriers: [],
      locations: [],
      selectedClientLocations: [],
      destinations: [],
      sendersWithEmail: [],
      deliveryTypes: [],
      users: [],
      clients: [],
      photoUrl: "",
      carrierVal: "",
      recipientVal: "",
      outboundAddress: "",
      pouchDataReady: false,
      sessionParcel: false,
      syncStatus: false,
      receive: true,
      selectDeliveryUserValue: "",
      selectDeliveryTypeValue: "",
      errors: {
        noOfItems: "",
        Carriers: "",
        Recipient: "",
        Location: "",
        ChooseType: "",
        ReceivingAction: "",
        Outbound_addr: "",
        Destination: "",
        Sender: "",
        Barcode: "",
      },
      photo: "",
      photoName: "",
      showPhoto: false,
      parcelId: "",
      isUpdateMode: false,
      showInboundAlert: false,
      isLocationsLoading: false,
      isLoading: false,
    };
  }

  onPhotoChange = (event) => {
    var thisComponent = this;
    this.setState({ showPhoto: true });
    Meteor.startup(function () {
      navigator.camera.getPicture(
        function (imageData) {
          thisComponent.photo.src =
            "data:image/jpeg;base64," +
            imageData.replace(/^data:image\/\w+;base64,/, "");
          thisComponent.setState({ photo: imageData });
          thisComponent.setState({
            photoName: `${Random.id()}-${Meteor.userId()}-photo.jpeg`,
          });
        },
        function (message) {
          console.error(message);
        },
        {
          quality: 40,
          destinationType: Camera.DestinationType.DATA_URL,
          sourceType: Camera.PictureSourceType.CAMERA,
          encodingType: Camera.EncodingType.JPEG,
          correctOrientation: true,
          saveToPhotoAlbum: false,
          targetHeight: 720,
        }
      );
    });
  };

  setOutbound = (event) => {
    this.setState({ outboundAddress: event.target.value });
    const { errors } = this.state;
    errors.Outbound_addr = "";
    this.setState({ errors });
  };
  handleLocationChange = (selectedOption) => {
    if (!selectedOption) return "";
    this.setState({
      selectLocationName: selectedOption.label,
      selectLocationValue: selectedOption.value,
      selectLocationClientId: selectedOption.locationClientId,
    });
    const { errors } = this.state;
    errors.Location = "";
    this.setState({ errors });
  };
  handleDestinationChange = async (selectedOption) => {
    if (!selectedOption) return "";
    if (selectedOption.value != this.props.currentClient[0]._id) {
      this.setState({ isLocationsLoading: true });
      let selectedClientLocations = [];
      let that = this;
      await Meteor.call(
        "locations.locationsByClientId",
        selectedOption.value,
        async function (err, result) {
          if (err) console.log(err);
          if (result) {
            result.map((value) => {
              selectedClientLocations.push({
                value: value._id,
                label: value.locationName,
                locationClientId: value.clientId,
              });
            });
            that.setState({
              selectedClientLocations,
              isLocationsLoading: false,
            });
          }
        }
      );
    }
    this.setState({
      selectDestinationName: selectedOption.label,
      selectDestinationValue: selectedOption.value,
    });
    const { errors } = this.state;
    errors.Destination = "";
    this.setState({ errors });
  };
  handleSenderChange = (selectedOption) => {
    if (!selectedOption) return "";

    this.setState({
      selectSenderName: selectedOption.label,
      selectSenderValue: selectedOption.value,
    });
    const { errors } = this.state;
    errors.Sender = "";
    this.setState({ errors });
  };
  handleDeliveryUserChange = (event) => {
    this.setState({ selectDeliveryUserValue: event.target.value });
    const { errors } = this.state;
    errors.ReceivingAction = "";
    this.setState({ errors });
  };
  handleDeliveryTypeChange = (event) => {
    this.setState({ selectDeliveryTypeValue: event.target.value });
    const { errors } = this.state;
    errors.ChooseType = "";
    this.setState({ errors });
  };
  renderDeliveryTypes() {
    const { deliveryTypes } = this.state;
    if (
      typeof this.props.currentClient[0].deliveryType !== "undefined" &&
      this.props.currentClient[0].deliveryType !== ""
    ) {
      return deliveryTypes.map((deliveryType) => (
        <option
          key={deliveryType._id}
          hidden={
            this.props.currentClient[0].deliveryType ==
            deliveryType.deliveryTypeName
          }
        >
          {deliveryType.deliveryTypeName}
        </option>
      ));
    }
    return deliveryTypes.map((deliveryType) => (
      <option key={deliveryType._id}>{deliveryType.deliveryTypeName} </option>
    ));
  }
  validateInput = (event) => {
    const { errors } = this.state;
    errors.noOfItems = "";
    if (event.target.value <= 0) {
      errors.noOfItems = i18n.__("outbound.Please enter number of items");
    }
    if (parseInt(event.target.value) > 200) {
      errors.noOfItems = i18n.__(
        "outbound.The number of items should be less than or equal to 200"
      );
    }
    this.setState({ errors });
  };

  renderUsers() {
    const { users } = this.state;
    if (
      typeof this.props.currentClient[0].receiveUser !== "undefined" &&
      this.props.currentClient[0].receiveUser !== ""
    ) {
      return users.map((user) => (
        <option
          key={user._id}
          hidden={this.props.currentClient[0].receiveUser == user.username}
        >
          {user.username}
        </option>
      ));
    }
    return users.map((user) => <option key={user._id}>{user.username}</option>);
  }

  renderParcels() {
    if (Session.equals("sessionParcelCount", 0)) return;
    if (this.state.sessionParcel === false) return;
    if (this.state.sessionParcel === true) {
      const firstParcel = Session.get("sessionLastParcel");

      return (
        <div>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {i18n.__("outbound.Latest Received")}
          </Typography>
          <Parcel
            key={firstParcel._id}
            parcel={firstParcel}
            width="full"
            timezone={timeZone.get()}
          />
        </div>
      );
    }
  }

  async fetchPouchData() {
    const pouchData = await fetchPouchDB();

    const mapLabel = (arr, name) =>
      arr.map(({ _id: value, [name]: label }) => ({ value, label }));

    if (pouchData.syncCoreStatus) {
      pouchData.carriers = mapLabel(pouchData.carriers, "carrierName");
      pouchData.recipients = mapLabel(pouchData.recipients, "recipientName");
      pouchData.locations = pouchData.locations.map(
        ({ _id: value, locationName: label }) => ({ value, label })
      );
      pouchData.destinations = pouchData.destinations.map(
        ({ _id: value, clientName: label }) => ({ value, label })
      );
      pouchData.sendersWithEmail = pouchData.sendersWithEmail.map(
        ({ _id: value, senderName: label }) => ({ value, label })
      );
    }
    this.setState(pouchData, () => {
      this.setState({ pouchDataReady: true });
    });
  }
  componentDidMount() {
    this.fetchPouchData();
    Session.set("sessionParcelCount", 0);
    Session.set("sessionLastParcel", 0);
  }

  setRecipient = (val) => {
    this.setState({
      recipientVal: val,
    });
    const { errors } = this.state;
    errors.Recipient = "";
    this.setState({ errors });
  };
  setCarrier = (val) => {
    this.setState({
      carrierVal: val,
    });
    const { errors } = this.state;
    errors.Carriers = "";
    this.setState({ errors });
  };

  handleReceive = async (event) => {
    event.preventDefault();
    const isGroupClient =
      this.props.currentClient[0].clientGroupId != undefined;
    const { errors } = this.state;

    if (isGroupClient && this.state.barcode.length == 0) {
      errors.Barcode = i18n.__("outbound.Please enter a barcode");
      this.setState({ errors });
    }
    if (this.state.carrierVal === "") {
      errors.Carriers = i18n.__("outbound.Please select a carrier");
      this.setState({ errors });
    }
    if (this.state.selectLocationValue === "") {
      errors.Location = i18n.__("outbound.Please select a Location/Company");
      this.setState({ errors });
    }
    if (isGroupClient && this.state.selectDestinationValue === "") {
      errors.Destination = i18n.__("outbound.Please select a Destination");
      this.setState({ errors });
    }
    if (isGroupClient && this.state.selectSenderValue === "") {
      errors.Sender = i18n.__("outbound.Please select a Sender");
      this.setState({ errors });
    }

    if (this.inputRecipient.getValue() === "") {
      errors.Recipient = i18n.__("outbound.Please select a Recipient");
      this.setState({ errors });
    }
    if (!this.state.isUpdateMode) {
      if (this.deliveryTypeSelect.value === "") {
        errors.ChooseType = i18n.__("outbound.Please choose a Delivery type");
        this.setState({ errors });
      }
      if (this.deliveryUserSelect.value === "") {
        errors.ReceivingAction = i18n.__(
          "outbound.Please select a Receiving Action"
        );
        this.setState({ errors });
      }
    }

    if (this.state.outboundAddress === "") {
      errors.Outbound_addr = i18n.__(
        "outbound.Please provide a Outbound Address"
      );
      this.setState({ errors });
    }

    if (this.state.errors.Carriers.length > 0) return;
    if (this.state.errors.ChooseType.length > 0) return;
    if (this.state.errors.ReceivingAction.length > 0) return;
    if (this.state.errors.Location.length > 0) return;
    if (isGroupClient && this.state.errors.Destination.length > 0) return;
    if (isGroupClient && this.state.errors.Sender.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.noOfItems.length > 0) return;
    if (this.state.errors.Outbound_addr.length > 0) return;
    if (isGroupClient && this.state.errors.Barcode.length > 0) return;

    const { clients, currentUser, carrierVal, recipientVal } = this.state;

    const notes = this.notesInput.value.trim();
    const barcode = this.state.barcode;
    const location = this.state.selectLocationName;
    const locationId = this.state.selectLocationValue;
    const deliveryUser = this.state.isUpdateMode
      ? this.state.deliveryUserValue
      : this.deliveryUserSelect.value.trim();
    const deliveryType = this.state.isUpdateMode
      ? this.state.deliveryTypeValue
      : this.deliveryTypeSelect.value.trim();
    const outboundAddress = this.outboundAddressInput.value.trim();
    const numberOfItems = this.numberOfItemsInput.value.trim();

    const carrier = carrierVal.label || "";
    const recipientName = this.inputRecipient.getValue();

    if (carrier.length <= 1) return;
    if (location.length <= 1) return;
    if (outboundAddress.length <= 1) return;
    if (recipientName.length <= 1) return;

    const { clientId, username, owner } = currentUser;

    const type =
      this.state.isUpdateMode &&
      this.props.currentClient[0]._id == this.state.selectLocationClientId
        ? "inbound"
        : "outbound";

    const { clientBarcodeId } = clients[0];
    const clientName = this.props.currentClient[0].clientName;
    const clientEmail = this.props.currentClient[0].clientEmail;
    const enableCustomEmail =
      typeof this.props.currentClient[0].customEmail !== null &&
      typeof this.props.currentClient[0].customEmail !== "undefined"
        ? this.props.currentClient[0].customEmail
        : 0;
    const date = new Date();
    const identifyData = {
      createdAt: date,
      updatedAt: date,
      owner: Meteor.userId(),
      username: Meteor.user().username,
      clientId,
    };

    if (typeof this.state.photo !== "undefined" && this.state.photo !== "") {
      Meteor.call("s3.parcelPhoto", this.state.photo, this.state.photoName);
    }

    if (barcode.length) {
      // insert multiple
      function callback() {
        console.log("all done");
        return true;
      }
      this.setState({ receive: false });
      let itemsProcessed = 0;
      let currentSessionParcels = [];
      let parcelLimit = barcode.length;

      barcode.forEach((item, index, array) => {
        itemsProcessed++;

        const randomNumber = Math.floor(Math.random(100) * 9999);
        const clientBarcodeNumber = `${username.toUpperCase()}-${moment()
          .tz(timeZone.get())
          .format("YYYYMMDD")}${randomNumber}`;
        const clientUniqueBarcode = `${clientBarcodeId}-${clientBarcodeNumber}`;

        const sessionLastParcel = {
          _id: Random.id(),
          notes,
          barcode: item,
          carrier,
          recipientName,
          outboundAddress,
          location,
          locationId,
          deliveryType,
          deliveryUser,
          owner,
          username,
          clientId,
          type,
          numberOfItems,
          updatedAt: date,
          offlineDate: date,
          offline: true,
          clientUniqueBarcode: this.state.isUpdateMode
            ? this.state.clientUniqueBarcode
            : clientUniqueBarcode,
          ...(this.state.isUpdateMode && { parcelId: this.state.parcelId }),
          ...(this.state.isUpdateMode && { temp: "tempData" }), // to prevent updated parcels from listing without syncing
          ...(this.state.photoUrl == "" && { photo: this.state.photo }),
          ...(this.state.photoUrl == "" && { photoName: this.state.photoName }),
          ...(isGroupClient && {
            destination: this.state.selectDestinationName,
          }),
          ...(isGroupClient && {
            destinationId: this.state.selectDestinationValue,
          }),
          ...(isGroupClient && {
            lastProcessed: this.props.currentClient[0].clientName,
          }),
          ...(isGroupClient && { sender: this.state.selectSenderName }),
          ...(isGroupClient && { senderId: this.state.selectSenderValue }),
          ...(isGroupClient && {
            locationClientId: this.state.selectLocationClientId,
          }),
        };
        //insert parcel
        this.insertParcel(sessionLastParcel).then((result) => {
          if (result) {
            //clear form
            const sessionCount =
              parseInt(Session.get("sessionParcelCount")) +
              parseInt(this.numberOfItemsInput.value.trim());
            const parcelsOffline = Session.get("parcelsOffline") || [];
            Session.set("sessionParcelCount", sessionCount);
            // to ensure fields not filled are updated
            Session.set("sessionLastParcel", null);
            Session.set("sessionLastParcel", sessionLastParcel);

            parcelsOffline.push(sessionLastParcel);
            currentSessionParcels.push(sessionLastParcel);
            Session.set("parcelsOffline", parcelsOffline);
            Meteor.call(
              "recipients.checklocation",
              recipientName,
              identifyData,
              1
            );
            this.setState({ sessionParcel: true });
            this.setState({ receive: true });

            //email received parcels count
            if (
              currentSessionParcels.length === parcelLimit &&
              typeof currentSessionParcels !== "undefined" &&
              currentSessionParcels.length !== 0
            ) {
              let parcelsListOffline = currentSessionParcels;
              if (isGroupClient) {
                Meteor.call("clientGroupOutbound", {
                  location: sessionLastParcel.location,
                  locationId: sessionLastParcel.locationId,
                  sender: sessionLastParcel.sender,
                  destination: sessionLastParcel.destination,
                  senderId: sessionLastParcel.senderId,
                  photoName: sessionLastParcel.photoName,
                  type: sessionLastParcel.type,
                  barcode: sessionLastParcel.barcode,
                  clientUniqueBarcode: sessionLastParcel.clientUniqueBarcode,
                  carrier: sessionLastParcel.carrier,
                  recipientName: sessionLastParcel.recipientName,
                  outboundAddress: sessionLastParcel.outboundAddress,
                  deliveryType: sessionLastParcel.deliveryType,
                  numberOfItems: sessionLastParcel.numberOfItems,
                  notes: sessionLastParcel.notes,
                  isUpdateMode: this.state.isUpdateMode,
                  clientName,
                  clientEmail,
                });
              } else {
                Meteor.call("allCount", {
                  parcelsOffline: parcelsListOffline,
                  locationName: location,
                  clientId,
                  clientEmail,
                  clientName,
                  enableCustomEmail,
                  deliveryUser,
                  utcOffset: moment().utcOffset(),
                });
              }
            }
          } else {
            return false;
          }
        });

        if (itemsProcessed === array.length) {
          callback();
        }
      });
    } else {
      const randomNumber = Math.floor(Math.random(100) * 9999);
      const clientBarcodeNumber = `${username.toUpperCase()}-${moment()
        .tz(timeZone.get())
        .format("YYYYMMDD")}${randomNumber}`;
      const clientUniqueBarcode = `${clientBarcodeId}-${clientBarcodeNumber}`;

      const sessionLastParcel = {
        _id: Random.id(),
        notes,
        barcode: "",
        carrier,
        recipientName,
        outboundAddress,
        location,
        locationId,
        deliveryType,
        deliveryUser,
        owner,
        username,
        clientId,
        // qrcode,
        clientUniqueBarcode,
        type,
        photoName: this.state.photoName,
        numberOfItems,
        updatedAt: date,
        offlineDate: date,
        offline: true,
      };
      //insert parcel
      this.insertParcel(sessionLastParcel).then((result) => {
        if (result) {
          //clear form
          const sessionCount =
            parseInt(Session.get("sessionParcelCount")) +
            parseInt(this.numberOfItemsInput.value.trim());
          const parcelsOffline = Session.get("parcelsOffline") || [];
          Session.set("sessionParcelCount", sessionCount);
          // to ensure fields not filled are updated
          Session.set("sessionLastParcel", null);
          Session.set("sessionLastParcel", sessionLastParcel);
          parcelsOffline.push(sessionLastParcel);
          Session.set("parcelsOffline", parcelsOffline);
          Meteor.call(
            "recipients.checklocation",
            recipientName,
            identifyData,
            1
          );
          this.setState({ sessionParcel: true });
          this.setState({ receive: true });
          //email parcel count
          let parcelsListOffline = [];
          parcelsListOffline.push(Session.get("sessionLastParcel"));
          if (
            typeof parcelsListOffline !== "undefined" &&
            parcelsListOffline.length !== 0
          ) {
            Meteor.call("allCount", {
              parcelsOffline: parcelsListOffline,
              locationName: location,
              clientId,
              clientEmail,
              clientName,
              enableCustomEmail,
              deliveryUser,
              utcOffset: moment().utcOffset(),
            });
          }
        } else {
          return false;
        }
      });
    }
    if (!this.state.isUpdateMode) {
      this.deliveryTypeSelect.value =
        typeof this.props.currentClient[0].deliveryType !== "undefined" &&
        this.props.currentClient[0].deliveryType !== ""
          ? this.props.currentClient[0].deliveryType
          : "";
      this.deliveryUserSelect.value =
        typeof this.props.currentClient[0].receiveUser !== "undefined" &&
        this.props.currentClient[0].receiveUser !== ""
          ? this.props.currentClient[0].receiveUser
          : "";
    }
    this.notesInput.value = "";
    this.numberOfItemsInput.value = 1;
    this.setState(
      {
        barcode: [],
        showPhoto: false,
      },
      this.clearBarcodeField()
    );
    this.setState({ photo: "", photoName: "" });
    this.photo.src = "";
  };

  clearBarcodeField = () => {
    let arrLength = this.state.barcode.length;
    this.state.barcode.splice(0, arrLength);
  };

  // async function for  insert parcel
  insertParcel = async (sessionLastParcel) => {
    try {
      const parcelsDb = await getParcelsDb();
      const parcelsOffline = Session.get("parcelsOffline") || [];
      await parcelsDb.put(sessionLastParcel);
      parcelsOffline.push(sessionLastParcel);
      return true;
    } catch (err) {
      console.log("PouchDB .put error: ", err);
      Meteor.call(
        "sendToSlack",
        `Inbound error: ${err.message}. \n${getAppInfo()}`
      );
    }
  };

  clearFields = () => {
    this.inputRecipient.state.value = "";
    this.notesInput.value = "";
    this.numberOfItemsInput.value = 1;
    this.outboundAddressInput.value = "";
    this.deliveryTypeSelect.value =
      typeof this.props.currentClient[0].deliveryType !== "undefined" &&
      this.props.currentClient[0].deliveryType !== ""
        ? this.props.currentClient[0].deliveryType
        : "Select Delivery Type";
    this.deliveryUserSelect.value =
      typeof this.props.currentClient[0].receiveUser !== "undefined" &&
      this.props.currentClient[0].receiveUser !== ""
        ? this.props.currentClient[0].receiveUser
        : "Select Receiving Action";
    this.setState({
      barcode: [],
      carrierVal: "carrierVal",
      recipientVal: "recipientVal",
      selectLocationName: "",
      selectDestinationName: "",
      selectSenderName: "",
      photo: "",
      photoName: "",
      showPhoto: false,
      showInboundAlert: false,
    });
    this.clearBarcodeField();
    if (this.state.photoUrl == "") {
      this.photo.src = "";
    }
  };

  clearPhoto = () => {
    this.photo.src = "";
    this.setState({ showPhoto: false, photo: "", photoName: "" });
  };

  renderSessionParcelCount() {
    if (Session.equals("sessionParcelCount", 0)) return;

    return (
      <div>
        {i18n.__("outbound.Current parcel count")}{" "}
        <b>{Session.get("sessionParcelCount")}</b>
      </div>
    );
  }

  handleClick() {
    const value = new Promise((resolve, reject) => {
      Meteor.startup(() => {
        if (typeof cordova === "undefined") {
          console.log(
            "You can not scan a barcode in the browser. Please try on a device."
          );

          return;
        }
        cordova.plugins.barcodeScanner.scan(
          ({ text }) => resolve(text),
          (error) => {
            reject(new Error(`Scanning failed: ${error.message}`));
          },
          {
            // TODO: orientation not changing. Cordova plugin issue.
            orientation: "portrait",
          }
        );
      });
    });

    value.then((barcode) => {
      if (this.props.currentClient[0].clientGroupId != undefined) {
        if (this.state.barcode.length > 0) {
          alert("Barcode already entered.");
          chips.pop();
          this.setState({ barcodeInputValue: "", barcode: this.state.barcode });
          return;
        } else {
          this.setState({ isLoading: true });
          this.fetchDataByBarcode(barcode.trim());
        }
      } else {
        var chips = this.state.barcode;
        if (chips.includes(barcode.trim())) {
          alert("This barcode has already been scanned");
        }
        chips.push(barcode);
        var chipsTrimmed = chips.map((chip) => chip.trim());
        var chipsFiltered = [...new Set(chipsTrimmed)];
        this.setState({ barcode: chipsFiltered });
      }
    });
    value.catch((error) => {
      this.setState({ barcode: error });
    });
  }

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          onClick={() => this.handleClick()}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("outbound.Scan Barcode")}
        </Button>
      </div>
    );
  }
  fetchDataByBarcode(barcode) {
    const { errors } = this.state;
    Meteor.call(
      "clientGroups.findGroupParcel",
      barcode,
      this.props.currentClient[0].clientGroupId,
      (error, result) => {
        if (error) {
          console.log(error);
          return;
        }
        if (Array.isArray(result) && result.length) {
          Object.keys(errors).forEach((i) => (errors[i] = ""));
          this.notesInput.value = result[0].notes;
          this.numberOfItemsInput.value = result[0].numberOfItems;
          this.outboundAddressInput.value = result[0].outboundAddress;
          (this.deliveryUserSelect.value = result[0].deliveryUser),
            (this.deliveryTypeSelect.value = result[0].deliveryType),
            this.inputRecipient.setValue(result[0].recipientName);
          this.setState({
            parcelId: result[0]._id,
            carrierVal: { label: result[0].carrier },
            selectLocationName: result[0].location,
            selectLocationValue: result[0].locationId,
            selectLocationClientId: result[0].locationClientId,
            selectDestinationName: result[0].destination,
            selectDestinationValue: result[0].destinationId,
            selectSenderName: result[0].sender,
            selectSenderValue: result[0].senderId,
            deliveryTypeValue: result[0].deliveryType,
            deliveryUserValue: result[0].deliveryUser,
            clientUniqueBarcode: result[0].clientUniqueBarcode,
            outboundAddress: result[0].outboundAddress,
            barcode: [result[0].barcode],
            barcodeInputValue: "",
            isUpdateMode: true,
            isLoading: false,
            showPhoto: false,
            selectedClientLocations: [
              {
                label: result[0].location,
                value: result[0].locationId,
                locationClientId: result[0].locationClientId,
              },
            ],
            errors,
          });
          if (this.props.currentClient[0]._id == result[0].locationClientId) {
            this.setState({ showInboundAlert: true });
          } else {
            this.setState({ showInboundAlert: false });
          }
          if (
            typeof result[0].photoName !== "undefined" &&
            result[0].photoName !== ""
          ) {
            if (
              Meteor.absoluteUrl().includes("localhost") ||
              Meteor.absoluteUrl().includes(
                "dev.postrubella.org_placeholder.io"
              )
            ) {
              this.setState({
                photoUrl:
                  "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
                  moment(result[0].createdAt).format("YYYY") +
                  "/" +
                  result[0].photoName,
              });
            } else {
              this.setState({
                photoUrl:
                  "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
                  moment(result[0].createdAt).format("YYYY") +
                  "/" +
                  result[0].photoName,
              });
            }
          } else {
            this.setState({ photoUrl: "" });
          }
        } else {
          errors.Barcode = "";
          this.setState({
            parcelId: "",
            carrierVal: "",
            selectLocationName: "",
            selectLocationValue: "",
            selectLocationClientId: "",
            selectDestinationName: "",
            selectDestinationValue: "",
            clientUniqueBarcode: "",
            selectSenderName: "",
            photoUrl: "",
            selectSenderValue: "",
            outboundAddress: "",
            barcodeInputValue: "",
            barcode: [barcode],
            isUpdateMode: false,
            showInboundAlert: false,
            isLoading: false,
            showPhoto: false,
            errors,
          });
          this.numberOfItemsInput.value = 1;
          this.outboundAddressInput.value = "";
          this.inputRecipient.setValue("");
          this.notesInput.value = "";
          this.deliveryUserSelect.value = "";
        }
      }
    );
  }
  handleChangeChips(chips) {
    if (this.props.currentClient[0].clientGroupId != undefined) {
      if (this.state.barcode.length > 0) {
        alert("Barcode already entered.");
        chips.pop();
        this.setState({ barcodeInputValue: "", barcode: this.state.barcode });
        return;
      } else {
        this.setState({ isLoading: true });
        this.fetchDataByBarcode(chips[chips.length - 1]);
      }
    } else {
      if (this.state.barcode.includes(chips[chips.length - 1])) {
        alert("This barcode has already been scanned");
        chips.pop();
        return;
      }
      this.setState({ barcode: chips });
      const { errors } = this.state;
      errors.Barcode = "";
      this.setState({ errors });
    }
  }

  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips });
  }

  render() {
    const { carriers, carrierVal, syncStatus, recipients, recipientVal } =
      this.state;
    const { status } = this.props;
    if (status.connected) {
      if (this.props.currentClientSub && this.state.pouchDataReady) {
        if (!syncStatus) {
          return (
            <Loading
              message={i18n.__(
                "outbound.Please sync your postrubella before taking any offline inbound or outbound items. Click here to do this"
              )}
              link="/sync"
              color="red"
            />
          );
        }
        return (
          <div className="width-narrow clearfix">
            {this.renderBarcodeScanner()}

            {this.state.isLoading ? (
              <div>
                <div className="simple-loader">
                  <img src={`${publicDir}/img/loading.gif`} />
                </div>
                <div className="data-processing-message">
                  <br></br>
                  <b>{i18n.__("common.The data is loading please wait")}</b>
                </div>
              </div>
            ) : (
              ""
            )}
            {this.state.showInboundAlert ? (
              <div className="form-row">
                <Button fullWidth={true} variant="contained" color="inherit">
                  The parcel will be saved as an inbound parcel and you can
                  deliver it from the postrubella list.
                </Button>
              </div>
            ) : (
              ""
            )}
            <div className="form-row">
              <ChipInput
                label={i18n.__(
                  "outbound.Optional: Type barcode and press enter"
                )}
                onChange={(chips) => this.handleChangeChips(chips)}
                value={this.state.barcode}
                onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
                fullWidth={true}
                id="barcode_id"
                allowDuplicates={true}
              />
              <p
                className="red"
                hidden={this.state.errors.Barcode.length == ""}
              >
                {this.state.errors.Barcode}
              </p>
            </div>

            <div className="form-row">
              <div className="form-row">
                <SelectVirtualized
                  promptTextCreator={(input) => `ADD NEW CARRIER: ${input}`}
                  placeholder={i18n.__("outbound.Choose carrier")}
                  name="carrier"
                  value={carrierVal}
                  options={carriers}
                  onChange={this.setCarrier}
                  selectComponent={Creatable}
                  disabled={this.state.isUpdateMode}
                />
                <p
                  className="red"
                  hidden={this.state.errors.Carriers.length == ""}
                >
                  {this.state.errors.Carriers}
                </p>
              </div>
            </div>
            {this.props.currentClient[0].clientGroupId ? (
              <div className="form-row">
                <SelectVirtualized
                  name="destination"
                  value={this.state.selectDestinationValue}
                  onChange={this.handleDestinationChange}
                  placeholder={i18n.__("outbound.Destination")}
                  options={this.state.destinations}
                  disabled={this.state.isUpdateMode}
                />
                <p
                  className="red"
                  hidden={this.state.errors.Destination.length == ""}
                >
                  {this.state.errors.Destination}
                </p>
              </div>
            ) : (
              ""
            )}
            <div className="form-row">
              <SelectVirtualized
                name="locations"
                value={this.state.selectLocationValue}
                onChange={this.handleLocationChange}
                isLoading={this.state.isLocationsLoading}
                filterOption={createFilter({ ignoreAccents: false })}
                placeholder={i18n.__("outbound.Choose Location/Company")}
                disabled={
                  this.state.isUpdateMode || this.state.isLocationsLoading
                }
                options={
                  this.state.selectDestinationValue &&
                  this.state.selectDestinationValue !=
                    this.props.currentClient[0]._id
                    ? this.state.selectedClientLocations
                    : this.state.locations
                }
              />
              <p
                className="red"
                hidden={this.state.errors.Location.length == ""}
              >
                {this.state.errors.Location}
              </p>
            </div>

            {this.props.currentClient[0].clientGroupId ? (
              <div className="form-row">
                <SelectVirtualized
                  name="sendersWithEmail"
                  value={
                    this.state.isUpdateMode
                      ? { label: this.state.selectSenderName }
                      : this.state.selectSenderValue
                  }
                  onChange={this.handleSenderChange}
                  placeholder={i18n.__("outbound.Sender")}
                  options={this.state.sendersWithEmail}
                  disabled={this.state.isUpdateMode}
                />
                <p
                  className="red"
                  hidden={this.state.errors.Sender.length == ""}
                >
                  {this.state.errors.Sender}
                </p>
              </div>
            ) : (
              ""
            )}

            {this.state.isUpdateMode ? (
              <div className="form-row">
                <SelectVirtualized
                  value={{ label: this.state.deliveryTypeValue }}
                  disabled
                />
              </div>
            ) : (
              <div className="form-row">
                <select
                  name="deliveryTypes"
                  ref={(c) => {
                    this.deliveryTypeSelect = c;
                  }}
                  defaultValue={
                    typeof this.props.currentClient[0].deliveryType !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryType !== ""
                      ? this.props.currentClient[0].deliveryType
                      : i18n.__("outbound.Select Delivery Type")
                  }
                  onChange={this.handleDeliveryTypeChange}
                >
                  <option
                    value={
                      typeof this.props.currentClient[0].deliveryType !==
                        "undefined" &&
                      this.props.currentClient[0].deliveryType !== ""
                        ? this.props.currentClient[0].deliveryType
                        : ""
                    }
                    defaultValue
                  >
                    {typeof this.props.currentClient[0].deliveryType !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryType !== ""
                      ? this.props.currentClient[0].deliveryType
                      : i18n.__("outbound.Select Delivery Type")}
                  </option>
                  <option
                    hidden={
                      typeof this.props.currentClient[0].deliveryType !==
                        "undefined" &&
                      this.props.currentClient[0].deliveryType !== ""
                        ? this.props.currentClient[0].deliveryType == "Normal"
                        : false
                    }
                    value="Normal"
                  >
                    {i18n.__("outbound.Normal")}
                  </option>
                  {this.renderDeliveryTypes()}
                </select>
                <p
                  className="red"
                  hidden={this.state.errors.ChooseType.length == ""}
                >
                  {this.state.errors.ChooseType}
                </p>
              </div>
            )}

            {this.state.isUpdateMode ? (
              <div className="form-row">
                <SelectVirtualized
                  value={{ label: this.state.deliveryUserValue }}
                  disabled
                />
              </div>
            ) : (
              <div className="form-row">
                <select
                  name="users"
                  ref={(c) => {
                    this.deliveryUserSelect = c;
                  }}
                  defaultValue={
                    typeof this.props.currentClient[0].receiveUser !==
                      "undefined" &&
                    this.props.currentClient[0].receiveUser !== ""
                      ? this.props.currentClient[0].receiveUser
                      : ""
                  }
                  onChange={this.handleDeliveryUserChange}
                >
                  <option
                    value={
                      typeof this.props.currentClient[0].receiveUser !==
                        "undefined" &&
                      this.props.currentClient[0].receiveUser !== ""
                        ? this.props.currentClient[0].receiveUser
                        : ""
                    }
                    defaultValue
                  >
                    {typeof this.props.currentClient[0].receiveUser !==
                      "undefined" &&
                    this.props.currentClient[0].receiveUser !== ""
                      ? this.props.currentClient[0].receiveUser
                      : i18n.__("outbound.Select Receiving Action")}
                  </option>
                  {this.renderUsers()}
                </select>
                <p
                  className="red"
                  hidden={this.state.errors.ReceivingAction.length == ""}
                >
                  {this.state.errors.ReceivingAction}
                </p>
              </div>
            )}

            <div className="form-row">
              <input
                type="text"
                ref={(c) => {
                  this.outboundAddressInput = c;
                }}
                placeholder={i18n.__("outbound.Outbound Address")}
                onChange={this.setOutbound}
                defaultValue=""
              />
              <p
                className="red"
                hidden={this.state.errors.Outbound_addr.length == ""}
              >
                {this.state.errors.Outbound_addr}
              </p>
            </div>

            <div className="form-row">
              <div className="form-row">
                <InputAutosuggest
                  onRef={(ref) => {
                    this.inputRecipient = ref;
                  }}
                  getValue={(obj) => obj.recipientName}
                  url="autocomplete.recipients"
                  placeholder={i18n.__("outbound.Choose recipient")}
                  onChange={() => {
                    const { errors } = this.state;
                    errors.Recipient = "";
                    this.setState({ errors });
                  }}
                />
                <p
                  className="red"
                  hidden={this.state.errors.Recipient.length == ""}
                >
                  {this.state.errors.Recipient}
                </p>
              </div>
            </div>

            <div className="form-row">
              <input
                type="number"
                ref={(c) => {
                  this.numberOfItemsInput = c;
                }}
                placeholder={i18n.__("outbound.Number of Items")}
                defaultValue="1"
                min="1"
                max="30"
                onChange={this.validateInput}
              />
              <p
                className="red"
                hidden={this.state.errors.noOfItems.length == 0}
              >
                {this.state.errors.noOfItems}
              </p>
            </div>

            <div className="form-row">
              <input
                type="text"
                ref={(c) => {
                  this.notesInput = c;
                }}
                placeholder={i18n.__("outbound.Optional: Additional notes")}
                maxLength="300"
              />
            </div>
            {typeof this.state.photoUrl !== "undefined" &&
            this.state.photoUrl !== "" ? (
              <div className="form-row">
                <Button
                  fullWidth={true}
                  color="inherit"
                  variant="outlined"
                  onClick={() =>
                    FlowRouter.go(
                      "/view-image-file?photoUrl=" + this.state.photoUrl
                    )
                  }
                >
                  {i18n.__("common.Show parcel photo")}
                </Button>
              </div>
            ) : (
              <div className="form-row-label left col col-12">
                <div
                  className="form-row-label left col col-12"
                  hidden={this.state.isUpdateMode}
                >
                  {i18n.__("common.Add Photo")}
                  <Button
                    onClick={this.onPhotoChange}
                    fullWidth={true}
                    color="primary"
                    variant="contained"
                  >
                    {i18n.__("common.Add Photo")}
                  </Button>
                </div>
              </div>
            )}
            {/* Image preview */}
            <div className="form-row-label left inbound-inline col col-12">
              {this.state.showPhoto ? (
                <React.Fragment>
                  <br></br>
                  <img
                    ref={(c) => {
                      this.photo = c;
                    }}
                  ></img>
                  <div className="form-row left col col-6 margin-bottom-65">
                    <Button
                      onClick={this.clearPhoto}
                      fullWidth={true}
                      color="primary"
                      variant="contained"
                    >
                      {i18n.__("common.Clear Photo")}
                    </Button>
                  </div>
                </React.Fragment>
              ) : (
                <img src=""></img>
              )}
            </div>

            <div className="margin-bottom-135">
              <div className="form-row left col col-6">
                <Button
                  onClick={this.clearFields}
                  fullWidth={true}
                  color="primary"
                  variant="contained"
                >
                  {i18n.__("outbound.Clear")}
                </Button>
              </div>
              <div className="form-row right col col-6">
                <Button
                  onClick={this.handleReceive}
                  fullWidth={true}
                  color="primary"
                  variant="contained"
                  disabled={!this.state.receive}
                >
                  {i18n.__("outbound.Receive")}
                </Button>
              </div>
            </div>

            {this.renderSessionParcelCount()}
            <br></br>
            <ul>{this.renderParcels()}</ul>
          </div>
        );
      } else {
        return (
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>{i18n.__("common.The data is loading please wait")}</b>
            </div>
          </div>
        );
      }
    }
    return (
      <div className="width-narrow">
        <div>
          <div className="simple-loader">
            <img src={`${publicDir}/img/loading.gif`} />
          </div>
          <div className="data-processing-message">
            <br></br>
            <b>
              {i18n.__(
                "common.You are offline check your internet connection and try again"
              )}
            </b>
          </div>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  var currentClientSub = Meteor.subscribe("currentClient").ready();
  const user = Meteor.user();

  const query = {};
  //set timezone and clientId
  if (currentClientSub) {
    const currentClient = Clients.find({}).fetch();

    if (user) {
      if (
        typeof user.profile.timezone !== "undefined" &&
        user.profile.timezone !== ""
      ) {
        timeZone.set(user.profile.timezone);
      } else if (
        typeof currentClient[0].defaultTimeZone !== "undefined" &&
        currentClient[0].defaultTimeZone !== ""
      ) {
        timeZone.set(currentClient[0].defaultTimeZone);
      }
      query.clientId = user.profile.clientId;
    }
  }

  return {
    currentClient: Clients.find({ _id: query.clientId }).fetch(),
    currentClientSub: currentClientSub,
    status: Meteor.status(),
  };
})(OutboundMobile);
