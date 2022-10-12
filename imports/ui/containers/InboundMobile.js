import React, { Component } from "react";
import moment from "moment-timezone";
import { Creatable, createFilter } from "react-select";
import ChipInput from "material-ui-chip-input";
import SelectVirtualized from "react-virtualized-select";
import { withTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Random } from "meteor/random";
import { getParcelsDb } from "../../lib/PouchDB";
import fetchPouchDB from "/imports/client/cordova/fetchPouchDB";
import { Clients } from "/imports/api/";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Parcel from "/imports/ui/Parcel.jsx";
import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import { Loading } from "/imports/ui/components/";
import "/imports/languages/en/en.inbound.i18n.yml";
import "/imports/languages/de/de.inbound.i18n.yml";
import "/imports/languages/en-JM/en-JM.inbound.i18n.yml";

const DAFAULT_SELECT_LOCATION = "unassigned";
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
const publicDir = `${Meteor.settings.public.cdn}/public`;
class InboundMobile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      barcode: [],
      carriers: [],
      senders: [],
      locations: [],
      deliveryTypes: [],
      recipients: [],
      users: [],
      clients: [],

      carrierVal: "",
      recipientVal: "",
      senderVal: "",
      selectLocationValue: "",
      selectDeliveryUserValue: "",
      selectAssignUserValue: "",
      sessionParcel: false,
      syncStatus: false,
      pouchDataReady: false,
      receive: true,
      errors: {
        noOfItems: "",
        Carriers: "",
        Recipient: "",
        Location: "",
        ChooseType: "",
      },
      photo: "",
      photoName: "",
      showPhoto: false,
    };
  }

  async fetchPouchData() {
    const pouchData = await fetchPouchDB();

    const mapLabel = (arr, name) =>
      arr.map(({ _id: value, [name]: label }) => ({ value, label }));

    if (pouchData.syncCoreStatus) {
      pouchData.carriers = mapLabel(pouchData.carriers, "carrierName");
      pouchData.senders = mapLabel(pouchData.senders, "senderName");
      pouchData.recipients = mapLabel(pouchData.recipients, "recipientName");
      pouchData.locations = pouchData.locations.map(
        ({ _id: value, locationName: label }) => ({ value, label })
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

  handleLocationChange = (selectedOption) => {
    if (!selectedOption) return "";

    this.setState({
      selectLocationName: selectedOption.label,
      selectLocationValue: selectedOption.value,
    });
    const { errors } = this.state;
    errors.Location = "";
    this.setState({ errors });
  };
  handleDeliveryUserChange = (event) => {
    this.setState({ selectDeliveryUserValue: event.target.value });
  };
  handleAssignUserChange = (event) => {
    this.setState({ selectAssignUserValue: event.target.value });
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
      <option key={deliveryType._id}> {deliveryType.deliveryTypeName} </option>
    ));
  }
  validateInput = (event) => {
    const { errors } = this.state;
    errors.noOfItems = "";
    if (event.target.value <= 0) {
      errors.noOfItems = i18n.__("inbound.Please enter number of items");
    }
    if (parseInt(event.target.value) > 500) {
      errors.noOfItems = i18n.__(
        "inbound.The number of items should be less than or equal to 500"
      );
    }
    this.setState({ errors });
  };
  renderUsers() {
    const { users } = this.state;
    if (
      typeof this.props.currentClient[0].deliveryUser !== "undefined" &&
      this.props.currentClient[0].deliveryUser !== ""
    ) {
      return users.map((user) => (
        <option
          key={user._id}
          hidden={this.props.currentClient[0].deliveryUser == user.username}
        >
          {user.username}
        </option>
      ));
    }
    return users.map((user) => (
      <option key={user._id}>{user.username} </option>
    ));
  }

  renderParcels() {
    if (Session.equals("sessionParcelCount", 0)) return;
    if (this.state.sessionParcel === false) return;
    if (this.state.sessionParcel === true) {
      const firstParcel = Session.get("sessionLastParcel");

      return (
        <div>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {i18n.__("inbound.Latest Received")}
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

  setCarrier = (val) => {
    this.setState({
      carrierVal: val,
    });
    const { errors } = this.state;
    errors.Carriers = "";
    this.setState({ errors });
  };

  onSelected = () => {
    if (this.state.xraychecked) {
      this.setState({
        xraychecked: false,
      });
    } else {
      this.setState({
        xraychecked: true,
      });
    }
  };

  uncheckIt() {
    this.setState({
      xraychecked: false,
    });
  }

  handleReceive = async (event) => {
    event.preventDefault();
    const { errors } = this.state;

    if (this.state.carrierVal === "") {
      errors.Carriers = i18n.__("inbound.Please select a carrier");
      this.setState({ errors });
    }
    if (this.state.selectLocationValue === "") {
      errors.Location = i18n.__("inbound.Please select a Location/Company");
      this.setState({ errors });
    }
    if (this.inputRecipient.getValue() === "") {
      errors.Recipient = i18n.__("inbound.Please select a Recipient");
      this.setState({ errors });
    }
    if (this.deliveryTypeSelect.value === "") {
      errors.ChooseType = i18n.__("inbound.Please choose a Delivery type");
      this.setState({ errors });
    }

    if (this.state.errors.Carriers.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.Location.length > 0) return;
    if (this.state.errors.noOfItems.length > 0) return;
    if (this.state.errors.ChooseType.length > 0) return;

    const {
      clients,
      currentUser,
      carrierVal,
      photo,
      photoName,
      selectAssignUserValue,
    } = this.state;

    const notes = this.notesInput.value.trim();
    const barcode = this.state.barcode;
    const location = this.state.selectLocationName;
    const locationId = this.state.selectLocationValue;
    const deliveryUser = this.deliveryUserSelect.value.trim();
    const deliveryType = this.deliveryTypeSelect.value.trim();
    const numberOfItems = this.numberOfItemsInput.value.trim();
    let xray = 0;
    if (this.xrayInput.checked) xray = 1;

    const carrier = carrierVal.label;
    const sender = this.inputSender.getValue();
    const recipientName = this.inputRecipient.getValue();
    const { clientId, username, owner } = currentUser;

    const type = "inbound";

    const clientName = this.props.currentClient[0].clientName;
    const clientEmail = this.props.currentClient[0].clientEmail;
    const enableCustomEmail =
      typeof this.props.currentClient[0].customEmail !== null &&
      typeof this.props.currentClient[0].customEmail !== "undefined"
        ? this.props.currentClient[0].customEmail
        : 0;

    if (carrier.length <= 1) return;
    if (location.length <= 1) return;
    if (deliveryUser === "unassigned") return;

    const { clientBarcodeId } = clients[0];

    const date = new Date();

    const identifyData = {
      createdAt: date,
      updatedAt: date,
      owner: Meteor.userId(),
      username: Meteor.user().username,
      clientId,
    };

    if (typeof photo !== "undefined" && photo !== "") {
      Meteor.call("s3.parcelPhoto", photo, photoName);
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
          sender,
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
          numberOfItems,
          updatedAt: date,
          offlineDate: date,
          offline: true,
          xrayInput: xray,
          photoName,
          assignUser: selectAssignUserValue,
        };

        //insert parcel
        this.insertParcel(sessionLastParcel).then((result) => {
          console.log(result);
          if (result) {
            // Clear form
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
              0
            );
            Meteor.call("senders.checksender", sender, identifyData);
            this.setState({ sessionParcel: true });
            this.setState({ receive: true });

            //email received parcels count
            if (
              currentSessionParcels.length === parcelLimit &&
              typeof currentSessionParcels !== "undefined" &&
              currentSessionParcels.length !== 0
            ) {
              let parcelsListOffline = currentSessionParcels;
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

        if (itemsProcessed === array.length) {
          callback();
        }
      });
    } else {
      //insert single parcel
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
        sender,
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
        numberOfItems,
        updatedAt: date,
        offlineDate: date,
        offline: true,
        xrayInput: xray,
        photoName,
        assignUser: selectAssignUserValue,
      };

      //insert parcel
      await this.insertParcel(sessionLastParcel).then((result) => {
        console.log(result);
        if (result) {
          // Clear form
          const sessionCount =
            parseInt(Session.get("sessionParcelCount")) +
            parseInt(this.numberOfItemsInput.value.trim());
          Session.set("sessionParcelCount", sessionCount);
          const parcelsOffline = Session.get("parcelsOffline") || [];
          // to ensure fields not filled are updated
          Session.set("sessionLastParcel", null);
          Session.set("sessionLastParcel", sessionLastParcel);
          parcelsOffline.push(sessionLastParcel);
          Session.set("parcelsOffline", parcelsOffline);
          Meteor.call(
            "recipients.checklocation",
            recipientName,
            identifyData,
            0
          );
          Meteor.call("senders.checksender", sender, identifyData);
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
    this.deliveryTypeSelect.value =
      typeof this.props.currentClient[0].deliveryType !== "undefined" &&
      this.props.currentClient[0].deliveryType !== ""
        ? this.props.currentClient[0].deliveryType
        : "";
    this.deliveryUserSelect.value =
      typeof this.props.currentClient[0].deliveryUser !== "undefined" &&
      this.props.currentClient[0].deliveryUser !== ""
        ? this.props.currentClient[0].deliveryUser
        : "";
    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.xrayInput.value = "";
    this.uncheckIt();
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
        `App Inbound error: ${err.message}. \n${getAppInfo()}`
      );
    }
  };

  clearFields = () => {
    this.setState({
      barcode: [],
      carrierVal: "carrierVal",
      recipientVal: "recipientVal",
      senderVal: "senderVal",
      selectLocationName: DAFAULT_SELECT_LOCATION,
      photo: "",
      photoName: "",
      showPhoto: false,
    });
    this.inputRecipient.state.value = "";
    this.inputSender.state.value = "";
    this.deliveryTypeSelect.value =
      typeof this.props.currentClient[0].deliveryType !== "undefined" &&
      this.props.currentClient[0].deliveryType !== ""
        ? this.props.currentClient[0].deliveryType
        : "";
    this.deliveryUserSelect.value =
      typeof this.props.currentClient[0].deliveryUser !== "undefined" &&
      this.props.currentClient[0].deliveryUser !== ""
        ? this.props.currentClient[0].deliveryUser
        : "";
    this.assignUserSelect.value = "";
    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.xrayInput.value = "";
    this.clearBarcodeField();
    this.uncheckIt();
    this.photo.src = "";
  };

  clearPhoto = () => {
    this.photo.src = "";
    this.setState({ showPhoto: false, photo: "", photoName: "" });
  };

  renderSessionParcelCount() {
    if (Session.equals("sessionParcelCount", 0)) return;

    return (
      <div>
        {i18n.__("inbound.Current parcel count")}{" "}
        <b>{Session.get("sessionParcelCount")}</b>
      </div>
    );
  }

  handleClick = () => {
    const value = new Promise((resolve, reject) => {
      Meteor.startup(() => {
        if (typeof cordova === "undefined") {
          // resolve('You are testing in browser');
          console.log(
            "You can not scan a barcode in the browser. Please try on a device."
          );

          return;
        }
        cordova.plugins.barcodeScanner.scan(
          ({ text }) => {
            resolve(text);
          },
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

    // const self = this;

    value.then((barcode) => {
      var chips = this.state.barcode;
      if (chips.includes(barcode.trim())) {
        alert("This barcode has already been scanned");
      }
      chips.push(barcode);
      var chipsTrimmed = chips.map((chip) => chip.trim());
      var chipsFiltered = [...new Set(chipsTrimmed)];
      this.setState({ barcode: chipsFiltered });
    });
    value.catch((error) => {
      this.setState({ barcode: [] });
    });
  };

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          onClick={this.handleClick}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("inbound.Scan Barcode")}
        </Button>
      </div>
    );
  }

  handleChangeChips(chips) {
    if (this.state.barcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ barcode: chips });
  }

  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips });
  }

  render() {
    const { carriers, carrierVal, senderVal, syncStatus } = this.state;
    const { status } = this.props;
    if (status.connected) {
      if (this.props.currentClientSub && this.state.pouchDataReady) {
        if (!syncStatus) {
          return (
            <Loading
              message={i18n.__(
                "inbound.Please sync your postrubella before taking any offline inbound or outbound items. Click here to do this"
              )}
              link="/sync"
              color="red"
            />
          );
        }
        return (
          <div className="width-narrow clearfix">
            {this.renderBarcodeScanner()}

            <div className="form-row">
              <ChipInput
                label={i18n.__(
                  "inbound.Optional: Scan / Type barcode and press enter"
                )}
                value={this.state.barcode}
                onChange={(chips) => this.handleChangeChips(chips)}
                onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
                fullWidth={true}
                id="barcode_id"
                allowDuplicates={true}
              />
            </div>

            <div className="form-row">
              <div className="form-row">
                <SelectVirtualized
                  promptTextCreator={(input) => `ADD NEW CARRIER: ${input}`}
                  placeholder={i18n.__("inbound.Choose carrier")}
                  name="carrier"
                  value={carrierVal}
                  options={carriers}
                  onChange={this.setCarrier}
                  selectComponent={Creatable}
                />
                <p
                  className="red"
                  hidden={this.state.errors.Carriers.length == ""}
                >
                  {this.state.errors.Carriers}
                </p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-row">
                <InputAutosuggest
                  onRef={(ref) => {
                    this.inputSender = ref;
                  }}
                  getValue={(obj) => obj.senderName}
                  url="autocomplete.senders"
                  placeholder={i18n.__("inbound.Enter sender's Info")}
                  onChange={function () {}}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <SelectVirtualized
                name="locations"
                defaultValue=""
                filterOption={createFilter({ ignoreAccents: false })}
                value={this.state.selectLocationValue}
                onChange={this.handleLocationChange}
                placeholder={i18n.__("inbound.Choose Location/Company")}
                options={this.state.locations}
              />
              <p
                className="red"
                hidden={this.state.errors.Location.length == ""}
              >
                {this.state.errors.Location}
              </p>
            </div>

            <div className="form-row">
              <InputAutosuggest
                onRef={(ref) => {
                  this.inputRecipient = ref;
                }}
                getValue={(obj) => obj.recipientName}
                url="autocomplete.recipients"
                placeholder={i18n.__("inbound.Enter recipient's name")}
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

            <div className="form-row">
              <select
                name="deliveryTypes"
                ref={(c) => {
                  this.deliveryTypeSelect = c;
                }}
                // defaultValue={this.state.clients[0].deliveryType ? this.state.clients[0].deliveryType : "Select Delivery Type"}
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
                    : i18n.__("inbound.Select Delivery Type")}
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
                  {i18n.__("inbound.Normal")}
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

            <div className="form-row">
              <select
                name="users"
                ref={(c) => {
                  this.deliveryUserSelect = c;
                }}
                onChange={this.handleDeliveryUserChange}
              >
                {typeof this.props.currentClient[0].deliveryUser !==
                  "undefined" &&
                this.props.currentClient[0].deliveryUser !== "" ? (
                  <option
                    value={this.props.currentClient[0].deliveryUser}
                    defaultValue
                  >
                    {this.props.currentClient[0].deliveryUser}
                  </option>
                ) : (
                  <option value="N/A">Assign Action</option>
                )}

                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser ==
                        "Collect from postrubella"
                      : false
                  }
                  value="Collect from postrubella"
                >
                  {i18n.__("inbound.Collect from postrubella")}
                </option>
                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser == "Reception"
                      : false
                  }
                  value="Reception"
                >
                  {i18n.__("inbound.Reception")}
                </option>
                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser == "Security"
                      : false
                  }
                  value="Security"
                >
                  {i18n.__("inbound.Security")}
                </option>
                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser ==
                        "Delivery AM"
                      : false
                  }
                  value="Delivery AM"
                >
                  {i18n.__("inbound.Delivery AM")}
                </option>
                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser ==
                        "Delivery PM"
                      : false
                  }
                  value="Delivery PM"
                >
                  {i18n.__("inbound.Delivery PM")}
                </option>
                <option
                  hidden={
                    typeof this.props.currentClient[0].deliveryUser !==
                      "undefined" &&
                    this.props.currentClient[0].deliveryUser !== ""
                      ? this.props.currentClient[0].deliveryUser ==
                        "Delivered Today"
                      : false
                  }
                  value="Delivered Today"
                >
                  {i18n.__("inbound.Delivered Today")}
                </option>
              </select>
            </div>

            <div className="form-row">
              <select
                name="assignUser"
                ref={(c) => {
                  this.assignUserSelect = c;
                }}
                onChange={this.handleAssignUserChange}
              >
                <option value="" defaultValue>
                  Assign User
                </option>
                {this.renderUsers()}
              </select>
            </div>

            <div className="form-row">
              <input
                type="number"
                ref={(ref) => {
                  this.numberOfItemsInput = ref;
                }}
                placeholder={i18n.__("inbound.Number of items")}
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
                placeholder={i18n.__("inbound.Optional: Additional notes")}
                maxLength="300"
              />
            </div>

            <div className="form-row-label left inbound-inline col col-12">
              {i18n.__("inbound.This item has been through an x-ray")}
              <input
                type="checkbox"
                ref={(c) => {
                  this.xrayInput = c;
                }}
                className="chkbox offline-checkbox"
                defaultChecked={this.props.checked}
                name="selectParcel"
                value="0"
                checked={this.state.xraychecked}
                onClick={this.onSelected}
              />
            </div>
            <div className="form-row-label left col col-12">
              <div className="form-row-label left col col-12">
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

            <div className="form-row left col col-6 margin-bottom-65">
              <Button
                onClick={this.clearFields}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
                {i18n.__("inbound.Clear")}
              </Button>
            </div>
            <div className="form-row right col col-6 margin-bottom-65">
              <Button
                onClick={this.handleReceive}
                fullWidth={true}
                color="primary"
                variant="contained"
                disabled={!this.state.receive}
              >
                {i18n.__("inbound.Receive")}
              </Button>
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

  //set timezone,language and clientId
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
})(InboundMobile);
