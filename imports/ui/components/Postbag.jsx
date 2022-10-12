import React, { Component } from "react";
import moment from "moment-timezone";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import Button from "@material-ui/core/Button";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/moment";
import ChipInput from "material-ui-chip-input";
import AsyncSelect from "react-select/async";
import { Parcels } from "/imports/api/parcels.js";
import SelectableParcel from "/imports/ui/components/SelectableParcel.jsx";
import SelectableParcelRow from "/imports/ui/components/SelectableParcelRow.jsx";
import Carriers from "/imports/api/carriers.js";
import { Locations } from "/imports/api/locations.js";
import { DeliveryTypes } from "/imports/api/deliveryTypes.js";
import { Clients } from "/imports/api/clients.js";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import "/imports/languages/en/en.postbag.i18n.yml";
import "/imports/languages/de/de.postbag.i18n.yml";
import "/imports/languages/en-JM/en-JM.postbag.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
const searchParamsVar = new ReactiveVar({});
var Limit = 10;
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
class Postbag extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      list: {},
      barcode: [],
      clientUniqueBarcode: [],
      selectCarrierValue: "",
      selectLocationValue: "",
      selectRecipient: undefined,
      selectDeliveryUserValue: undefined,
      selectDeliveryTypeValue: undefined,
      selectDeliveryStatusValue: undefined,
      dateFromValue: null,
      dateToValue: null,
      listView: true,
      boxView: false,
      showSearchFilters: false,

      checked: false,
    };
    this.list = {};
  }
  //load more functions for dropdowns
  scrollMoreCarriers = () => {
    carriersLimit.set(carriersLimit.get() + Limit);
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

  handledeliveryStatusChange = (event) => {
    this.setState({ selectDeliveryStatusValue: event.target.value }, () => {
      this.searchFunction();
    });
  };
  handleDateFromChange = (dateFromValue) => {
    dateFromValue = moment(dateFromValue).startOf("day").toDate();
    this.setState({ dateFromValue }, () => {
      this.searchFunction();
    });
  };
  handleDateToChange = (dateToValue) => {
    dateToValue = moment(dateToValue).endOf("day").toDate();
    this.setState({ dateToValue }, () => {
      this.searchFunction();
    });
  };
  componentDidMount() {
    this._isMounted = true;
    findQueryCarriers.set({});
    findQueryLocations.set({});
    findQueryDeliveryTypes.set({});
    findQueryUsers.set({});
    // @FIXME Make more reactive
    if (window.innerWidth <= 960) {
      this.setState({
        listView: false,
        boxView: true,
        showSearchFilters: true,
      });
    }
    const postbagOwner = Meteor.userId();
    searchParamsVar.set({
      postbagOwner: postbagOwner,
      createdAt: {},
      deliveredAt: { $exists: false },
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  renderDeliveryTypes() {
    return this.props.deliveryTypes.map((deliveryType) => (
      <option key={deliveryType._id}>{deliveryType.deliveryTypeName}</option>
    ));
  }
  renderUsers() {
    return this.props.allUsers.map((user) => (
      <option key={user._id}>{user.username}</option>
    ));
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
  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips }, () => {
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
      selectDeliveryStatusValue: "",
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

    const postbagOwner = Meteor.userId();
    searchParamsVar.set({
      postbagOwner: postbagOwner,
      createdAt: {},
      deliveredAt: { $exists: false },
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
    if (this.state.showSearchFilters === true) {
      this.setState({ showSearchFilters: false });
    }
    if (this.state.showSearchFilters === false) {
      this.setState({ showSearchFilters: true });
    }
  };

  searchFunction = () => {
    const {
      barcode,
      clientUniqueBarcode,
      selectCarrierValue,
      selectRecipient,
      selectLocationValue,
      selectDeliveryUserValue,
      selectDeliveryTypeValue,
      dateFromValue,
      dateToValue,
      selectDeliveryStatusValue,
    } = this.state;

    const postbagOwner = Meteor.userId();

    const searchParams = {
      postbagOwner: postbagOwner,
      createdAt: {},
      deliveredAt: { $exists: false },
    };

    if (barcode.length) {
      searchParams.barcode = { $in: barcode };
    }
    if (clientUniqueBarcode.length) {
      searchParams.clientUniqueBarcode = { $in: clientUniqueBarcode };
    }
    if (selectCarrierValue) {
      searchParams.carrier = selectCarrierValue;
    }
    if (selectRecipient) {
      searchParams.recipientName = selectRecipient;
    }
    if (selectLocationValue) {
      searchParams.location = selectLocationValue;
    }
    if (selectDeliveryTypeValue) {
      searchParams.deliveryType = selectDeliveryTypeValue;
    }
    if (selectDeliveryUserValue) {
      searchParams.deliveryUser = selectDeliveryUserValue;
    }
    if (selectDeliveryStatusValue == "delivered") {
      searchParams.deliveredAt = { $exists: true, $ne: null };
    } else {
      searchParams.deliveredAt = { $exists: false };
    }

    if (dateFromValue) {
      searchParams.createdAt.$gte = dateFromValue;
    }
    if (dateFromValue && !dateToValue) {
      searchParams.createdAt.$lte = moment(dateFromValue)
        .tz(timeZone.get())
        .endOf("day")
        .toDate();
    }
    if (dateToValue) {
      searchParams.createdAt.$lte = dateToValue;
    }

    searchParamsVar.set(searchParams);
  };

  renderParcels() {
    const list = this.state.list;

    const allParcels = this.props.parcels;

    return allParcels.map((parcel) => {
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
      }
      if (this.state.boxView === true) {
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
  removeFromPostbag = (event) => {
    event.preventDefault();
    const { list } = this.state;
    const parcelIds = Object.keys(this.state.list);

    parcelIds.forEach((parcelId) => {
      Parcels.update(parcelId, {
        $set: { postbagOwner: "" },
      });
      delete list[parcelId];
    });
    this.setState({
      list,
    });
    alert(i18n.__("postbag.Removed from My Delivery"));
    FlowRouter.go("/postbag");
  };

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
              name="deliveryTypes"
              defaultValue=""
              value={this.state.selectDeliveryStatusValue}
              onChange={this.handledeliveryStatusChange}
            >
              <option value="" defaultValue>
                {i18n.__("postbag.Choose status")}
              </option>
              <option value="delivered">{i18n.__("postbag.Delivered")}</option>
              <option value="undelivered">
                {i18n.__("postbag.Undelivered")}
              </option>
            </select>
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

  handleClick() {
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
          ({ text }) => resolve(text),
          (error) => {
            reject(new Error(`Scanning failed: ${error.message}`));
          },
          {
            //  "showFlipCameraButton" : true,
            //  "prompt" : "Place a barcode inside the scan area",
            orientation: "portrait",
          }
        );
      });
    });

    const self = this;

    value.then((barcode) => {
      self.setState({ barcode });
    });
    value.catch((error) => {
      self.setState({ barcode: error });
    });
  }

  renderParcelContainer() {
    if (this.state.boxView === true) {
      return (
        <div className="parcel-container">
          <ul>{this.renderParcels()}</ul>
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
                    <input type="checkbox" onChange={this.toggleCheckboxes} />
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
        </div>
      );
    }
  }

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
            color="primary"
            variant="contained"
            onClick={() => {
              if (this.state.checked) {
                if (
                  confirm(
                    i18n.__(
                      "common.You have selected all the items from the list. Are you sure you want to continue?"
                    )
                  )
                ) {
                  window.location.href = `/postbag-confirm/${Object.keys(
                    this.state.list
                  ).join(",")}?redirect_url=postbag`;
                }
              } else {
                window.location.href = `/postbag-confirm/${Object.keys(
                  this.state.list
                ).join(",")}?redirect_url=postbag`;
              }
            }}
            style={{ minWidth: "245px" }}
          >
            {i18n.__("postbag.Deliver Parcel(s)")}
          </Button>
        </div>
        <div className="form-row">
          <Button
            color="primary"
            variant="contained"
            onClick={this.removeFromPostbag}
            style={{ minWidth: "245px" }}
          >
            {i18n.__("postbag.Remove from My Delivery")}
          </Button>
        </div>
      </div>
    );
  }

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          color="primary"
          variant="contained"
          fullWidth={true}
          onClick={() => this.handleClick()}
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
        {!this.props.parcelsReady ? (
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
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    parcels: Parcels.find(searchParamsVar.get()).fetch(),
    currentClient: Clients.find().fetch(),
    parcelsReady: parcelSub.ready(),
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(Postbag);
