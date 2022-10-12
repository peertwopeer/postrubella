import React, { Component } from "react";
import PropTypes from "prop-types";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment-timezone";
import ChipInput from "material-ui-chip-input";
import { Session } from "meteor/session";
import AsyncSelect from "react-select/async";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Parcel from "/imports/ui/Parcel.jsx";
import { Parcels } from "/imports/api/parcels.js";
import { decode } from "html-entities";
import { Random } from "meteor/random";
import { check } from "meteor/check";

import { Carriers, Locations, DeliveryTypes, Clients } from "/imports/api/";
import { Meteor } from "meteor/meteor";
import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import "/imports/languages/en/en.inbound.i18n.yml";
import "/imports/languages/de/de.inbound.i18n.yml";
import "/imports/languages/en-JM/en-JM.inbound.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

// Spaces
let spacesFolder = "barcodes";

if (Meteor.absoluteUrl().includes("localhost")) {
  spacesFolder = "tmp/barcodes";
} else if (
  Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
) {
  spacesFolder = "tmp/barcodes";
}
var limit = 10;
var findQueryCarriers = new ReactiveVar({});
var findQueryLocations = new ReactiveVar({});
var findQueryDeliveryTypes = new ReactiveVar({});
var findQueryUsers = new ReactiveVar({});
var carriersLimit = new ReactiveVar(10);
var locationsLimit = new ReactiveVar(10);
var deliveryTypesLimit = new ReactiveVar(10);
var usersLimit = new ReactiveVar(10);
var carrierDefaultOptions = new ReactiveVar([]);
var locationDefaultOptions = new ReactiveVar([]);
var deliveryTypeDefaultOptions = new ReactiveVar([]);
var assignUserDefaultOptions = new ReactiveVar([]);
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
const staticAssignActions = [
  { value: "", label: "Select Assign Action" },
  { value: "Collect from postrubella", label: "Collect from postrubella" },
  { value: "Reception", label: "Reception" },
  { value: "Security", label: "Security" },
  { value: "Delivery AM", label: "Delivery AM" },
  { value: "Delivery PM", label: "Delivery PM" },
  { value: "Delivered Today", label: "Delivered Today" },
];
const staticDeliveryTypes = [{ value: "Normal", label: "Normal" }];

class ReceivePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectLocationValue: "",
      selectDeliveryTypeValue: "",
      deliveryUserSelect: "",
      assignUserSelect: "",
      carriers: "",
      barcode: [],
      xraychecked: false,
      issetDeliveryType: 0,
      autofocus: true,
      receive: true,
      receiveAndEmail: true,
      user: {},
      locationId: "",
      errors: {
        noOfItems: "",
        Carriers: "",
        Recipient: "",
        Location: "",
        ChooseType: "",
      },
      barcodeInputStringCount: 0,
      barcodeInputValue: "",
      readBarcode: true,
      photo: "",
      photoName: "",
    };
    this.carrier = [];
  }

  //dropdown handles
  loadCarrierOptions = async (inputValue, callback) => {
    const carriers = await Carriers.find(findQueryCarriers.get()).fetch();
    let carrierOptions = carriers
      .sort((a, b) => (a.carrierName > b.carrierName ? 1 : -1))
      .map((carrier, key) => {
        return { value: carrier._id, label: carrier.carrierName };
      });
    callback(carrierOptions.filter((i) => i));
  };

  onPhotoChange = (event) => {
    var reader = new FileReader();
    var thisComponent = this;
    var fileSize = event.target.files[0].size;
    var fileType = event.target.files[0].type;
    var fileExtension = fileType.replace(/(.*)\//g, "");

    if (
      (fileType !== "image/png" && fileType !== "image/jpeg") ||
      fileSize > 1000000
    ) {
      alert(
        decode(
          i18n.__(
            "common.The uploaded file is not valid please follow the instruction"
          )
        )
      );
      thisComponent.setState({ photo: "" });
      thisComponent.setState({ photoName: "" });
      event.target.value = "";
      return;
    }

    if (reader.readAsDataURL) {
      reader.readAsDataURL(event.target.files[0]);
    } else if (reader.readAsDataurl) {
      readAsDataurl(event.target.files[0]);
    }

    reader.onload = function (event) {
      var image = new Image();
      image.src = event.target.result;
      image.onload = function () {
        // set image and image name to state
        thisComponent.setState({ photo: reader.result });
        thisComponent.setState({
          photoName: `${Random.id()}-${Meteor.userId()}-photo.${fileExtension}`,
        });
      };
    };
  };

  handleInputChange = (inputValue) => {
    findQueryCarriers.set({
      carrierName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  handleChange = (selectedOption) => {
    this.setState({ carriers: selectedOption ? selectedOption.label : "" });
    const { errors } = this.state;
    errors.Carriers = "";
    this.setState({ errors });
  };
  loadLocationOptions = async (inputValue, callback) => {
    const locations = await Locations.find(findQueryLocations.get()).fetch();
    let locationOptions = locations
      .sort((a, b) => (a.locationName > b.locationName ? 1 : -1))
      .map((location, key) => {
        return { value: location._id, label: location.locationName };
      });
    callback(locationOptions.filter((i) => i));
  };
  handleLocationChange = (inputValue) => {
    findQueryLocations.set({
      $and: [
        { clientId: this.props.currentClient[0]._id },
        { locationName: { $regex: inputValue + ".*", $options: "i" } },
      ],
    });
    return inputValue;
  };

  handleSelectLocationChange = (selectedOption) => {
    this.setState({
      selectLocationValue: selectedOption ? selectedOption.label : "",
    });
    this.setState({ locationId: selectedOption ? selectedOption.value : "" });
    const { errors } = this.state;
    errors.Location = "";
    this.setState({ errors });
  };

  loadDeliverytypeOptions = async (inputValue, callback) => {
    const deliveryTypes = await DeliveryTypes.find(
      findQueryDeliveryTypes.get()
    ).fetch();
    let deliveryTypesOptions = staticDeliveryTypes.concat(
      deliveryTypes
        .sort((a, b) => (a.deliveryTypeName > b.deliveryTypeName ? 1 : -1))
        .map((deliveryType, key) => {
          return {
            value: deliveryType._id,
            label: deliveryType.deliveryTypeName,
          };
        })
    );
    callback(deliveryTypesOptions.filter((i) => i));
  };
  handleDeliveryTypeChange = (inputValue) => {
    findQueryDeliveryTypes.set({
      deliveryTypeName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleSelectDeliveryType = (selectedOption) => {
    selectedOption = selectedOption
      ? selectedOption.label
      : this.props.currentClient[0].deliveryType
      ? this.props.currentClient[0].deliveryType
      : "";
    this.setState({ selectDeliveryTypeValue: selectedOption });
    const { errors } = this.state;
    errors.ChooseType = "";
    this.setState({ errors });
  };
  loadAssignUserOptions = (inputValue, callback) => {
    let assignUserOptions = this.props.allUsers
      .sort((a, b) => (a.username > b.username ? 1 : -1))
      .map((user, key) => {
        return { value: user._id, label: user.username };
      });
    callback(assignUserOptions.filter((i) => i));
  };
  handleAssignUserChange = (inputValue) => {
    findQueryUsers.set({
      username: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleSelectAssignAction = (selectedOption) => {
    let selectedAssignAction = "";
    if (selectedOption) {
      if (selectedOption.label === "Select Assign Action") {
        selectedAssignAction = "N/A";
      } else {
        selectedAssignAction = selectedOption.label;
      }
      this.setState({ deliveryUserSelect: selectedAssignAction });
    } else {
      this.setState({ deliveryUserSelect: "" });
    }
  };

  handleSelectAssignUser = (selectedOption) => {
    let selectedAssignUser = "";
    if (selectedOption) {
      if (selectedOption.label === "Select Assign User") {
        selectedAssignUser = "N/A";
      } else {
        selectedAssignUser = selectedOption.label;
      }
      this.setState({ assignUserSelect: selectedAssignUser });
    } else {
      this.setState({ assignUserSelect: "" });
    }
  };

  //load more functions for drpdowns
  scrollMoreCarriers = () => {
    carriersLimit.set(carriersLimit.get() + limit);
  };
  scrollMoreLocations = () => {
    locationsLimit.set(locationsLimit.get() + limit);
  };
  scrollMoreDeliveryTypes = () => {
    deliveryTypesLimit.set(deliveryTypesLimit.get() + limit);
  };
  scrollMoreUsers = () => {
    usersLimit.set(usersLimit.get() + limit);
  };

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

  renderParcels() {
    const { sessionLastParcel } = this.props;

    if (sessionLastParcel) {
      return (
        <div>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {i18n.__("inbound.Latest Received")}
          </Typography>
          <Parcel
            key={sessionLastParcel._id}
            parcel={sessionLastParcel}
            width="full"
            timezone={timeZone.get()}
          />
        </div>
      );
    }
  }

  componentDidMount() {
    Session.set("sessionParcelCount", 0);
    Session.set("sessionLastParcel", null);
    findQueryCarriers.set({});
    findQueryLocations.set({});
    findQueryDeliveryTypes.set({});
    findQueryUsers.set({});
  }

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

  getFormData() {
    let xray = 0;
    if (this.xrayInput.checked) xray = 1;
    return {
      barcode: this.state.barcode,
      photo: this.state.photo,
      photoName: this.state.photoName,
      assignUserSelect: this.state.assignUserSelect,
      carrier: this.state.carriers ? this.state.carriers : "",
      sender: this.inputSender.getValue(),
      location: this.state.selectLocationValue,
      locationId: this.state.locationId,
      recipientName: this.inputRecipient.getValue(),
      deliveryUser: this.state.deliveryUserSelect
        ? this.state.deliveryUserSelect
        : this.props.currentClient[0].deliveryUser
        ? this.props.currentClient[0].deliveryUser
        : "",
      deliveryType: this.state.selectDeliveryTypeValue
        ? this.state.selectDeliveryTypeValue
        : this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      numberOfItems: this.numberOfItemsInput.value.trim(),
      notes: this.notesInput.value.trim(),
      clientId: Meteor.user().profile.clientId,
      type: "inbound",
      xrayInput: xray,
    };
  }

  clearForm() {
    this.inputSender.clear();
    this.inputRecipient.clear();
    this.setState({
      selectDeliveryTypeValue: this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      deliveryUserSelect: this.props.currentClient[0].deliveryUser
        ? this.props.currentClient[0].deliveryUser
        : "",
    });
    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    // this.xrayInput.value = flase;
    this.uncheckIt();
    this.setState({
      selectLocationValue: "",
    });
  }

  /**
   *
   *
   * @param {*} data
   * @returns
   * @memberof ReceivePage
   */
  // async function for  insert parcel
  insertParcel = async (sessionLastParcel) => {
    try {
      await Parcels.insert(sessionLastParcel);
      console.log("parcel inserted");
      return true;
    } catch (err) {
      console.log("Error ", err);
      // Meteor.call('sendToSlack', `App Inbound error: ${err.message}. \n${getAppInfo()}`);
    }
  };

  receiveParcel = async (data, flag = 0) => {
    const {
      barcode,
      carrier,
      sender,
      location,
      locationId,
      recipientName,
      deliveryUser,
      deliveryType,
      numberOfItems,
      notes,
      clientId,
      type,
      xrayInput,
      photo,
      photoName,
      assignUserSelect,
    } = data;

    if (carrier.length < 2) return;
    if (location.length < 2) return;
    if (deliveryUser === "unassigned") return;

    const client = this.props.currentClient;
    const { clientBarcodeId } = client[0];
    let { clientBarcodeNumber } = client[0];

    // @TODO: implement server-side insert?
    // Meteor.call('parcels.insert', notes, barcode, carrier, recipientName, sender, location, deliveryUser, deliveryType, clientId, qrcode, numberOfItems);
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
      let itemsProcessed = 0;
      barcode.forEach((item, index, array) => {
        itemsProcessed++;
        clientBarcodeNumber += 1;
        const clientUniqueBarcode = `${clientBarcodeId}-${clientBarcodeNumber}`;
        // @TODO: make this more dynamic
        const todayPath = moment().format("YYYY/MM/DD");
        const qrcode = `https://postrubella.ams3.digitaloceanspaces.com/${spacesFolder}/${todayPath}/${clientUniqueBarcode}.png`;
        Meteor.call("s3.barcode", clientUniqueBarcode, todayPath);

        //inserting
        const newParcel = {
          ...identifyData,
          notes,
          barcode: item,
          carrier,
          recipientName,
          sender,
          location,
          locationId,
          deliveryType,
          deliveryUser,
          qrcode,
          clientUniqueBarcode,
          type,
          numberOfItems,
          xrayInput,
          isEmail: 0,
          photoName,
          assignUser: assignUserSelect,
        };

        //insert parcel

        this.insertParcel(newParcel).then((result) => {
          if (result) {
            Meteor.call(
              "parcels.updateClientUniqueBarcode",
              clientId,
              clientBarcodeNumber,
              () => {
                if (itemsProcessed === array.length) {
                  this.setState({ receive: true, receiveAndEmail: true });
                }
              }
            );
            Meteor.call(
              "recipients.checklocation",
              recipientName,
              identifyData,
              0
            );
            Meteor.call("carriers.checkcarrier", carrier, identifyData);
            Meteor.call("senders.checksender", sender, identifyData);
            // to ensure fields not filled are updated
            Session.set("sessionLastParcel", null);
            Session.set("sessionLastParcel", newParcel);
          } else {
            console.log("Error: Parcel not inserted");
            return false;
          }
        });
        if (itemsProcessed === array.length) {
          callback();
        }
      });
    } else {
      //insert single parcel
      clientBarcodeNumber += 1;
      const clientUniqueBarcode = `${clientBarcodeId}-${clientBarcodeNumber}`;
      // @TODO: make this more dynamic
      const todayPath = moment().format("YYYY/MM/DD");
      const qrcode = `https://postrubella.ams3.digitaloceanspaces.com/${spacesFolder}/${todayPath}/${clientUniqueBarcode}.png`;
      Meteor.call("s3.barcode", clientUniqueBarcode, todayPath);

      //inserting
      const newParcel = {
        ...identifyData,
        notes,
        barcode: "",
        carrier,
        recipientName,
        sender,
        location,
        locationId,
        deliveryType,
        deliveryUser,
        qrcode,
        clientUniqueBarcode,
        type,
        numberOfItems,
        xrayInput,
        isEmail: 0,
        photoName,
        assignUser: assignUserSelect,
      };

      //insert parcel
      this.insertParcel(newParcel).then((result) => {
        if (result) {
          Meteor.call(
            "parcels.updateClientUniqueBarcode",
            clientId,
            clientBarcodeNumber,
            () => {
              this.setState({ receive: true, receiveAndEmail: true });
            }
          );
          Meteor.call(
            "recipients.checklocation",
            recipientName,
            identifyData,
            0
          );
          Meteor.call("carriers.checkcarrier", carrier, identifyData);
          Meteor.call("senders.checksender", sender, identifyData);
          // to ensure fields not filled are updated
          Session.set("sessionLastParcel", null);
          Session.set("sessionLastParcel", newParcel);
        } else {
          console.log("Error: Parcel not inserted");
          return false;
        }
      });
      return true;
    }
  };

  get_parcel_details = async (barcode) => {
    var parcel = await Parcels.findOne({ barcode: barcode });
    return parcel;
  };

  handleReceive = (event) => {
    event.preventDefault();

    const { errors } = this.state;
    const deliveryTypeSelectedOption = this.state.selectDeliveryTypeValue
      ? this.state.selectDeliveryTypeValue
      : this.props.currentClient[0].deliveryType
      ? this.props.currentClient[0].deliveryType
      : "";
    if (this.state.carriers === "") {
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
    if (deliveryTypeSelectedOption === "") {
      errors.ChooseType = i18n.__("inbound.Please choose a Delivery type");
      this.setState({ errors });
    }
    if (this.state.errors.noOfItems.length > 0) return;
    if (this.state.errors.ChooseType.length > 0) return;
    if (this.state.errors.Carriers.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.Location.length > 0) return;
    //disable receive button
    this.setState({ receive: false });

    let formData = this.getFormData();
    const received = this.receiveParcel(formData, 0);
    if (!received) return;

    const sessionCount =
      parseInt(this.props.sessionParcelCount) +
      parseInt(this.numberOfItemsInput.value.trim());
    Session.set("sessionParcelCount", sessionCount);
    Session.set("receiveFlag", 1);

    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.xrayInput.value = "";
    this.setState({
      selectDeliveryTypeValue: this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      deliveryUserSelect: this.props.currentClient[0].deliveryUser
        ? this.props.currentClient[0].deliveryUser
        : "",
    });
    this.uncheckIt();
    this.setState(
      {
        barcode: [],
      },
      this.clearBarcodeField()
    );
    this.setState({ photo: "", photoName: "" });
    this.photo.value = "";
  };

  clearBarcodeField = () => {
    let arrLength = this.state.barcode.length;
    this.state.barcode.splice(0, arrLength);
    this.setState({ receive: true, receiveAndEmail: true });
  };

  renderSessionParcelCount() {
    const { sessionParcelCount } = this.props;

    if (!sessionParcelCount) return;

    return (
      <div>
        {i18n.__("inbound.Current parcel count")} <b>{sessionParcelCount}</b>
      </div>
    );
  }

  // handleReceiveAndReceipt

  handleReceiveAndReceipt = (event) => {
    event.preventDefault();

    const { errors } = this.state;
    const deliveryTypeSelectedOption = this.state.selectDeliveryTypeValue
      ? this.state.selectDeliveryTypeValue
      : this.props.currentClient[0].deliveryType
      ? this.props.currentClient[0].deliveryType
      : "";

    if (this.state.carriers === "") {
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
    if (deliveryTypeSelectedOption === "") {
      errors.ChooseType = i18n.__("inbound.Please choose a Delivery type");
      this.setState({ errors });
    }

    if (this.state.errors.noOfItems.length > 0) return;
    if (this.state.errors.ChooseType.length > 0) return;
    if (this.state.errors.Carriers.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.Location.length > 0) return;

    const formData = this.getFormData();
    //disable receive button
    this.setState({ receiveAndEmail: false });

    const clientName = this.props.currentClient[0].clientName;
    const clientEmail = this.props.currentClient[0].clientEmail;
    const clientLogo = this.props.currentClient[0].logo;
    const enableCustomEmail =
      typeof this.props.currentClient[0].customEmail !== null &&
      typeof this.props.currentClient[0].customEmail !== "undefined"
        ? this.props.currentClient[0].customEmail
        : 0;
    const received = this.receiveParcel(formData, 1);
    if (!received) return;
    this.clearForm();
    Meteor.call("inboundCount", {
      locationName: formData.location,
      locationId: formData.locationId,
      clientId: formData.clientId,
      clientName,
      clientEmail,
      clientLogo,
      enableCustomEmail,
      deliveryUser: formData.deliveryUser,
      utcOffset: moment().tz(timeZone.get()).utcOffset(),
    });

    Session.set("sessionParcelCount", 0);
    Session.set("receiveFlag", 0);

    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.xrayInput.value = "";
    this.uncheckIt();
    this.setState(
      {
        carriers: "",
        barcode: [],
      },
      this.clearBarcodeField()
    );
    this.setState({ photo: "", photoName: "" });
    this.photo.value = "";
  };

  checkCanClick = (e) => {
    const { sessionParcelCount } = this.props;

    if (sessionParcelCount) {
      e.preventDefault();
      e.stopPropagation();
      alert(decode(i18n.__("inbound.You must finish this post by R&E")));
    }
  };

  handleChangeChips(chips) {
    if (this.state.barcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ barcode: chips });
    this.setState({ barcodeInputValue: "" });
  }

  checkBarcodeSource(event) {
    this.setState({ barcodeInputValue: event.target.value });
    this.setState({ barcodeInputStringCount: event.target.value.length });
    if (event.target.value.length == 0) this.setState({ readBarcode: true });
    if (this.state.readBarcode) {
      this.setState({ readBarcode: false });
      setTimeout(
        function () {
          // source scanner device
          if (this.state.barcodeInputStringCount > 5) {
            let value = event.target.value.trim();
            let chips = this.state.barcode;
            if (chips.includes(value)) {
              alert("This barcode has already been scanned");
            }
            if (!chips.includes(value) && value !== "") chips.push(value);
            this.setState({ barcode: chips });
            this.setState({ barcodeInputValue: "" });
            this.setState({ barcodeInputStringCount: 0 });
            this.setState({ readBarcode: true });
          }
          //source keyboard
          else {
            this.setState({ barcodeInputStringCount: 0 });
          }
        }.bind(this),
        800
      );
    }
  }

  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips });
    if (chips.length == 0) this.setState({ readBarcode: true });
  }

  render() {
    return this.props.currentClientSub ? (
      <div className="width-narrow clearfix">
        <form>
          <div className="form-row">
            <ChipInput
              label={i18n.__("inbound.Optional: Scan / Enter Barcode")}
              onChange={(chips) => this.handleChangeChips(chips)}
              value={this.state.barcode}
              onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
              fullWidth={true}
              id="barcode_id"
              onUpdateInput={(event) => this.checkBarcodeSource(event)}
              inputValue={this.state.barcodeInputValue}
              allowDuplicates={true}
            />
          </div>

          <div className="form-row">
            <div className="form-row">
              <AsyncSelect
                cacheOptions={false}
                placeholder={i18n.__("inbound.Select carrier")}
                theme={org_placeholderTheme}
                value={
                  this.state.carriers !== ""
                    ? { label: this.state.carriers, value: this.state.carriers }
                    : { label: i18n.__("inbound.Select carrier"), value: "" }
                }
                isClearable={true}
                isLoading={!this.props.carrierSubscription}
                loadOptions={this.loadCarrierOptions}
                defaultOptions={carrierDefaultOptions.get()}
                onInputChange={this.handleInputChange}
                onChange={this.handleChange}
                onMenuScrollToBottom={this.scrollMoreCarriers}
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

          <div className="form-row" onClick={this.checkCanClick}>
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("inbound.Select Location/Company")}
              theme={org_placeholderTheme}
              value={
                this.state.selectLocationValue !== ""
                  ? {
                      label: this.state.selectLocationValue,
                      value: this.state.locationId,
                    }
                  : {
                      label: i18n.__("inbound.Select Location/Company"),
                      value: "",
                    }
              }
              isClearable={true}
              isLoading={!this.props.locationSubscription}
              loadOptions={this.loadLocationOptions}
              defaultOptions={locationDefaultOptions.get()}
              onInputChange={this.handleLocationChange}
              onChange={this.handleSelectLocationChange}
              onMenuScrollToBottom={this.scrollMoreLocations}
              isDisabled={!!this.props.sessionParcelCount}
            />
            <p className="red" hidden={this.state.errors.Location.length == ""}>
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
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("inbound.Select Delivery Type")}
              theme={org_placeholderTheme}
              value={
                this.state.selectDeliveryTypeValue !== ""
                  ? {
                      label: this.state.selectDeliveryTypeValue,
                      value: this.state.selectDeliveryTypeValue,
                    }
                  : {
                      label: decode(i18n.__("inbound.Select Delivery Type")),
                      value: "",
                    }
              }
              isLoading={!this.props.deliveryTypeSubscription}
              loadOptions={this.loadDeliverytypeOptions}
              defaultOptions={deliveryTypeDefaultOptions.get()}
              defaultInputValue={
                this.props.currentClient[0].deliveryType
                  ? this.props.currentClient[0].deliveryType
                  : ""
              }
              defaultValue={
                this.props.currentClient[0].deliveryType
                  ? {
                      label: this.props.currentClient[0].deliveryType,
                      value: this.props.currentClient[0].deliveryType,
                    }
                  : {
                      label: decode(i18n.__("inbound.Select Delivery Type")),
                      value: "",
                    }
              }
              onInputChange={this.handleDeliveryTypeChange}
              onChange={this.handleSelectDeliveryType}
              onMenuScrollToBottom={this.scrollMoreDeliveryTypes}
            />
            <p
              className="red"
              hidden={this.state.errors.ChooseType.length == ""}
            >
              {this.state.errors.ChooseType}
            </p>
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("inbound.Assign Action")}
              theme={org_placeholderTheme}
              value={
                this.state.deliveryUserSelect !== ""
                  ? {
                      label: this.state.deliveryUserSelect,
                      value: this.state.deliveryUserSelect,
                    }
                  : {
                      label: decode(i18n.__("inbound.Assign Action")),
                      value: "",
                    }
              }
              defaultInputValue={
                this.props.currentClient[0].deliveryUser
                  ? this.props.currentClient[0].deliveryUser
                  : ""
              }
              defaultValue={
                this.props.currentClient[0].deliveryUser
                  ? {
                      label: this.props.currentClient[0].deliveryUser,
                      value: this.props.currentClient[0].deliveryUser,
                    }
                  : {
                      label: decode(i18n.__("inbound.Assign Action")),
                      value: "",
                    }
              }
              onChange={this.handleSelectAssignAction}
              defaultOptions={staticAssignActions}
            />
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("inbound.Assign User")}
              theme={org_placeholderTheme}
              value={
                this.state.assignUserSelect !== ""
                  ? {
                      label: this.state.assignUserSelect,
                      value: this.state.assignUserSelect,
                    }
                  : { label: decode(i18n.__("inbound.Assign User")), value: "" }
              }
              isLoading={!this.props.userSubscription}
              loadOptions={this.loadAssignUserOptions}
              defaultOptions={assignUserDefaultOptions.get()}
              onInputChange={this.handleAssignUserChange}
              onChange={this.handleSelectAssignUser}
              onMenuScrollToBottom={this.scrollMoreUsers}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              ref={(c) => {
                this.numberOfItemsInput = c;
              }}
              placeholder={i18n.__("inbound.Number of items")}
              defaultValue="1"
              min="1"
              max="30"
              onChange={this.validateInput}
            />
            <p className="red" hidden={this.state.errors.noOfItems.length == 0}>
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

          <div className="row clearfix">
            <div className="col  col-10 sm-col-8 md-col-10">
              {i18n.__("inbound.This item has been through an x-ray")}
            </div>
            <div className="col  col-2 sm-col-4 md-col-2">
              <input
                type="checkbox"
                ref={(c) => {
                  this.xrayInput = c;
                }}
                className="chkbox"
                defaultChecked={this.props.checked}
                name="selectParcel"
                value="0"
                checked={this.state.xraychecked}
                onChange={this.onSelected}
              />
            </div>
          </div>

          <div className="row clearfix">
            <div className="form-row-label  col col-12 sm-col-6 md-col-6">
              {i18n.__("common.Add Photo")}
            </div>
            <div className="form-row  col col-12 sm-col-6 md-col-6">
              <input
                type="file"
                ref={(c) => {
                  this.photo = c;
                }}
                onChange={this.onPhotoChange}
              />
            </div>
          </div>

          <div className="row">
            <p className={"client-form-logo-description"}>
              {decode(
                i18n.__("common.Instructions for uploading parcel photo")
              )}
            </p>
          </div>
          <div className="margin-bottom-65">
            <div className="form-row left col col-6">
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
            <div className="form-row right col col-6 ">
              <Button
                onClick={this.handleReceiveAndReceipt}
                fullWidth={true}
                color="primary"
                variant="contained"
                disabled={!this.state.receiveAndEmail}
              >
                {decode(i18n.__("inbound.Receive & Email"))}
              </Button>
            </div>
          </div>
        </form>

        {this.renderSessionParcelCount()}
        <br></br>
        <ul>{this.renderParcels()}</ul>
      </div>
    ) : (
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
ReceivePage.propTypes = {
  currentClient: PropTypes.array.isRequired,
};

export default withTracker(() => {
  const carrierSubscription = Meteor.subscribe(
    "carriers.list.dropdowns",
    carriersLimit.get(),
    findQueryCarriers.get()
  ).ready();
  const locationSubscription = Meteor.subscribe(
    "locations.list.dropdowns",
    locationsLimit.get(),
    findQueryLocations.get()
  ).ready();
  const deliveryTypeSubscription = Meteor.subscribe(
    "deliveryTypes.list.dropdowns",
    deliveryTypesLimit.get(),
    findQueryDeliveryTypes.get()
  ).ready();
  const userSubscription = Meteor.subscribe(
    "users.list.dropdowns",
    usersLimit.get(),
    findQueryUsers.get()
  ).ready();

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

  //set default options for dropdowns
  carrierDefaultOptions.set(
    Carriers.find({})
      .fetch()
      .sort((a, b) => (a.carrierName > b.carrierName ? 1 : -1))
      .map((carrier, key) => {
        return { value: carrier._id, label: carrier.carrierName };
      })
  );
  locationDefaultOptions.set(
    Locations.find({ clientId: user?.profile.clientId })
      .fetch()
      .sort((a, b) => (a.locationName > b.locationName ? 1 : -1))
      .map((location, key) => {
        return { value: location._id, label: location.locationName };
      })
  );

  deliveryTypeDefaultOptions.set(
    staticDeliveryTypes.concat(
      DeliveryTypes.find({})
        .fetch()
        .sort((a, b) => (a.deliveryTypeName > b.deliveryTypeName ? 1 : -1))
        .map((deliveryType, key) => {
          return {
            value: deliveryType._id,
            label: deliveryType.deliveryTypeName,
          };
        })
    )
  );

  assignUserDefaultOptions.set(
    Meteor.users
      .find({})
      .fetch()
      .sort((a, b) => (a.username > b.username ? 1 : -1))
      .map((user, key) => {
        return { value: user._id, label: user.username };
      })
  );

  return {
    sessionLastParcel: Session.get("sessionLastParcel"),
    sessionParcelCount: Session.get("sessionParcelCount"),
    currentClient: Clients.find({ _id: query.clientId }).fetch(),
    carriers: Carriers.find(query).fetch(),
    locations: Locations.find(query).fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    currentClientSub: currentClientSub,
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(ReceivePage);

// inbound postrubella3/trunk file
