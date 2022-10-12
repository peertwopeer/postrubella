import React, { Component } from "react";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment-timezone";
import ChipInput from "material-ui-chip-input";
import Button from "@material-ui/core/Button";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/moment";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import { Parcels } from "/imports/api/parcels.js";
import SelectableParcel from "/imports/ui/components/SelectableParcel.jsx";
import SelectableParcelRow from "/imports/ui/components/SelectableParcelRow.jsx";
import Carriers from "/imports/api/carriers.js";
import { Recipients } from "/imports/api/recipients.js";
import { Locations } from "/imports/api/locations.js";
import { DeliveryTypes } from "/imports/api/deliveryTypes.js";
import { Clients } from "../../api";
import AsyncSelect from "react-select/async";
import "/imports/languages/en/en.postbag.i18n.yml";
import "/imports/languages/de/de.postbag.i18n.yml";
import "/imports/languages/en-JM/en-JM.postbag.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
const LIMIT_INCREMENT = 9;
const limit = new ReactiveVar(LIMIT_INCREMENT);
const subscriptionLimit = new ReactiveVar(20);
const searchParamsVar = new ReactiveVar({});
var Limit = 10;
var findQueryCarriers = new ReactiveVar({});
var findQueryRecipients = new ReactiveVar({});
var findQueryLocations = new ReactiveVar({});
var findQueryDeliveryTypes = new ReactiveVar({});
var findQueryUsers = new ReactiveVar({});
var carriersLimit = new ReactiveVar(10);
var recipientsLimit = new ReactiveVar(10);
var locationsLimit = new ReactiveVar(10);
var deliveryTypesLimit = new ReactiveVar(10);
var usersLimit = new ReactiveVar(10);
var carrierDefaultOptions = new ReactiveVar([]);
var recipientDefaultOptions = new ReactiveVar([]);
var locationDefaultOptions = new ReactiveVar([]);
var deliveryTypeDefaultOptions = new ReactiveVar([]);
var deliveryUserDefaultOptions = new ReactiveVar([]);
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
const staticDeliveryTypes = [{ value: "Normal", label: "Normal" }];
const staticAssignActions = [
  { value: "Collect from postrubella", label: "Collect from postrubella" },
  { value: "Reception", label: "Reception" },
  { value: "Security", label: "Security" },
  { value: "Delivery AM", label: "Delivery AM" },
  { value: "Delivery PM", label: "Delivery PM" },
  { value: "Delivered Today", label: "Delivered Today" },
];
class AddToPostbag extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      list: {},
      barcode: [],
      clientUniqueBarcode: [],
      selectCarrierValue: "",
      selectRecipientValue: "",
      selectLocationValue: "",
      selectDeliveryUserValue: undefined,
      selectDeliveryTypeValue: undefined,
      selectItemTypeValue: undefined,
      dateFromValue: null,
      dateToValue: null,
      listView: true,
      boxView: false,
      showSearchFilters: true,
      checked: false,
    };
    this.list = {};
  }

  //load more functions for dropdowns
  scrollMoreCarriers = () => {
    carriersLimit.set(carriersLimit.get() + Limit);
  };
  scrollMoreRecipients = () => {
    recipientsLimit.set(recipientsLimit.get() + Limit);
  };
  scrollMoreLocations = () => {
    locationsLimit.set(locationsLimit.get() + Limit);
  };
  scrollMoreDeliveryTypes = () => {
    deliveryTypesLimit.set(deliveryTypesLimit.get() + Limit);
  };
  scrollMoreUsers = () => {
    usersLimit.set(usersLimit.get() + Limit);
  };

  //dropdown handles
  handleChange = (event) => {
    let className = event.target.className;
    let value = event.target.value;
    if (className == "input-item-type") {
      this.setState({ selectItemTypeValue: value }, () => {
        this.searchFunction();
      });
    }
  };

  handleDateFromChange = (dateFromValue) => {
    dateFromValue = moment(dateFromValue).startOf("day").toDate();
    this.setState({ dateFromValue: dateFromValue }, () => {
      this.searchFunction();
    });
  };

  handleDateToChange = (dateToValue) => {
    dateToValue = moment(dateToValue).endOf("day").toDate();
    this.setState({ dateToValue: dateToValue }, () => {
      this.searchFunction();
    });
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

  handleCarrierChange = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.label : "";
    this.setState({ selectCarrierValue: selectedOption }, () => {
      this.searchFunction();
    });
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
      locationName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  handleSelectLocationChange = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.label : "";
    this.setState({ selectLocationValue: selectedOption }, () => {
      this.searchFunction();
    });
  };

  loadRecipientOptions = async (_, callback) => {
    const recipients = await Recipients.find(findQueryRecipients.get()).fetch();
    let recipientOptions = recipients
      .sort((a, b) => (a.recipientName > b.recipientName ? 1 : -1))
      .map((recipient, key) => {
        return { value: recipient._id, label: recipient.recipientName };
      });
    callback(recipientOptions.filter((i) => i));
  };
  handleRecipientChange = (inputValue) => {
    findQueryRecipients.set({
      recipientName: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleSelectRecipientChange = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.label : "";
    this.setState({ selectRecipientValue: selectedOption }, () =>
      this.searchFunction()
    );
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
    selectedOption = selectedOption ? selectedOption.label : "";
    this.setState({ selectDeliveryTypeValue: selectedOption }, () => {
      this.searchFunction();
    });
  };
  loadDeliveryUserOptions = (inputValue, callback) => {
    let assignActionOptions = staticAssignActions.concat(
      this.props.allUsers
        .sort((a, b) => (a.username > b.username ? 1 : -1))
        .map((user, key) => {
          return { value: user._id, label: user.username };
        })
    );
    callback(assignActionOptions.filter((i) => i));
  };
  handleDeliveryUserChange = (inputValue) => {
    findQueryUsers.set({
      username: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleSelectDeliveryUser = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.label : "";
    this.setState({ selectDeliveryUserValue: selectedOption }, () => {
      this.searchFunction();
    });
  };

  componentDidMount() {
    this._isMounted = true;
    // @FIXME Make more reactive
    this.fixView();
    searchParamsVar.set({
      $and: [{ deliveredAt: { $exists: false } }],
      $or: [
        { postbagOwner: { $exists: false } },
        { postbagOwner: "" },
        { postbagOwner: "false" },
      ],
    });
    findQueryCarriers.set({});
    findQueryRecipients.set({});
    findQueryLocations.set({});
    findQueryDeliveryTypes.set({});
    findQueryUsers.set({});
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  fixView() {
    // @FIXME Make more reactive
    if (window.innerWidth <= 960) {
      this.setState({
        listView: false,
        boxView: true,
      });
    }
  }

  handleChangeChips(chips) {
    if (this.state.barcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ barcode: chips }, () => {
      this.searchFunction();
    });
  }

  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips }, () => {
      this.searchFunction();
    });
  }

  handleClientBarcode(chips) {
    if (this.state.clientUniqueBarcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ clientUniqueBarcode: chips }, () => {
      this.searchFunction();
    });
  }
  handleDeleteClientBarcode(chip, index) {
    var chips = this.state.clientUniqueBarcode;
    chips.splice(index, 1);
    this.setState({ clientUniqueBarcode: chips }, () => {
      this.searchFunction();
    });
  }
  // toggle
  renderViewToggle() {
    return (
      <div className="view-toggle clearfix">
        <div>
          <div className="left width90">
            <ChipInput
              label={i18n.__(
                "postbag.Type Client UniqueBarcode(Type and hit enter to add multiple barcodes)"
              )}
              value={this.state.clientUniqueBarcode}
              onChange={(chips) => this.handleClientBarcode(chips)}
              onDelete={(chip, index) =>
                this.handleDeleteClientBarcode(chip, index)
              }
              fullWidth={true}
              allowDuplicates={true}
            />
          </div>
          <div className="right">
            <div className="buttons mt-30">
              <span onClick={this.toggleSearchFilter}>
                <img
                  className="icon-filter"
                  src={`${publicDir}/svg/icon-filter.svg`}
                />
              </span>
              <span onClick={this.toggleBoxView}>
                <img src={`${publicDir}/svg/icon-box.svg`} />
              </span>
              <span onClick={this.toggleListView}>
                <img src={`${publicDir}/svg/icon-list.svg`} />
              </span>
            </div>
          </div>
        </div>
        <div className="fullWidth">
          <ChipInput
            className="width80"
            label={i18n.__(
              "postbag.Type Barcode(Type and hit enter to add multiple barcodes)"
            )}
            value={this.state.barcode}
            onChange={(chips) => this.handleChangeChips(chips)}
            onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
            fullWidth={true}
            allowDuplicates={true}
          />
          <Button
            className="right mt-30 btn-width mob-view"
            onClick={this.clearSearchForm}
            variant="outlined"
          >
            {i18n.__("postrubella.Clear")}
          </Button>
        </div>
      </div>
    );
  }
  //function for clear search form
  clearSearchForm = () => {
    this.setState({
      selectDeliveryUserValue: "",
      selectDeliveryTypeValue: "",
      selectCarrierValue: "",
      selectLocationValue: "",
      selectRecipientValue: "",
      selectItemTypeValue: "",
      dateFromValue: null,
      dateToValue: null,
    });
    this.setState(
      {
        barcode: [],
        clientUniqueBarcode: [],
      },
      this.clearBarcodeField()
    );

    searchParamsVar.set({
      $and: [{ deliveredAt: { $exists: false } }],
      $or: [
        { postbagOwner: { $exists: false } },
        { postbagOwner: "" },
        { postbagOwner: "false" },
      ],
    });
  };
  clearBarcodeField = () => {
    let arrLength = this.state.barcode.length;
    let clientBarcodeArrLength = this.state.clientUniqueBarcode.length;
    this.state.barcode.splice(0, arrLength);
    this.state.clientUniqueBarcode.splice(0, clientBarcodeArrLength);
  };
  toggleListView = () => {
    this.setState({
      listView: true,
      boxView: false,
    });
  };

  toggleBoxView = () => {
    this.setState({
      listView: false,
      boxView: true,
    });
  };

  toggleSearchFilter = () => {
    this.setState({ showSearchFilters: this.state.showSearchFilters !== true });
  };

  searchFunction = () => {
    const searchParams = {};
    searchParams.createdAt = {};
    searchParams.$and = [{ deliveredAt: { $exists: false } }];
    searchParams.$or = [
      { postbagOwner: { $exists: false } },
      { postbagOwner: "" },
      { postbagOwner: "false" },
    ];
    const {
      barcode,
      clientUniqueBarcode,
      selectCarrierValue,
      selectLocationValue,
      selectRecipientValue,
      selectDeliveryUserValue,
      selectDeliveryTypeValue,
      dateFromValue,
      dateToValue,
      selectItemTypeValue,
    } = this.state;
    //create search params
    //barcode
    if (barcode.length) {
      searchParams.barcode = { $in: barcode };
    }
    //client uniqueBarcode
    if (clientUniqueBarcode.length) {
      searchParams.clientUniqueBarcode = { $in: clientUniqueBarcode };
    }
    // carrier
    if (selectCarrierValue !== "" && selectCarrierValue !== undefined) {
      searchParams.carrier = selectCarrierValue;
    } else {
      delete searchParams.carrier;
    }

    //location
    if (selectLocationValue !== "" && selectLocationValue !== undefined) {
      searchParams.location = selectLocationValue;
    } else {
      delete searchParams.location;
    }
    //recipient
    if (selectRecipientValue !== "" && selectRecipientValue !== undefined) {
      searchParams.recipientName = selectRecipientValue;
    } else {
      delete searchParams.recipientName;
    }
    //delivery type
    if (
      selectDeliveryTypeValue !== "" &&
      selectDeliveryTypeValue !== undefined
    ) {
      searchParams.deliveryType = selectDeliveryTypeValue;
    } else {
      delete searchParams.deliveryType;
    }

    //delivery user
    if (
      selectDeliveryUserValue !== "" &&
      selectDeliveryUserValue !== undefined
    ) {
      searchParams.deliveryUser = selectDeliveryUserValue;
    } else {
      delete searchParams.deliveryUser;
    }
    //item type
    if (selectItemTypeValue !== "" && selectItemTypeValue !== undefined) {
      if (selectItemTypeValue === "inbound") {
        searchParams.type = selectItemTypeValue;
      }
      if (selectItemTypeValue === "outbound") {
        searchParams.type = selectItemTypeValue;
      }
    } else {
      delete searchParams.type;
    }

    //from date
    if (dateFromValue) {
      searchParams.createdAt.$gte = dateFromValue;
    }
    //to date
    if (dateToValue) {
      searchParams.createdAt.$lte = dateToValue;
    }
    if (dateFromValue && !dateToValue) {
      searchParams.createdAt.$lte = moment(dateFromValue)
        .tz(timeZone.get())
        .endOf("day")
        .toDate();
    }

    //set params
    searchParamsVar.set(searchParams);
  };

  renderParcels() {
    const list = this.state.list;
    const parcels = this.props.parcels;

    return parcels.map((parcel) => {
      if (this.state.listView === true) {
        return (
          <SelectableParcelRow
            selectAll={this.state.checked}
            key={parcel._id}
            parcel={parcel}
            selectable="true"
            checked={!!list[parcel._id]}
            onChecked={this.onChecked}
            timezone={timeZone.get()}
            isGroupClient={
              this.props.currentClient[0].clientGroupId != undefined
            }
          />
        );
      } else if (this.state.boxView === true) {
        return (
          <SelectableParcel
            key={parcel._id}
            parcel={parcel}
            selectable="true"
            checked={!!list[parcel._id]}
            onChecked={this.onChecked}
            timezone={timeZone.get()}
            isGroupClient={
              this.props.currentClient[0].clientGroupId != undefined
            }
          />
        );
      }
    });
  }

  renderSearchFilters() {
    if (this.state.showSearchFilters === false) return;
    if (this.state.showSearchFilters === true) {
      return (
        <div className="search-filter-container">
          <div className="form-row">
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder={i18n.__("postbag.From date")}
                value={this.state.dateFromValue}
                onChange={() => {}}
                onAccept={(date) => {
                  this.handleDateFromChange(date);
                }}
              />
            </MuiPickersUtilsProvider>
          </div>

          <div className="form-row">
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder={i18n.__("postbag.To date")}
                value={this.state.dateToValue}
                onChange={() => {}}
                onAccept={(date) => {
                  this.handleDateToChange(date);
                }}
              />
            </MuiPickersUtilsProvider>
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("postbag.Choose Location/Company")}
              theme={org_placeholderTheme}
              value={
                this.state.selectLocationValue !== "" &&
                this.state.selectLocationValue !== undefined
                  ? {
                      label: this.state.selectLocationValue,
                      value: this.state.selectLocationValue,
                    }
                  : {
                      label: i18n.__("postbag.Choose Location/Company"),
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
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("postbag.Choose Carrier")}
              theme={org_placeholderTheme}
              value={
                this.state.selectCarrierValue !== "" &&
                this.state.selectCarrierValue !== undefined
                  ? {
                      label: this.state.selectCarrierValue,
                      value: this.state.selectCarrierValue,
                    }
                  : { label: i18n.__("postbag.Choose Carrier"), value: "" }
              }
              isClearable={true}
              isLoading={!this.props.carrierSubscription}
              loadOptions={this.loadCarrierOptions}
              defaultOptions={carrierDefaultOptions.get()}
              onInputChange={this.handleInputChange}
              onChange={this.handleCarrierChange}
              onMenuScrollToBottom={this.scrollMoreCarriers}
            />
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("postbag.Choose Type")}
              theme={org_placeholderTheme}
              value={
                this.state.selectDeliveryTypeValue !== "" &&
                this.state.selectDeliveryTypeValue !== undefined
                  ? {
                      label: this.state.selectDeliveryTypeValue,
                      value: this.state.selectDeliveryTypeValue,
                    }
                  : { label: i18n.__("postbag.Choose Type"), value: "" }
              }
              isClearable={true}
              isLoading={!this.props.deliveryTypeSubscription}
              loadOptions={this.loadDeliverytypeOptions}
              defaultOptions={deliveryTypeDefaultOptions.get()}
              onInputChange={this.handleDeliveryTypeChange}
              onChange={this.handleSelectDeliveryType}
              onMenuScrollToBottom={this.scrollMoreDeliveryTypes}
            />
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("postbag.Choose User/Action")}
              theme={org_placeholderTheme}
              value={
                this.state.selectDeliveryUserValue !== "" &&
                this.state.selectDeliveryUserValue !== undefined
                  ? {
                      label: this.state.selectDeliveryUserValue,
                      value: this.state.selectDeliveryUserValue,
                    }
                  : { label: i18n.__("postbag.Choose User/Action"), value: "" }
              }
              isClearable={true}
              isLoading={!this.props.userSubscription}
              loadOptions={this.loadDeliveryUserOptions}
              defaultOptions={deliveryUserDefaultOptions.get()}
              onInputChange={this.handleDeliveryUserChange}
              onChange={this.handleSelectDeliveryUser}
              onMenuScrollToBottom={this.scrollMoreUsers}
            />
          </div>

          <div className="form-row">
            <select
              name="itemTypes"
              defaultValue=""
              className="input-item-type"
              value={this.state.selectItemTypeValue}
              onChange={this.handleChange}
            >
              <option value="" defaultValue>
                {i18n.__("postbag.Choose Inbound/Outbound")}
              </option>
              <option value="inbound">{i18n.__("postbag.Inbound")}</option>
              <option value="outbound">{i18n.__("postbag.Outbound")}</option>
            </select>
          </div>
          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              placeholder={i18n.__("postbag.Choose Recipient")}
              theme={org_placeholderTheme}
              value={
                this.state.selectRecipientValue !== "" &&
                this.state.selectRecipientValue !== undefined
                  ? {
                      label: this.state.selectRecipientValue,
                      value: this.state.selectRecipientValue,
                    }
                  : { label: i18n.__("postbag.Choose Recipient"), value: "" }
              }
              isClearable={true}
              isLoading={!this.props.recipientSubscription}
              loadOptions={this.loadRecipientOptions}
              defaultOptions={recipientDefaultOptions.get()}
              onInputChange={this.handleRecipientChange}
              onChange={this.handleSelectRecipientChange}
              onMenuScrollToBottom={this.scrollMoreRecipients}
            />
          </div>
        </div>
      );
    }
  }

  onChecked = (id, isChecked) => {
    const { list } = this.state;

    if (!isChecked) {
      delete list[id];
    }
    if (isChecked) {
      list[id] = id;
    }
    this.setState({
      list,
    });
  };

  handleBarcodeClick = () => {
    const promise = new Promise((resolve, reject) => {
      Meteor.startup(() => {
        if (typeof cordova === "undefined") {
          // resolve('You are testing in browser');
          console.log(
            "You can not scan a barcode in the browser. Please try on a device."
          );

          return;
        }
        cordova.plugins.barcodeScanner.scan(
          ({ text }) => resolve(text),
          (error) => {
            reject(new Error()`Scanning failed: ${error.message}`);
          },
          {
            //  "showFlipCameraButton" : true,
            //  "prompt" : "Place a barcode inside the scan area",
            orientation: "portrait",
          }
        );
      });
    });

    promise.then((barcode) => {
      this.setState({ barcode });
    });
    promise.catch((error) => {
      this.setState({ barcode: error });
    });
  };

  renderBottomBar() {
    const countList = Object.keys(this.state.list).length;

    if (countList < 1) {
      return;
    }

    return (
      <div className="postbag">
        <div>
          {i18n.__("postbag.You have")} {countList}
        </div>
        <div className="form-row">
          <Button
            onClick={() => {
              if (this.state.checked) {
                if (
                  confirm(
                    i18n.__(
                      "common.You have selected all the items from the list. Are you sure you want to continue?"
                    )
                  )
                ) {
                  window.location.href = `/add-postbag-confirm/${Object.keys(
                    this.state.list
                  ).join(",")}`;
                }
              } else {
                window.location.href = `/add-postbag-confirm/${Object.keys(
                  this.state.list
                ).join(",")}`;
              }
            }}
            style={{ minWidth: "225px" }}
            color="primary"
            variant="contained"
          >
            {i18n.__("postbag.Add to My Delivery")}
          </Button>
        </div>
      </div>
    );
  }

  renderParcelContainer() {
    if (this.state.boxView === true) {
      return (
        <div className="parcel-container">
          <ul>{this.renderParcels()}</ul>
          <br></br>
          <div className="form-row" align="center">
            {this.loadMoreButton()}
          </div>
        </div>
      );
    }
    if (this.state.listView === true) {
      return (
        <div className="parcel-container">
          {this.props.parcels.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th className="delivery-status">
                    <org_placeholderTriangle className="default" />
                  </th>
                  <th
                    style={{
                      padding: "9px 7px",
                      minWidth: "12px",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      onChange={this.toggleCheckboxes}
                      checked={this.state.checked}
                    />
                  </th>
                  <th>{i18n.__("postbag.Barcode/ID")}</th>
                  <th>{i18n.__("postbag.Carrier")}</th>
                  <th>{i18n.__("postbag.Sender")}</th>
                  <th>{i18n.__("postbag.Action")}</th>
                  {this.props.currentClient[0].clientGroupId != undefined ? (
                    <>
                      <th>{i18n.__("postbag.Destination")}</th>
                      <th>{i18n.__("postbag.Last Processed")}</th>
                    </>
                  ) : null}
                  <th>{i18n.__("postbag.Location")}</th>
                  <th>{i18n.__("postbag.Recipient/Addressee")}</th>
                  <th>{i18n.__("postbag.Received At")}</th>
                  <th>{i18n.__("postbag.Number of Items")}</th>
                  <th>{i18n.__("postbag.Delivered At")}</th>
                  <th>{i18n.__("postbag.Outbound Address")}</th>
                  <th>{i18n.__("postbag.Notes")}</th>
                  <th>{i18n.__("postbag.Scan through x-ray")}</th>
                  <th>{i18n.__("common.Assign user")}</th>
                </tr>
              </thead>
              <tbody>{this.renderParcels()}</tbody>
            </table>
          ) : null}
          <br></br>
          <div className="form-row" align="center">
            {this.loadMoreButton()}
          </div>
        </div>
      );
    }
  }

  loadMoreButton = () => {
    if (this.props.parcels.length < this.props.parcelsTotalLength) {
      return (
        <Button color="primary" onClick={this.LoadMore} variant="contained">
          {" "}
          {i18n.__("postbag.Load More")}
        </Button>
      );
    }
  };

  LoadMore = () => {
    subscriptionLimit.set(subscriptionLimit.get() + LIMIT_INCREMENT);
    limit.set(limit.get() + LIMIT_INCREMENT);
  };

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          onClick={this.handleBarcodeClick}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("postbag.Scan Barcode")}
        </Button>
      </div>
    );
  }

  toggleCheckboxes = () => {
    this.setState({ checked: !this.state.checked });
  };

  render() {
    return (
      <div>
        {!this.props.parcelsListingReady ? (
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

        {this.renderBarcodeScanner()}

        {this.renderViewToggle()}

        {this.renderSearchFilters()}

        {this.renderParcelContainer()}

        {this.renderBottomBar()}
      </div>
    );
  }
}

export default withTracker(() => {
  //subscriptions
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
  const recipientSubscription = Meteor.subscribe(
    "recipients.list.dropdowns",
    recipientsLimit.get(),
    findQueryRecipients.get()
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
  const currentClientSub = Meteor.subscribe("currentClient").ready();
  const parcelSub = Meteor.subscribe("parcelsUndelivered");
  const parcelsListingSub = Meteor.subscribe(
    "parcelsForListing",
    subscriptionLimit.get()
  );

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
        return { value: location._id, label: location.locationName };
      })
  );
  recipientDefaultOptions.set(
    Recipients.find({})
      .fetch()
      .sort((a, b) => (a.recipientName > b.recipientName ? 1 : -1))
      .map((recipient, key) => {
        return { value: recipient._id, label: recipient.recipientName };
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
  deliveryUserDefaultOptions.set(
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
    locations: Locations.find(query).fetch(),
    recipients: Recipients.find(query).fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    currentClient: Clients.find().fetch(),
    parcels: Parcels.find(searchParamsVar.get(), {
      limit: limit.get(),
    }).fetch(),
    parcelsTotalLength: Parcels.find(searchParamsVar.get()).count(),
    parcelsReady: parcelSub.ready(),
    parcelsListingReady: parcelsListingSub.ready(),
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    recipientSubscription: recipientSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(AddToPostbag);
