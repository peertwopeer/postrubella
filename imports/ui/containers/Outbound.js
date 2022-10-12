import React, { Component } from "react";
import PropTypes from "prop-types";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment-timezone";
import ChipInput from "material-ui-chip-input";
import { Session } from "meteor/session";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { Parcels } from "/imports/api/parcels.js";
import Parcel from "/imports/ui/Parcel.jsx";
import Carriers from "/imports/api/carriers.js";
import { Locations } from "/imports/api/locations.js";
import { DeliveryTypes } from "/imports/api/deliveryTypes.js";
import { Clients } from "/imports/api/clients.js";
import { Senders } from "/imports/api/senders";
import AsyncSelect from "react-select/async";
import { createFilter } from "react-select";
import { decode } from "html-entities";
import { Random } from "meteor/random";

import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import "/imports/languages/en/en.outbound.i18n.yml";
import "/imports/languages/de/de.outbound.i18n.yml";
import "/imports/languages/en-JM/en-JM.outbound.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;

// Spaces
let spacesFolder = "barcodes";

if (Meteor.absoluteUrl().includes("localhost")) {
  spacesFolder = "tmp/barcodes";
}
if (Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")) {
  spacesFolder = "tmp/barcodes";
}

function isSomeInputEmpty(items) {
  return items.some((item) => item.length <= 1);
}

var limit = 10;
var findQueryCarriers = new ReactiveVar({});
var findQueryLocations = new ReactiveVar({});
var findQueryDeliveryTypes = new ReactiveVar({});
var findQueryUsers = new ReactiveVar({});
var findQuerySenders = new ReactiveVar({});
var carriersLimit = new ReactiveVar(10);
var locationsLimit = new ReactiveVar(10);
var sendersLimit = new ReactiveVar(10);
var deliveryTypesLimit = new ReactiveVar(10);
var usersLimit = new ReactiveVar(10);
var carrierDefaultOptions = new ReactiveVar([]);
var locationDefaultOptions = new ReactiveVar([]);
var senderDefaultOptions = new ReactiveVar([]);
var deliveryTypeDefaultOptions = new ReactiveVar([]);
var receivingActionDefaultOptions = new ReactiveVar([]);
var destinationOptions = new ReactiveVar([]);
var isDestinationsReady = new ReactiveVar(false);
var selectedDestinationId = new ReactiveVar("");

