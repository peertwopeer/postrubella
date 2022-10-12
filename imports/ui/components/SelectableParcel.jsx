import React, { Component } from "react";
import PropTypes from "prop-types";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import moment from "moment-timezone";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Link from "@material-ui/core/Link";
import InfoIcon from "@material-ui/icons/Info";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import { Parcels } from "/imports/api/parcels.js";
import AsyncSelect from "react-select/async";

import "/imports/languages/en/en.boxview.i18n.yml";
import "/imports/languages/en/en.inbound.i18n.yml";
import "/imports/languages/de/de.boxview.i18n.yml";
import "/imports/languages/de/de.inbound.i18n.yml";
import "/imports/languages/en-JM/en-JM.boxview.i18n.yml";
import "/imports/languages/en-JM/en-JM.inbound.i18n.yml";

import { Carriers, Locations, DeliveryTypes } from "/imports/api/";
const publicDir = `${Meteor.settings.public.cdn}/public`;
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
var assignActionDefaultOptions = new ReactiveVar([]);
const staticAssignActions = [
  { value: "Collect from postrubella", label: "Collect from postrubella" },
  { value: "Reception", label: "Reception" },
  { value: "Security", label: "Security" },
  { value: "Delivery AM", label: "Delivery AM" },
  { value: "Delivery PM", label: "Delivery PM" },
  { value: "Delivered Today", label: "Delivered Today" },
];
const staticDeliveryTypes = [{ value: "Normal", label: "Normal" }];
class SelectableParcel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      parcelBarcodeValue: this.props.parcel.barcode,
      parcelCarrierValue: this.props.parcel.carrier,
      parcelSenderValue: this.props.parcel.sender,
      parcelPostmanValue: this.props.parcel.deliveryUser,
      parcelDeliveryTypeValue: this.props.parcel.deliveryType,
      parcelLocationValue: this.props.parcel.location,
      parcelLocationId: this.props.parcel.locationId,
      parcelRecipientValue: this.props.parcel.recipientName,
      parcelNumberOfItemsValue: this.props.parcel.numberOfItems,
      parcelOutboundAddressValue: this.props.parcel.outboundAddress,
      parcelNotesValue: this.props.parcel.notes,
      errors: {
        noOfItems: "",
        Carriers: "",
        Recipient: "",
        Location: "",
        ChooseType: "",
        AssignAction: "",
      },
    };
  }
  //dropdown handles
  //carriers
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

  handleParcelCarrierChange = (selectedOption) => {
    this.setState({
      parcelCarrierValue: selectedOption ? selectedOption.label : "",
    });
    const { errors } = this.state;
    errors.Carriers = "";
    this.setState({ errors });
  };
  //Locations
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
      locationName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  handleSelectLocationChange = (selectedOption) => {
    this.setState({
      parcelLocationValue: selectedOption ? selectedOption.label : "",
    });
    this.setState({
      parcelLocationId: selectedOption ? selectedOption.value : "",
    });
    const { errors } = this.state;
    errors.Location = "";
    this.setState({ errors });
  };
  //Delivery types
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
  handleparcelDeliveryTypeChange = (selectedOption) => {
    this.setState({
      parcelDeliveryTypeValue: selectedOption ? selectedOption.label : "",
    });
    const { errors } = this.state;
    errors.ChooseType = "";
    this.setState({ errors });
  };
  //postman
  loadAssignActionOptions = (inputValue, callback) => {
    let assignActionOptions = staticAssignActions.concat(
      this.props.allUsers
        .sort((a, b) => (a.username > b.username ? 1 : -1))
        .map((user, key) => {
          return { value: user._id, label: user.username };
        })
    );
    callback(assignActionOptions.filter((i) => i));
  };
  handleAssignActionChange = (inputValue) => {
    findQueryUsers.set({
      username: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleParcelPostmanChange = (selectedOption) => {
    this.setState({
      parcelPostmanValue: selectedOption ? selectedOption.label : "",
    });
    const { errors } = this.state;
    errors.AssignAction = "";
    this.setState({ errors });
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
  handleParcelBarcodeChange = (event) => {
    this.setState({ parcelBarcodeValue: event.target.value });
  };
  handleParcelSenderChange = (event) => {
    this.setState({ parcelSenderValue: event.target.value });
  };
  handleParcelRecipientChange = (event) => {
    this.setState({ parcelRecipientValue: event.target.value });
  };
  handleParcelNumberOfItemsChange = (event) => {
    this.setState({ parcelNumberOfItemsValue: event.target.value });
  };
  handleParcelOutboundAddressChange = (event) => {
    this.setState({ parcelOutboundAddressValue: event.target.value });
  };
  handleParcelNotesChange = (event) => {
    this.setState({ parcelNotesValue: event.target.value });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.parcel._id });
  };
  cancelEditing = () => {
    this.setState({ editing: null });
  };
  onSelected = () => {
    this.props.onChecked(this.props.parcel._id, this.selectable.checked);
  };

  handleSubmit = (event) => {
    event.preventDefault();

    const {
      editing,
      parcelBarcodeValue: barcode,
      parcelCarrierValue: carrier,
      parcelSenderValue: sender,
      parcelPostmanValue: deliveryUser,
      parcelDeliveryTypeValue: deliveryType,
      parcelLocationValue: location,
      parcelLocationId: locationId,
      parcelRecipientValue: recipientName,
      parcelNumberOfItemsValue: numberOfItems,
      parcelOutboundAddressValue: outboundAddress,
      parcelNotesValue: notes,
    } = this.state;

    const parcelID = editing;

    const { errors } = this.state;

    if (carrier === "") {
      errors.Carriers = i18n.__("inbound.Please select a carrier");
      this.setState({ errors });
    }
    if (location === "") {
      errors.Location = i18n.__("inbound.Please select a Location/Company");
      this.setState({ errors });
    }
    if (deliveryType === "") {
      errors.ChooseType = i18n.__("inbound.Please choose a Delivery type");
      this.setState({ errors });
    }
    if (deliveryUser === "") {
      errors.AssignAction = i18n.__("inbound.Please select an Option");
      this.setState({ errors });
    }
    if (this.state.errors.Carriers.length > 0) return;
    if (this.state.errors.Location.length > 0) return;
    if (this.state.errors.ChooseType.length > 0) return;
    if (this.state.errors.AssignAction.length > 0) return;
    if (carrier.length <= 2) return;
    if (deliveryUser.length <= 2) return;
    if (deliveryType.length <= 2) return;
    if (location.length <= 2) return;
    if (recipientName.length <= 2) return;

    Parcels.update(parcelID, {
      $set: {
        barcode,
        carrier,
        sender,
        deliveryUser,
        deliveryType,
        location,
        locationId,
        recipientName,
        numberOfItems,
        outboundAddress,
        notes,
        updatedAt: new Date(),
      },
    });
    this.setState({ editing: null });
  };

  renderBarcode() {
    if (!this.props.parcel.clientUniqueBarcode) {
      return <span>{this.props.parcel._id}</span>;
    }

    return <span>{this.props.parcel.clientUniqueBarcode}</span>;
  }

  renderQRCode() {
    if (!this.props.parcel.qrcode) return;

    return (
      <div className="block-qr-code">
        <a
          href={`/pdf/${this.props.parcel.clientUniqueBarcode}`}
          target="_blank"
        >
          <img src={this.props.parcel.qrcode} />
        </a>
      </div>
    );
  }

  renderRecipientName() {
    if (this.props.parcel.recipientInboundName) {
      return <span>( {this.props.parcel.recipientInboundName} )</span>;
    }
    if (this.props.parcel.outboundRecipient) {
      return <span>( {this.props.parcel.outboundRecipient} )</span>;
    }
    if (!this.props.parcel.recipientInboundName) {
      return <span>{this.props.parcel.recipientName}</span>;
    }
    if (!this.props.parcel.outboundRecipient) {
      return <span>{this.props.parcel.recipientName}</span>;
    }
  }

  renderEditFieldsManager() {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ["super-admin", "client-manager"])) {
      return (
        <div className="block-row">
          <div className="form-row">
            <div className="form-row-label">{i18n.__("boxview.Barcode")}:</div>

            <input
              type="text"
              placeholder={i18n.__("boxview.Barcode")}
              value={this.state.parcelBarcodeValue}
              onChange={this.handleParcelBarcodeChange}
              readOnly={this.props.parcel.destinationId}
            />
          </div>
        </div>
      );
    }
  }

  renderEditOutboundAddress() {
    if (this.props.parcel.type === "inbound") return;
    if (this.props.parcel.type === "outbound") {
      return (
        <div className="block-row mb2">
          <div className="form-row">
            <div className="form-row-label">
              {i18n.__("boxview.Outbound Address")} :
            </div>
            <input
              type="text"
              ref="parcelOutboundAddress"
              placeholder={i18n.__("boxview.Outbound Address")}
              value={this.state.parcelOutboundAddressValue}
              onChange={this.handleParcelOutboundAddressChange}
            />
          </div>
        </div>
      );
    }
  }

  renderEditSender() {
    if (this.props.parcel.type === "outbound") return;
    if (this.props.parcel.type === "inbound") {
      return (
        <div className="block-row">
          <div className="form-row">
            <div className="form-row-label">{i18n.__("boxview.Sender")} </div>

            <input
              type="text"
              placeholder={i18n.__("boxview.Sender")}
              value={this.state.parcelSenderValue}
              onChange={this.handleParcelSenderChange}
            />
          </div>
        </div>
      );
    }
  }

  scanThrough() {
    if (!this.props.parcel.xrayInput) return;
    if (this.props.parcel.xrayInput) {
      return (
        <div className="block-row">
          <b>{i18n.__("boxview.This item has been through an x-ray")} :</b>
          {i18n.__("boxview.Yes")}
        </div>
      );
    }
  }

  createdAt() {
    const { parcel } = this.props;

    if (parcel.offline)
      return (
        <div className="block-row">
          <b>{i18n.__("boxview.Received At")}:</b>
          {moment(this.props.parcel.offlineDate)
            .tz(this.props.timezone)
            .format("lll")}
        </div>
      );

    return (
      <div className="block-row">
        <b>{i18n.__("boxview.Received At")}:</b>
        {moment(this.props.parcel.createdAt)
          .tz(this.props.timezone)
          .format("lll")}
      </div>
    );
  }

  deliveryDateStatus() {
    if (
      !this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return <span>{i18n.__("boxview.undelivered")}</span>;
    }
    if (
      this.props.parcel.attemptedToDeliver &&
      this.props.parcel.deliveredAt == null
    ) {
      return (
        <span>
          {i18n.__("boxview.Attempted")} :{" "}
          {this.props.parcel.attemptedToDeliver.length}
        </span>
      );
    }
    if (this.props.parcel.deliveredAt !== null) {
      const deliveryDateStatus = moment(this.props.parcel.deliveredAt)
        .tz(this.props.timezone)
        .format("lll");

      return <span>{deliveryDateStatus}</span>;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // if parent component is true and child components are false
    if (nextProps.selectAll && !this.props.selectAll) {
      // tick all child components
      this.selectable.checked = nextProps.selectAll;
      // run function and add to bag
      this.onSelected();
      return true;
    }
    if (!nextProps.selectAll && this.props.selectAll) {
      // tick all child components
      this.selectable.checked = nextProps.selectAll;
      // run function and add to bag
      this.onSelected();
      return true;
    }
    return true;
  }

  renderDocOrEditDoc() {
    let deliveryStatus;
    let photoUrl = "";

    if (
      typeof this.props.parcel.photoName !== "undefined" &&
      this.props.parcel.photoName !== ""
    ) {
      if (
        Meteor.absoluteUrl().includes("localhost") ||
        Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")
      ) {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/dev/" +
          moment(this.props.parcel.createdAt).format("YYYY") +
          "/" +
          this.props.parcel.photoName;
      } else {
        photoUrl =
          "https://postrubella.ams3.digitaloceanspaces.com/public/parcels-photos/" +
          moment(this.props.parcel.createdAt).format("YYYY") +
          "/" +
          this.props.parcel.photoName;
      }
    }

    const clickedID = this.props.parcel._id;

    if (this.props.parcel.deliveredAt == null) {
      deliveryStatus = <org_placeholderTriangle className="recieved" />;
    } else {
      deliveryStatus = <org_placeholderTriangle className="delivered" />;
    }

    if (this.state.editing === clickedID) {
      return (
        <div className="block block-parcel md-col-6 lg-col-4">
          <Paper elevation={3} className="block-paper">
            <div
              style={{ minHeight: "500px" }}
              className="block-content clearix"
            >
              <div className="inside">
                <div className="block-title barcode">
                  {this.renderBarcode()}
                </div>

                <div className="block-body">
                  {this.renderEditFieldsManager()}

                  <div className="block-row">
                    <div className="form-row-label">
                      {i18n.__("boxview.Carrier")}
                    </div>
                    <AsyncSelect
                      cacheOptions={false}
                      placeholder={i18n.__("boxview.Carrier")}
                      theme={org_placeholderTheme}
                      isClearable={true}
                      isLoading={!this.props.carrierSubscription}
                      loadOptions={this.loadCarrierOptions}
                      defaultOptions={carrierDefaultOptions.get()}
                      value={
                        this.state.parcelCarrierValue
                          ? {
                              label: this.state.parcelCarrierValue,
                              value: this.state.parcelCarrierValue,
                            }
                          : { label: i18n.__("boxview.Carrier"), value: "" }
                      }
                      onInputChange={this.handleInputChange}
                      onChange={this.handleParcelCarrierChange}
                      onMenuScrollToBottom={this.scrollMoreCarriers}
                    />
                    <p
                      className="red"
                      hidden={this.state.errors.Carriers.length == ""}
                    >
                      {this.state.errors.Carriers}
                    </p>
                  </div>
                  {this.renderEditSender()}

                  <br></br>
                  <div className="block-row">
                    <div className="form-row-label">
                      {i18n.__("boxview.Post Instructions")}
                    </div>
                    <AsyncSelect
                      cacheOptions={false}
                      placeholder={i18n.__("boxview.Postman")}
                      theme={org_placeholderTheme}
                      isLoading={!this.props.userSubscription}
                      loadOptions={this.loadAssignActionOptions}
                      value={
                        this.state.parcelPostmanValue
                          ? {
                              label: this.state.parcelPostmanValue,
                              value: this.state.parcelPostmanValue,
                            }
                          : { label: i18n.__("boxview.Postman"), value: "" }
                      }
                      defaultOptions={assignActionDefaultOptions.get()}
                      onInputChange={this.handleAssignActionChange}
                      onChange={this.handleParcelPostmanChange}
                      onMenuScrollToBottom={this.scrollMoreUsers}
                    />
                    <p
                      className="red"
                      hidden={this.state.errors.AssignAction.length == ""}
                    >
                      {this.state.errors.AssignAction}
                    </p>
                  </div>
                  <br></br>
                  <div className="block-row">
                    <div className="form-row-label">
                      {i18n.__("boxview.Delivery Type")}
                    </div>
                    <AsyncSelect
                      cacheOptions={false}
                      placeholder={i18n.__("boxview.Delivery Type")}
                      theme={org_placeholderTheme}
                      isLoading={!this.props.deliveryTypeSubscription}
                      loadOptions={this.loadDeliverytypeOptions}
                      defaultOptions={deliveryTypeDefaultOptions.get()}
                      value={
                        this.state.parcelDeliveryTypeValue
                          ? {
                              label: this.state.parcelDeliveryTypeValue,
                              value: this.state.parcelDeliveryTypeValue,
                            }
                          : {
                              label: i18n.__("boxview.Delivery Type"),
                              value: "",
                            }
                      }
                      onInputChange={this.handleDeliveryTypeChange}
                      onChange={this.handleparcelDeliveryTypeChange}
                      onMenuScrollToBottom={this.scrollMoreDeliveryTypes}
                    />
                    <p
                      className="red"
                      hidden={this.state.errors.ChooseType.length == ""}
                    >
                      {this.state.errors.ChooseType}
                    </p>
                  </div>
                  <br></br>
                  <div className="block-row mb2">
                    <div className="form-row-label">
                      {i18n.__("boxview.Location/Company")}
                    </div>
                    <AsyncSelect
                      cacheOptions={false}
                      placeholder={i18n.__("boxview.Location/Company")}
                      theme={org_placeholderTheme}
                      value={
                        this.state.parcelLocationValue !== ""
                          ? {
                              label: this.state.parcelLocationValue,
                              value: this.state.parcelLocationId,
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
                    />
                    <p
                      className="red"
                      hidden={this.state.errors.Location.length == ""}
                    >
                      {this.state.errors.Location}
                    </p>
                  </div>
                  <div className="block-row mb2">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Recipient / Addressee")} :
                      </div>
                      <input
                        type="text"
                        placeholder={i18n.__("boxview.Recipient")}
                        value={this.state.parcelRecipientValue}
                        onChange={this.handleParcelRecipientChange}
                      />
                    </div>
                  </div>

                  <div className="block-row mb2">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Number of Items")} :
                      </div>
                      <input
                        type="number"
                        placeholder={i18n.__("boxview.Number of Items")}
                        value={this.state.parcelNumberOfItemsValue}
                        onChange={this.handleParcelNumberOfItemsChange}
                      />
                    </div>
                  </div>

                  {this.renderEditOutboundAddress()}

                  <div className="block-row mb2">
                    <div className="form-row">
                      <div className="form-row-label">
                        {i18n.__("boxview.Notes")} :
                      </div>
                      <input
                        type="text"
                        placeholder={i18n.__("boxview.Notes")}
                        value={this.state.parcelNotesValue}
                        onChange={this.handleParcelNotesChange}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={this.handleSubmit}
                    fullWidth={true}
                    color="primary"
                    variant="contained"
                  >
                    {i18n.__("common.Update")}
                  </Button>
                </div>
              </div>
            </div>
            <div className="block-status clearix" />
            <div className="block-meta clearix">
              <div className="inside">
                <div className="block-meta-text">
                  <div className="block-row">
                    <b>{i18n.__("common.Received By")}:</b>
                    {this.props.parcel.username}
                  </div>
                  {this.createdAt()}
                </div>
                <div className="block-meta-links">
                  <div className="left">
                    <div className="delivery-status">{deliveryStatus}</div>
                  </div>
                  <div className="block-icon" onClick={this.cancelEditing}>
                    <img src={`${publicDir}/svg/IconSettings.svg`} />
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }
    if (this.state.editing === null) {
      return (
        <div className="block block-parcel md-col-6 lg-col-4">
          <Paper elevation={3} className="block-paper">
            <div
              style={{ minHeight: "500px" }}
              className="block-content clearix"
            >
              <div className="inside">
                <div className="parcel-select">
                  <input
                    type="checkbox"
                    ref={(input) => {
                      this.selectable = input;
                    }}
                    className="checkbox"
                    defaultChecked={this.props.checked}
                    name="selectParcel"
                    value={this.props.parcel._id}
                    onClick={this.onSelected}
                  />
                </div>

                <div className="block-title barcode">
                  {this.props.parcel.clientUniqueBarcode}
                </div>

                {/*{ this.renderQRCode() }*/}

                <div className="block-body">
                  <div className="block-row">
                    <b>{i18n.__("boxview.Post")}:</b>
                    {this.props.parcel.type}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Barcode")}:</b>
                    {this.props.parcel.barcode ||
                      this.props.parcel.clientUniqueBarcode}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Carrier")}:</b>
                    {this.props.parcel.carrier}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Sender")}:</b>
                    {this.props.parcel.sender}
                  </div>
                  {this.props.isGroupClient == true ? (
                    <>
                      {this.props.parcel.destination ? (
                        <div className="block-row">
                          <b>{i18n.__("boxview.Destination")}:</b>
                          {this.props.parcel.destination}
                        </div>
                      ) : (
                        <div></div>
                      )}
                      {this.props.parcel.lastProcessed ? (
                        <div className="block-row">
                          <b>{i18n.__("boxview.Last Processed")}:</b>
                          <p>
                            {this.props.parcel.lastProcessed}{" "}
                            <Link
                              href=""
                              color="initial"
                              underline="none"
                              onClick={() =>
                                FlowRouter.go(
                                  "/view-parcel-details?parcelId=" +
                                    this.props.parcel._id
                                )
                              }
                            >
                              <InfoIcon fontSize="inherit" />
                            </Link>
                          </p>
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </>
                  ) : null}
                  <div className="block-row">
                    <b>{i18n.__("boxview.Post Instructions")}:</b>
                    {this.props.parcel.deliveryUser}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Location/Company")}:</b>
                    {this.props.parcel.location}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Recipient / Addressee")}:</b>
                    {this.renderRecipientName()}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Type")}:</b>
                    {this.props.parcel.deliveryType}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Number of Items")}:</b>
                    {this.props.parcel.numberOfItems}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Delivered At")}:</b>
                    {this.deliveryDateStatus()}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("boxview.Outbound Address")}:</b>
                    {this.props.parcel.outboundAddress}
                  </div>
                  <div className="block-row">
                    <b>{i18n.__("common.Assign user")}:</b>
                    {this.props.parcel.assignUser}
                  </div>
                  {this.scanThrough()}
                  {photoUrl !== "" ? (
                    <div className="block-row">
                      <b>{i18n.__("common.Photo URL")}:</b>{" "}
                      <a href={photoUrl} target="_blank">
                        {" "}
                        Click here to open image file{" "}
                      </a>
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <div className="block-notes">
                  <div className="block-icon">
                    <img src={`${publicDir}/svg/IconClipboard.svg`} />
                  </div>
                  {this.props.parcel.notes}
                </div>
              </div>
            </div>
            <div className="block-status clearix" />
            <div className="block-meta clearix">
              <div className="inside">
                <div className="block-meta-text">
                  <div className="block-row">
                    <b>{i18n.__("common.Received By")}</b>
                    {this.props.parcel.username}
                  </div>
                  {this.createdAt()}
                </div>

                <div className="block-meta-links">
                  <div className="left">
                    <div className="delivery-status">{deliveryStatus}</div>
                  </div>
                  {this.renderEditToggle()}
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }
  }

  renderEditToggle() {
    if (Meteor.isCordova) return;

    return (
      <div className="block-icon" onClick={this.toggleEditing}>
        <img src={`${publicDir}/svg/IconSettings.svg`} />
      </div>
    );
  }

  render() {
    return this.renderDocOrEditDoc();
  }
}
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

  const user = Meteor.user();
  const query = {};

  //set clientId
  if (user) {
    query.clientId = user.profile.clientId;
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

  assignActionDefaultOptions.set(
    staticAssignActions.concat(
      Meteor.users
        .find({})
        .fetch()
        .sort((a, b) => (a.username > b.username ? 1 : -1))
        .map((user, key) => {
          return { value: user._id, label: user.username };
        })
    )
  );

  return {
    carriers: Carriers.find(query).fetch(),
    locations: Locations.find().fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(SelectableParcel);
SelectableParcel.propTypes = {
  parcel: PropTypes.object.isRequired,
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
  isGroupClient: PropTypes.bool,
};
SelectableParcel.defaultProps = {
  checked: false,
};