var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
const staticDeliveryTypes = [{ value: "Normal", label: "Normal" }];
class OutboundPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDestination: "",
      selectedSenderValue: "",
      selectLocationValue: "",
      barcode: [],
      carriers: "",
      outboundAddress: "",
      selectDeliveryTypeValue: "",
      selectDeliveryUserValue: "",
      clientUniqueBarcode: "",
      receive: true,
      outboundAndEmail: true,
      locationId: "",
      locationClientId: "",
      destinationId: "",
      lastProcessed: "",
      senderId: "",
      errors: {
        noOfItems: "",
        Carriers: "",
        Recipient: "",
        Location: "",
        destinationType: "",
        senderType: "",
        ChooseType: "",
        ReceivingAction: "",
        Outbound_addr: "",
        Barcode: "",
        photoUrl: "",
      },
      barcodeInputStringCount: 0,
      barcodeInputValue: "",
      readBarcode: true,
      photo: "",
      photoName: "",
      parcelId: "",
      isUpdateMode: false,
      showInboundAlert: false,
      isLoading: false,
    };
    this.carriers = [];
    this.dafaultDeliveryType = i18n.__("outbound.Choose type");
  }

  setOutbound = (event) => {
    this.setState({ outboundAddress: event.target.value });
    const { errors } = this.state;
    errors.Outbound_addr = "";
    this.setState({ errors });
  };

  componentDidMount() {
    Session.set("sessionParcelCount", 0);
    Session.set("sessionLastParcel", 0);
    findQueryCarriers.set({});
    findQueryLocations.set({});
    findQuerySenders.set({});
    findQueryDeliveryTypes.set({});
    findQueryUsers.set({});
  }

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

  loadCarrierOptions = async (inputValue, callback) => {
    const carriers = await Carriers.find(findQueryCarriers.get()).fetch();
    let carrierOptions = carriers
      .sort((a, b) => (a.carrierName > b.carrierName ? 1 : -1))
      .map((carrier, key) => {
        return { value: carrier._id, label: carrier.carrierName };
      });
    callback(carrierOptions.filter((i) => i));
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
        return {
          value: location._id,
          label: location.locationName,
          clientId: location.clientId ? location.clientId : "",
        };
      });
    callback(locationOptions.filter((i) => i));
  };
  handleLocationChange = (inputValue) => {
    let selectedDestination = selectedDestinationId.get();

    findQueryLocations.set({
      locationName: { $regex: inputValue + ".*", $options: "i" },
      ...(selectedDestination && { clientId: selectedDestination }),
    });
    return inputValue;
  };

  handleSelectLocationChange = (selectedOption) => {
    this.setState({
      selectLocationValue: selectedOption ? selectedOption.label : "",
    });
    this.setState({ locationId: selectedOption ? selectedOption.value : "" });
    this.setState({
      locationClientId: selectedOption ? selectedOption.clientId : "",
    });
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
    this.setState({
      selectDeliveryTypeValue: selectedOption ? selectedOption.label : "",
    });
    const { errors } = this.state;
    errors.ChooseType = "";
    this.setState({ errors });
  };
  loadReceivingActionOptions = (inputValue, callback) => {
    let assignActionOptions = this.props.allUsers
      .sort((a, b) => (a.username > b.username ? 1 : -1))
      .map((user, key) => {
        return { value: user._id, label: user.username };
      });
    callback(assignActionOptions.filter((i) => i));
  };
  handleReceivingActionChange = (inputValue) => {
    findQueryUsers.set({
      username: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleSelectReceivingAction = (selectedOption) => {
    this.setState({
      selectDeliveryUserValue: selectedOption ? selectedOption.label : "",
    });
    const { errors } = this.state;
    errors.ReceivingAction = "";
    this.setState({ errors });
  };
  destinationDefaultOptions(groupId) {
    Meteor.call(
      "clientsGroups.clientsLists",
      { clientGroupId: groupId },
      function (error, result) {
        if (error) {
          console.error(error);
        } else {
          let cList = [];
          result.map((value) => {
            cList.push({ value: value._id, label: value.clientName });
          });
          destinationOptions.set(cList);
          isDestinationsReady.set(true);
        }
      }
    );
  }
  destinationLoadOptions = (inputValue, callback) => {
    let destinationList = destinationOptions
      .get()
      .filter((destination) =>
        destination.label.toLowerCase().includes(inputValue.toLowerCase())
      )
      .map((client, key) => {
        return { value: client.value, label: client.label };
      });
    callback(destinationList.filter((i) => i));
  };
  handleSelectDestination = (selectedOption) => {
    if (!selectedOption) return "";
    let selectedDestination = selectedOption.value;

    findQueryLocations.set({ clientId: selectedDestination });
    selectedDestinationId.set(selectedDestination);

    this.setState({
      locationId: "",
      locationClientId: "",
      selectLocationValue: "",
      destinationId: selectedOption.value,
      selectedDestination: selectedOption.label,
    });
    const { errors } = this.state;
    errors.destinationType = "";
    this.setState({ errors });
  };
  loadSenderOptions = async (inputValue, callback) => {
    const senders = await Senders.find(findQuerySenders.get()).fetch();
    let senderOptions = senders
      .sort((a, b) => (a.senderName > b.senderName ? 1 : -1))
      .map((sender, key) => {
        return { value: sender._id, label: sender.senderName };
      });
    callback(senderOptions.filter((i) => i));
  };
  handleSenderChange = (inputValue) => {
    findQuerySenders.set({
      senderName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  handleSelectSenderChange = (selectedOption) => {
    this.setState({
      selectedSenderValue: selectedOption ? selectedOption.label : "",
    });
    this.setState({ senderId: selectedOption ? selectedOption.value : "" });
    const { errors } = this.state;
    errors.senderType = "";
    this.setState({ errors });
  };

  //load more functions for dropdowns
  scrollMoreCarriers = () => {
    carriersLimit.set(carriersLimit.get() + limit);
  };
  scrollMoreLocations = () => {
    locationsLimit.set(locationsLimit.get() + limit);
  };
  scrollMoreSenders = () => {
    sendersLimit.set(sendersLimit.get() + limit);
  };
  scrollMoreDeliveryTypes = () => {
    deliveryTypesLimit.set(deliveryTypesLimit.get() + limit);
  };
  scrollMoreUsers = () => {
    usersLimit.set(usersLimit.get() + limit);
  };

  renderParcels() {
    const { sessionLastParcel } = this.props;

    if (!sessionLastParcel) return;

    return (
      <div>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {i18n.__("outbound.Latest Received")}
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

  getFormData() {
    let isGroupClient = this.props.currentClient[0].clientGroupId != undefined;

    return {
      barcode: this.state.barcode,
      carrier: this.state.carriers ? this.state.carriers : "",
      location: this.state.selectLocationValue,
      locationId: this.state.locationId,
      deliveryUser: this.state.selectDeliveryUserValue
        ? this.state.selectDeliveryUserValue
        : this.props.currentClient[0].receiveUser
        ? this.props.currentClient[0].receiveUser
        : "",
      deliveryType: this.state.selectDeliveryTypeValue
        ? this.state.selectDeliveryTypeValue
        : this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      outboundAddress: this.outboundAddressInput.value.trim(),
      recipientName: this.inputRecipient.getValue(),
      numberOfItems: this.numberOfItemsInput.value.trim(),
      notes: this.notesInput.value.trim(),
      clientId: Meteor.user().profile.clientId,
      type:
        this.state.isUpdateMode &&
        this.props.currentClient[0]._id == this.state.locationClientId
          ? "inbound"
          : "outbound",
      ...(isGroupClient && { locationClientId: this.state.locationClientId }),
      ...(isGroupClient && { destination: this.state.selectedDestination }),
      ...(isGroupClient && { destinationId: this.state.destinationId }),
      ...(isGroupClient && {
        lastProcessed: this.props.currentClient[0].clientName,
      }),
      ...(isGroupClient && { sender: this.state.selectedSenderValue }),
      ...(isGroupClient && { senderId: this.state.senderId }),
      ...(this.state.photoUrl == "" && { photo: this.state.photo }),
      ...(this.state.photoUrl == "" && { photoName: this.state.photoName }),
    };
  }

  clearForm() {
    this.outboundAddressInput.value = "";
    // @TODO: use best solution when react will become smarter
    this.inputRecipient.clear();
    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.setState({
      barcode: this.props.currentClient[0].clientGroupId != undefined ? [] : "",
      carriers: "",
      photoUrl: "",
      selectLocationValue: "",
      selectedDestination: "",
      selectedSenderValue: "",
      selectDeliveryTypeValue: this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      selectDeliveryUserValue: this.props.currentClient[0].receiveUser
        ? this.props.currentClient[0].receiveUser
        : "",
      isUpdateMode: false,
      showInboundAlert: false,
    });
  }
  insertOrUpdateParcel = async (sessionLastParcel) => {
    if (this.state.isUpdateMode) {
      delete sessionLastParcel.createdAt;
      try {
        Parcels.update(this.state.parcelId, {
          $set: sessionLastParcel,
        });
        return true;
      } catch (err) {
        console.log("Error ", err);
      }
    } else {
      try {
        const parcelId = await Parcels.insert(sessionLastParcel);
        this.setState({ parcelId });
        return true;
      } catch (err) {
        console.log("Error ", err);
      }
    }
  };

  receiveParcel(data, recieveAndEmailFlag) {
    const {
      barcode,
      carrier,
      location,
      locationId,
      deliveryUser,
      deliveryType,
      outboundAddress,
      recipientName,
      numberOfItems,
      notes,
      clientId,
      type,
      photo,
      photoName,
    } = data;
    if (isSomeInputEmpty([carrier, location, recipientName])) return;

    const client = this.props.currentClient;
    const { clientBarcodeId } = client[0];

    let { clientBarcodeNumber } = client[0];

    let isGroupClient = client[0].clientGroupId != undefined;

    const date = new Date();
    const identifyData = {
      updatedAt: date,
      ...(!this.state.isUpdateMode && { createdAt: date }),
      ...(!this.state.isUpdateMode && { owner: Meteor.userId() }),
      ...(!this.state.isUpdateMode && { username: Meteor.user().username }),
      ...(!this.state.isUpdateMode && { clientId: clientId }),
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

        const currentParcel = {
          ...identifyData,
          carrier,
          location,
          locationId,
          deliveryType,
          deliveryUser,
          type,
          outboundAddress,
          recipientName,
          numberOfItems,
          notes,
          barcode: item,
          clientUniqueBarcode: this.state.isUpdateMode
            ? this.state.clientUniqueBarcode
            : clientUniqueBarcode,
          ...(!this.state.isUpdateMode && { qrcode }),
          ...(this.state.photoUrl == "" && { photoName: data.photoName }),
          ...(isGroupClient && { destination: data.destination }),
          ...(isGroupClient && { destinationId: data.destinationId }),
          ...(isGroupClient && { lastProcessed: data.lastProcessed }),
          ...(isGroupClient && { locationClientId: data.locationClientId }),
          ...(isGroupClient && { sender: data.sender }),
          ...(isGroupClient && { senderId: data.senderId }),
        };
        //insert parcel
        this.insertOrUpdateParcel(currentParcel).then((result) => {
          if (result) {
            Meteor.call(
              "parcels.updateClientUniqueBarcode",
              clientId,
              clientBarcodeNumber,
              () => {
                if (itemsProcessed === array.length) {
                  this.setState({ receive: true, outboundAndEmail: true });
                }
              }
            );
            // @TODO don't try to insert if it duplication. Currently solved by unique index in mongo collection.
            Meteor.call("carriers.checkcarrier", carrier, identifyData);
            Meteor.call(
              "recipients.checklocation",
              recipientName,
              identifyData,
              1
            );

            if (recieveAndEmailFlag == false) {
              const { sessionParcelCount } = this.props;
              Session.set(
                "sessionParcelCount",
                parseInt(sessionParcelCount) +
                  parseInt(this.numberOfItemsInput.value.trim())
              );
            }
            const sessionLastParcel = currentParcel;
            // to ensure fields not filled are updated
            Session.set("sessionLastParcel", null);
            Session.set("sessionLastParcel", sessionLastParcel);

            // insert into parcel status.
            if (isGroupClient) {
              if (this.state.isUpdateMode) {
                Meteor.call(
                  "parcelLogs.update",
                  {
                    status: "sorting",
                    parcelId: this.state.parcelId,
                    clientId: this.props.currentClient[0]._id,
                    clientName: this.props.currentClient[0].clientName,
                    destination: currentParcel.destination,
                    destinationId: currentParcel.destinationId,
                    updatedAt: currentParcel.updatedAt,
                  },
                  function (error, result) {
                    if (error) console.log(error);
                  }
                );
              } else {
                Meteor.call(
                  "parcelLogs.add",
                  {
                    parcelId: this.state.parcelId,
                    barcode: currentParcel.barcode,
                    clientId: this.props.currentClient[0]._id,
                    clientName: this.props.currentClient[0].clientName,
                    clientUniqueBarcode: currentParcel.clientUniqueBarcode,
                    destination: currentParcel.destination,
                    destinationId: currentParcel.destinationId,
                    createdAt: currentParcel.createdAt,
                    updatedAt: currentParcel.updatedAt,
                  },
                  function (error, result) {
                    if (error) console.log(error);
                  }
                );
              }
              this.clearForm();
            }
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

      const currentParcel = {
        ...identifyData,
        barcode: "",
        carrier,
        location,
        locationId,
        deliveryType,
        deliveryUser,
        qrcode,
        clientUniqueBarcode,
        type,
        outboundAddress,
        recipientName,
        numberOfItems,
        notes,
        photoName,
      };
      //insert parcel
      this.insertOrUpdateParcel(currentParcel).then((result) => {
        if (result) {
          Meteor.call(
            "parcels.updateClientUniqueBarcode",
            clientId,
            clientBarcodeNumber,
            () => {
              this.setState({ receive: true, outboundAndEmail: true });
            }
          );
          // @TODO don't try to insert if it duplication. Currently solved by unique index in mongo collection.
          Meteor.call("carriers.checkcarrier", carrier, identifyData);
          Meteor.call(
            "recipients.checklocation",
            recipientName,
            identifyData,
            1
          );
          if (recieveAndEmailFlag == false) {
            const { sessionParcelCount } = this.props;
            Session.set(
              "sessionParcelCount",
              parseInt(sessionParcelCount) +
                parseInt(this.numberOfItemsInput.value.trim())
            );
          }
          const sessionLastParcel = currentParcel;
          // to ensure fields not filled are updated
          Session.set("sessionLastParcel", null);
          Session.set("sessionLastParcel", sessionLastParcel);
        } else {
          console.log("Error: Parcel not inserted");
          return false;
        }
      });

      return true;
    }
    //update client
    // Clients.update(clientId, {
    //   $set: {
    //     clientBarcodeNumber,
    //     updatedAt: new Date(),
    //   },
    // });

    return true;
  }

  handleReceive = (event) => {
    event.preventDefault();

    const isGroupClient =
      this.props.currentClient[0].clientGroupId != undefined;
    const { errors } = this.state;
    const deliveryTypeSelectedOption = this.state.selectDeliveryTypeValue
      ? this.state.selectDeliveryTypeValue
      : this.props.currentClient[0].deliveryType
      ? this.props.currentClient[0].deliveryType
      : "";
    const deliveryUserSelectedOption = this.state.selectDeliveryUserValue
      ? this.state.selectDeliveryUserValue
      : this.props.currentClient[0].receiveUser
      ? this.props.currentClient[0].receiveUser
      : "";

    if (isGroupClient && this.state.barcode.length == 0) {
      errors.Barcode = i18n.__("outbound.Please enter a barcode");
      this.setState({ errors });
    }
    if (this.state.carriers === "") {
      errors.Carriers = i18n.__("outbound.Please select a carrier");
      this.setState({ errors });
    }
    if (this.state.selectLocationValue === "") {
      errors.Location = i18n.__("outbound.Please select a Location/Company");
      this.setState({ errors });
    }
    if (this.inputRecipient.getValue() === "") {
      errors.Recipient = i18n.__("outbound.Please select a Recipient");
      this.setState({ errors });
    }
    if (deliveryTypeSelectedOption === "") {
      errors.ChooseType = i18n.__("outbound.Please choose a Delivery type");
      this.setState({ errors });
    }
    if (isGroupClient && this.state.selectedDestination === "") {
      errors.destinationType = i18n.__("outbound.Please select a Destination");
      this.setState({ errors });
    }
    if (isGroupClient && this.state.selectedSenderValue === "") {
      errors.senderType = i18n.__("outbound.Please select a Sender");
      this.setState({ errors });
    }
    if (deliveryUserSelectedOption === "") {
      errors.ReceivingAction = i18n.__(
        "outbound.Please select a Receiving Action"
      );
      this.setState({ errors });
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
    if (this.state.errors.Location.length > 0) return;
    if (this.state.errors.destinationType.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.noOfItems.length > 0) return;
    if (this.state.errors.Outbound_addr.length > 0) return;
    if (isGroupClient && this.state.errors.Barcode.length > 0) return;

    //disable receive button
    this.setState({ receive: false });
    const received = this.receiveParcel(this.getFormData(), false);

    if (!received) return;
    this.numberOfItemsInput.value = 1;
    this.notesInput.value = "";
    this.setState({
      selectDeliveryTypeValue: this.props.currentClient[0].deliveryType
        ? this.props.currentClient[0].deliveryType
        : "",
      selectDeliveryUserValue: this.props.currentClient[0].receiveUser
        ? this.props.currentClient[0].receiveUser
        : "",
    });
    this.setState(
      {
        barcode: [],
      },
      this.clearBarcodeField()
    );
    this.setState({ photo: "", photoName: "" });
    if (this.state.photoUrl == "") {
      this.photo.value = "";
    }
  };

  clearBarcodeField = () => {
    let arrLength = this.state.barcode.length;
    this.state.barcode.splice(0, arrLength);
    this.setState({ receive: true, outboundAndEmail: true });
  };
  renderSessionParcelCount() {
    const { sessionParcelCount } = this.props;

    if (!sessionParcelCount) return;

    return (
      <div>
        {i18n.__("outbound.Current parcel count")} <b>{sessionParcelCount}</b>
      </div>
    );
  }

  // @TODO: refactor and remove code duplications --and-- in many other methods too.
  // handleReceiveAndReceipt
  handleReceiveAndReceipt = (event) => {
    event.preventDefault();

    const isGroupClient =
      this.props.currentClient[0].clientGroupId != undefined;
    const { errors } = this.state;
    const deliveryTypeSelectedOption = this.state.selectDeliveryTypeValue
      ? this.state.selectDeliveryTypeValue
      : this.props.currentClient[0].deliveryType
      ? this.props.currentClient[0].deliveryType
      : "";
    const deliveryUserSelectedOption = this.state.selectDeliveryUserValue
      ? this.state.selectDeliveryUserValue
      : this.props.currentClient[0].receiveUser
      ? this.props.currentClient[0].receiveUser
      : "";

    if (isGroupClient && this.state.barcode.length == 0) {
      errors.Barcode = i18n.__("outbound.Please enter a barcode");
      this.setState({ errors });
    }
    if (this.state.carriers === "") {
      errors.Carriers = i18n.__("outbound.Please select a carrier");
      this.setState({ errors });
    }
    if (this.state.selectLocationValue === "") {
      errors.Location = i18n.__("outbound.Please select a Location/Company");
      this.setState({ errors });
    }
    if (this.inputRecipient.getValue() === "") {
      errors.Recipient = i18n.__("outbound.Please select a Recipient");
      this.setState({ errors });
    }
    if (deliveryTypeSelectedOption === "") {
      errors.ChooseType = i18n.__("outbound.Please choose a Delivery type");
      this.setState({ errors });
    }
    if (deliveryUserSelectedOption === "") {
      errors.ReceivingAction = i18n.__(
        "outbound.Please select a Receiving Action"
      );
      this.setState({ errors });
    }
    if (
      this.state.selectedDestination === "" &&
      this.props.currentClient[0].clientGroupId != undefined
    ) {
      errors.destinationType = i18n.__("outbound.Please select a Destination");
      this.setState({ errors });
    }
    if (
      this.state.selectedSenderValue === "" &&
      this.props.currentClient[0].clientGroupId != undefined
    ) {
      errors.senderType = i18n.__("outbound.Please select a Sender");
      this.setState({ errors });
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
    if (this.state.errors.destinationType.length > 0) return;
    if (this.state.errors.senderType.length > 0) return;
    if (this.state.errors.Recipient.length > 0) return;
    if (this.state.errors.noOfItems.length > 0) return;
    if (isGroupClient && this.state.errors.Barcode.length > 0) return;

    const formData = this.getFormData();
    //disable receive button
    this.setState({ outboundAndEmail: false });
    const clientName = this.props.currentClient[0].clientName;
    const clientEmail = this.props.currentClient[0].clientEmail;
    const clientLogo = this.props.currentClient[0].logo;
    let { clientBarcodeNumber } = this.props.currentClient[0];
    clientBarcodeNumber += 1;
    const clientUniqueBarcode =
      this.props.currentClient[0].clientBarcodeId + "-" + clientBarcodeNumber;
    const enableCustomEmail =
      typeof this.props.currentClient[0].customEmail !== null &&
      typeof this.props.currentClient[0].customEmail !== "undefined"
        ? this.props.currentClient[0].customEmail
        : 0;
    const received = this.receiveParcel(formData, true);
    if (!received) return;
    if (isGroupClient) {
      // outbound mail for group client
      Meteor.call("clientGroupOutbound", {
        location: formData.location,
        locationId: formData.locationId,
        sender: formData.sender,
        destination: formData.destination,
        senderId: formData.senderId,
        photoName: formData.photoName,
        type: formData.type,
        barcode: formData.barcode,
        clientUniqueBarcode: this.state.isUpdateMode
          ? this.state.clientUniqueBarcode
          : clientUniqueBarcode,
        carrier: formData.carrier,
        recipientName: formData.recipientName,
        outboundAddress: formData.outboundAddress,
        deliveryType: formData.deliveryType,
        numberOfItems: formData.numberOfItems,
        isUpdateMode: this.state.isUpdateMode,
        notes: formData.notes,
        clientName,
        clientEmail,
      });
    } else {
      Meteor.call("outboundCount", {
        locationName: formData.location,
        clientId: formData.clientId,
        clientName,
        clientEmail,
        clientLogo,
        enableCustomEmail,
        deliveryUser: formData.deliveryUser,
        utcOffset: moment().tz(timeZone.get()).utcOffset(),
      });
      this.clearForm();
      Session.set("sessionParcelCount", 0);
      this.setState(
        {
          barcode: [],
        },
        this.clearBarcodeField()
      );
      this.setState({ photo: "", photoName: "" });
      this.photo.value = "";
    }
  };

  checkCanClick = (e) => {
    const { sessionParcelCount } = this.props;
    if (!this.props.currentClient[0].clientGroupId && sessionParcelCount) {
      e.preventDefault();
      e.stopPropagation();
      alert(decode(i18n.__("outbound.You must finish this post by O&E")));
    }
  };

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

          this.setState({
            parcelId: result[0]._id,
            carriers: result[0].carrier,
            selectedSenderValue: result[0].sender,
            senderId: result[0].senderId,
            selectDeliveryTypeValue: result[0].deliveryType,
            selectDeliveryUserValue: result[0].deliveryUser,
            clientUniqueBarcode: result[0].clientUniqueBarcode,
            outboundAddress: result[0].outboundAddress,
            selectLocationValue: result[0].location,
            locationId: result[0].locationId,
            locationClientId: result[0].locationClientId,
            selectedDestination: result[0].destination,
            destinationId: result[0].destinationId,
            barcode: [result[0].barcode],
            barcodeInputValue: "",
            isUpdateMode: true,
            isLoading: false,
            errors,
          });
          this.numberOfItemsInput.value = result[0].numberOfItems;
          this.outboundAddressInput.value = result[0].outboundAddress;
          this.inputRecipient.setValue(result[0].recipientName);
          this.notesInput.value = result[0].notes;
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
                  moment(result[0].updatedAt).format("YYYY") +
                  "/" +
                  result[0].photoName,
              });
            } else {
              this.setState({
                photoUrl:
                  "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
                  moment(result[0].updatedAt).format("YYYY") +
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
            carriers: "",
            selectedSenderValue: "",
            senderId: "",
            selectDeliveryTypeValue: "",
            selectDeliveryUserValue: "",
            clientUniqueBarcode: "",
            outboundAddress: "",
            selectLocationValue: "",
            locationId: "",
            photoUrl: "",
            locationClientId: "",
            selectedDestination: "",
            destinationId: "",
            barcodeInputValue: "",
            barcode: [barcode],
            isUpdateMode: false,
            showInboundAlert: false,
            isLoading: false,
            errors,
          });
          this.numberOfItemsInput.value = 1;
          this.outboundAddressInput.value = "";
          this.inputRecipient.setValue("");
          this.notesInput.value = "";
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
      this.setState({ barcodeInputValue: "" });
      const { errors } = this.state;
      errors.Barcode = "";
      this.setState({ errors });
    }
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
            if (this.props.currentClient[0].clientGroupId != undefined) {
              if (this.state.barcode.length > 0) {
                alert("Barcode already entered.");
                this.setState({ barcodeInputValue: "", barcode: chips });
                return;
              } else {
                this.setState({
                  isLoading: true,
                  barcodeInputStringCount: 0,
                  readBarcode: true,
                });
                this.fetchDataByBarcode(value);
              }
            } else {
              if (chips.includes(value)) {
                alert("This barcode has already been scanned");
              }
              if (!chips.includes(value) && value !== "") chips.push(value);
              this.setState({ barcode: chips });
              this.setState({ barcodeInputValue: "" });
              this.setState({ barcodeInputStringCount: 0 });
              this.setState({ readBarcode: true });
            }
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
              The parcel will be saved as an inbound parcel and you can deliver
              it from the postrubella list.
            </Button>
          </div>
        ) : (
          ""
        )}
        <form autoComplete="off">
          <div className="form-row">
            <ChipInput
              label={i18n.__("outbound.Optional: Type barcode and press enter")}
              onChange={(chips) => this.handleChangeChips(chips)}
              value={this.state.barcode}
              onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
              fullWidth={true}
              id="barcode_id"
              onUpdateInput={(event) => this.checkBarcodeSource(event)}
              inputValue={this.state.barcodeInputValue}
              allowDuplicates={true}
            />
            <p className="red" hidden={this.state.errors.Barcode.length == ""}>
              {this.state.errors.Barcode}
            </p>
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("outbound.Select Carrier")}
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
              isDisabled={this.state.isUpdateMode}
            />
            <p className="red" hidden={this.state.errors.Carriers.length == ""}>
              {this.state.errors.Carriers}
            </p>
          </div>
          {this.props.currentClient[0].clientGroupId ? (
            <div className="form-row">
              {this.destinationDefaultOptions(
                this.props.currentClient[0].clientGroupId
              )}

              <AsyncSelect
                cacheOptions={false}
                theme={org_placeholderTheme}
                value={
                  this.state.selectedDestination !== ""
                    ? {
                        label: this.state.selectedDestination,
                        value: this.state.destinationId,
                      }
                    : {
                        label: decode(i18n.__("outbound.Destination")),
                        value: "",
                      }
                }
                isLoading={!isDestinationsReady.get()}
                loadOptions={this.destinationLoadOptions}
                defaultOptions={destinationOptions.get()}
                onChange={this.handleSelectDestination}
                isDisabled={this.state.isUpdateMode}
              />
              <p
                className="red"
                hidden={this.state.errors.destinationType.length == ""}
              >
                {this.state.errors.destinationType}
              </p>
            </div>
          ) : (
            ""
          )}
          <div className="form-row" onClick={this.checkCanClick}>
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("outbound.Select Location/Company")}
              theme={org_placeholderTheme}
              value={
                this.state.selectLocationValue !== ""
                  ? {
                      label: this.state.selectLocationValue,
                      value: this.state.locationId,
                    }
                  : {
                      label: i18n.__("outbound.Select Location/Company"),
                      value: "",
                    }
              }
              isClearable={true}
              filterOption={createFilter({ ignoreAccents: false })}
              isLoading={!this.props.locationSubscription}
              loadOptions={this.loadLocationOptions}
              defaultOptions={locationDefaultOptions.get()}
              onInputChange={this.handleLocationChange}
              onChange={this.handleSelectLocationChange}
              onMenuScrollToBottom={this.scrollMoreLocations}
              isDisabled={
                (!!this.props.sessionParcelCount &&
                  !this.props.currentClient[0].clientGroupId) ||
                this.state.isUpdateMode
              }
            />
            <p className="red" hidden={this.state.errors.Location.length == ""}>
              {this.state.errors.Location}
            </p>
          </div>
          {this.props.currentClient[0].clientGroupId ? (
            <div className="form-row">
              <AsyncSelect
                cacheOptions={false}
                theme={org_placeholderTheme}
                value={
                  this.state.selectedSenderValue !== ""
                    ? {
                        label: this.state.selectedSenderValue,
                        value: this.state.senderId,
                      }
                    : { label: i18n.__("outbound.Sender"), value: "" }
                }
                isLoading={!this.props.senderSubscription}
                loadOptions={this.loadSenderOptions}
                defaultOptions={senderDefaultOptions.get()}
                onInputChange={this.handleSenderChange}
                onChange={this.handleSelectSenderChange}
                onMenuScrollToBottom={this.scrollMoreSenders}
                isDisabled={
                  !this.props.currentClient[0].clientGroupId ||
                  this.state.isUpdateMode
                }
              />
              <p
                className="red"
                hidden={this.state.errors.senderType.length == ""}
              >
                {this.state.errors.senderType}
              </p>
            </div>
          ) : (
            ""
          )}
          <div
            className="form-row"
            style={{ ...(!this.state.isUpdateMode && { display: "none" }) }}
          >
            <AsyncSelect
              theme={org_placeholderTheme}
              value={{
                label: this.state.selectDeliveryTypeValue,
                value: this.state.selectDeliveryTypeValue,
              }}
              isDisabled
            />
          </div>
          <div
            className="form-row"
            style={{ ...(this.state.isUpdateMode && { display: "none" }) }}
          >
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("outbound.Select Delivery Type")}
              theme={org_placeholderTheme}
              value={
                this.state.selectDeliveryTypeValue !== ""
                  ? {
                      label: this.state.selectDeliveryTypeValue,
                      value: this.state.selectDeliveryTypeValue,
                    }
                  : {
                      label: decode(i18n.__("outbound.Select Delivery Type")),
                      value: "",
                    }
              }
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
                      label: decode(i18n.__("outbound.Select Delivery Type")),
                      value: "",
                    }
              }
              isLoading={!this.props.deliveryTypeSubscription}
              loadOptions={this.loadDeliverytypeOptions}
              defaultOptions={deliveryTypeDefaultOptions.get()}
              onInputChange={this.handleDeliveryTypeChange}
              onChange={this.handleSelectDeliveryType}
              onMenuScrollToBottom={this.scrollMoreDeliveryTypes}
              isDisabled={this.state.isUpdateMode}
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
              placeholder={i18n.__("outbound.Select Receiving Action")}
              theme={org_placeholderTheme}
              value={
                this.state.selectDeliveryUserValue !== ""
                  ? {
                      label: this.state.selectDeliveryUserValue,
                      value: this.state.selectDeliveryUserValue,
                    }
                  : {
                      label: decode(
                        i18n.__("outbound.Select Receiving Action")
                      ),
                      value: "",
                    }
              }
              isLoading={!this.props.userSubscription}
              loadOptions={this.loadReceivingActionOptions}
              defaultInputValue={
                this.props.currentClient[0].receiveUser
                  ? this.props.currentClient[0].receiveUser
                  : ""
              }
              defaultValue={
                this.props.currentClient[0].receiveUser
                  ? {
                      label: this.props.currentClient[0].receiveUser,
                      value: this.props.currentClient[0].receiveUser,
                    }
                  : { label: "Select Assign Action", value: "" }
              }
              defaultOptions={receivingActionDefaultOptions.get()}
              onInputChange={this.handleReceivingActionChange}
              onChange={this.handleSelectReceivingAction}
              onMenuScrollToBottom={this.scrollMoreUsers}
              isDisabled={this.state.isUpdateMode}
            />
            <p
              className="red"
              hidden={this.state.errors.ReceivingAction.length == ""}
            >
              {this.state.errors.ReceivingAction}
            </p>
          </div>
          <div className="form-row">
            <input
              type="text"
              ref={(c) => {
                this.outboundAddressInput = c;
              }}
              placeholder={i18n.__("outbound.Enter first line of address")}
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
            <InputAutosuggest
              onRef={(ref) => {
                this.inputRecipient = ref;
              }}
              getValue={(obj) => obj.recipientName}
              url="autocomplete.recipients"
              placeholder={i18n.__("outbound.Enter Recipient")}
              onChange={() => {
                const { errors } = this.state;
                errors.Recipient = "";
                this.setState({ errors });
                this.setState({ recipientLabel: "" });
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
            <input
              type="number"
              ref={(c) => {
                this.numberOfItemsInput = c;
              }}
              defaultValue="1"
              min="1"
              max="30"
              placeholder={i18n.__("outbound.Number of Items")}
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
              placeholder={i18n.__("outbound.Optional: Additional notes")}
              maxLength="300"
            />
          </div>
          {typeof this.state.photoUrl !== "undefined" &&
          this.state.photoUrl !== "" ? (
            <div className="form-row mb1">
              <Button
                fullWidth={true}
                color="inherit"
                variant="outlined"
                href={this.state.photoUrl}
                target="_blank"
              >
                {decode(i18n.__("common.Show parcel photo"))}
              </Button>
            </div>
          ) : (
            <div className="row clearfix" hidden={this.state.isUpdateMode}>
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
              <p className={"client-form-logo-description"}>
                {decode(
                  i18n.__("common.Instructions for uploading parcel photo")
                )}
              </p>
            </div>
          )}
          <div className="margin-bottom-65 clearfix  mb1">
            <div className="form-row left col col-6 sm-col-6 md-col-6">
              <Button
                onClick={this.handleReceive}
                fullWidth={true}
                color="primary"
                variant="contained"
                disabled={!this.state.receive}
              >
                {i18n.__("outbound.Outbound")}
              </Button>
            </div>
            <div className="form-row right col col-6 sm-col-6 md-col-6">
              <Button
                onClick={this.handleReceiveAndReceipt}
                fullWidth={true}
                color="primary"
                variant="contained"
                disabled={!this.state.outboundAndEmail}
              >
                {decode(i18n.__("outbound.Outbound & Email"))}
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
OutboundPage.propTypes = {
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
  const senderSubscription = Meteor.subscribe(
    "sendersWithEmail",
    sendersLimit.get(),
    findQuerySenders.get()
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
    Locations.find({})
      .fetch()
      .sort((a, b) => (a.locationName > b.locationName ? 1 : -1))
      .map((location, key) => {
        return {
          value: location._id,
          label: location.locationName,
          clientId: location.clientId ? location.clientId : "",
        };
      })
  );
  senderDefaultOptions.set(
    Senders.find({})
      .fetch()
      .sort((a, b) => (a.senderName > b.senderName ? 1 : -1))
      .map((sender, key) => {
        return { value: sender._id, label: sender.senderName };
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
  receivingActionDefaultOptions.set(
    Meteor.users
      .find({})
      .fetch()
      .sort((a, b) => (a.username > b.username ? 1 : -1))
      .map((user, key) => {
        return { value: user._id, label: user.username };
      })
  );
  return {
    sessionParcelCount: Session.get("sessionParcelCount"),
    sessionLastParcel: Session.get("sessionLastParcel"),
    currentClient: Clients.find({ _id: query.clientId }).fetch(),
    carriers: Carriers.find(query).fetch(),
    locations: Locations.find({}).fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    currentClientSub: currentClientSub,
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    senderSubscription: senderSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(OutboundPage);
