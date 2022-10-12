import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment-timezone";
import _ from "lodash";
import { ReactMultiEmail, isEmail } from "react-multi-email2";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/moment";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ParcelDelivered from "/imports/ui/ParcelDelivered.jsx";
import ParcelDeliveredRow from "/imports/ui/ParcelDeliveredRow.jsx";
import ReportsChart from "/imports/ui/ReportsChart.jsx";
import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import IconSettings from "/imports/ui/components/icons/IconSettings";
import Modal from "@material-ui/core/Modal";
import Box from "@material-ui/core/Box";
import CustomSLATimeSlotsForm from "/imports/ui/components/CustomSLATimeSlotsForm";
import { Chart } from "react-google-charts";
import AsyncSelect from "react-select/async";
import { decode } from "html-entities";
import {
  Clients,
  DeliveryTypes,
  Locations,
  Carriers,
  Parcels,
} from "../../api";
import "/imports/languages/en/en.report.i18n.yml";
import "/imports/languages/de/de.report.i18n.yml";
import "/imports/languages/en-JM/en-JM.report.i18n.yml";

var svgToImage = require("save-svg-as-png");

const publicDir = `${Meteor.settings.public.cdn}/public`;
const LIMIT_INCREMENT = 9;
const staticDeliveryTypes = [{ value: "Normal", label: "Normal" }];
const staticAssignActions = [
  { value: "Collect from postrubella", label: "Collect from postrubella" },
  { value: "Reception", label: "Reception" },
  { value: "Security", label: "Security" },
  { value: "Delivery AM", label: "Delivery AM" },
  { value: "Delivery PM", label: "Delivery PM" },
  { value: "Delivered Today", label: "Delivered Today" },
];
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
var limit = new ReactiveVar(0);
var subscriptionLimit = new ReactiveVar(10);
var toDate = new ReactiveVar(moment().endOf("day").toDate());
var fromDate = new ReactiveVar(
  moment().subtract(90, "day").startOf("day").toDate()
);
var maxFromDateRange = moment().subtract(1, "years").startOf("day").toDate();
var maxToDateRange = moment().endOf("day").toDate();
var searchParams = new ReactiveVar({
  $or: [
    { createdAt: { $gte: fromDate.get(), $lte: toDate.get() } },
    { deliveredAt: { $gte: fromDate.get(), $lte: toDate.get() } },
  ],
});

var indexlist = new ReactiveVar([]);

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

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/gi, "\\$&");
}

class ReportsPage extends Component {
  BOX_VIEW = "box";
  LIST_VIEW = "list";
  CHART_VIEW = "chart";
  PIE_VIEW = "PIE";

  constructor(props) {
    super(props);

    this.state = {
      barcode: "",
      selectCarrierValue: "",
      selectLocationValue: "",
      selectDeliveryUserValue: undefined,
      selectDeliveryTypeValue: undefined,
      selectDeliveryStatusValue: undefined,
      selectItemTypeValue: undefined,
      dateFromValue: null,
      dateToValue: null,
      maxToDateRange: null,
      maxFromDateRange: null,
      parcelsView: this.BOX_VIEW,
      showSearchFilters: true,
      slareportArray: undefined,
      emails: [],
      isSendEmail: 0,
      successMsg: "",
      totalData: 0,
      chartData: [],
      slaSlots: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
      ],
      openCustomSLAForm: false,
      slaReportData: [],
      parcelslength: 0,
      parcelsLength: 0,
      parcelReady: false,
      reportInProgress: false,
      slaReady: false,
      lineChartReady: false,
      deliverySeparator: false,
      inOutSeparator: false,
      sourceSeparator: false,
      options: "",
      chartDataFiltered: [],
    };
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
  // dropdown handles
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
    this.setState({ selectCarrierValue: selectedOption });
    //set search params
    searchParams.set(this.getSearchParams());
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
    this.setState({ selectLocationValue: selectedOption });
    //set search params
    searchParams.set(this.getSearchParams());
  };

  generateCustomSLA = (slots = []) => {
    this.setState({ slaSlots: slots, openCustomSLAForm: false }, () =>
      this.runReport()
    );
  };

  loadDeliverytypeOptions = (inputValue, callback) => {
    let deliveryTypesOptions = staticDeliveryTypes.concat(
      this.props.deliveryTypes.map((deliveryType, key) => {
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
    this.setState({ selectDeliveryTypeValue: selectedOption });
    //set search params
    searchParams.set(this.getSearchParams());
  };
  loadDeliveryUserOptions = (inputValue, callback) => {
    let assignActionOptions = staticAssignActions.concat(
      this.props.allUsers.map((user, key) => {
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
    this.setState({ selectDeliveryUserValue: selectedOption });
    //set search params
    searchParams.set(this.getSearchParams());
  };

  handledeliveryStatusChange = (event) => {
    this.setState({ selectDeliveryStatusValue: event.target.value });
    if (event.target.value) {
      this.setState({ deliverySeparator: false });
    }
    searchParams.set(this.getSearchParams());
  };

  handleChange = (event) => {
    this.setState({ barcode: event.target.value });
    searchParams.set(this.getSearchParams());
  };

  handledeliveryStatusChange = (event) => {
    this.setState({ selectDeliveryStatusValue: event.target.value });
    if (event.target.value) {
      this.setState({ deliverySeparator: false });
    }
    searchParams.set(this.getSearchParams());
  };
  handleDateFromChange = (dateFromValue) => {
    var dateFromValueFormatted = moment(dateFromValue).startOf("day").toDate();
    this.setState({ dateFromValue: dateFromValueFormatted });
    fromDate.set(dateFromValueFormatted);
    //set search params
    searchParams.set(this.getSearchParams());
  };
  handleDateToChange = (dateToValue) => {
    var dateToValueFormatted = moment(dateToValue).endOf("day").toDate();
    var maxFromDateRangeFormatted = moment(dateToValue)
      .subtract(1, "years")
      .startOf("day")
      .toDate();
    this.setState({
      dateToValue: dateToValueFormatted,
      maxFromDateRange: maxFromDateRangeFormatted,
    });
    toDate.set(dateToValueFormatted);
    // set search params
    searchParams.set(this.getSearchParams());
  };
  handleItemTypeChange = (event) => {
    this.setState({ selectItemTypeValue: event.target.value });
    if (event.target.value) {
      this.setState({ inOutSeparator: false });
    }
    searchParams.set(this.getSearchParams());
  };
  handleSenderChange = (event) => {
    searchParams.set(this.getSearchParams());
  };
  handleRecipientChange = (event) => {
    searchParams.set(this.getSearchParams());
  };

  componentDidMount() {
    // @FIXME Make more reactive
    if (window.innerWidth <= 960) {
      this.setBoxView();
    }
    //set search query for dropdowns
    findQueryCarriers.set({});
    findQueryLocations.set({});
    findQueryDeliveryTypes.set({});
    findQueryUsers.set({});
    toDate.set(moment().endOf("day").toDate());
    fromDate.set(moment().subtract(90, "day").startOf("day").toDate());
    maxFromDateRange = moment().subtract(1, "years").startOf("day").toDate();
    maxToDateRange = moment().endOf("day").toDate();
    this.setState({
      dateFromValue: fromDate.get(),
      dateToValue: toDate.get(),
      maxFromDateRange: maxFromDateRange,
      maxToDateRange: maxToDateRange,
    });
  }

  loadMoreItems = () => {
    subscriptionLimit.set(subscriptionLimit.get() + LIMIT_INCREMENT);
    limit.set(limit.get() + LIMIT_INCREMENT);
  };

  componentWillUnmount() {}

  addEmailForm() {
    const { emails } = this.state;
    return (
      <div>
        <div className="col-md-12">
          <div className="margin-bottom-10">
            <h5 className="fullwidthcls">{i18n.__("report.Email to")}</h5>
          </div>

          <ReactMultiEmail
            className="bg-transparent"
            placeholder={i18n.__("report.Email Address")}
            emails={emails}
            onChange={(_emails) => {
              this.setState({ emails: _emails });
            }}
            validateEmail={(email) => {
              return isEmail(email); // return boolean
            }}
            getLabel={(email, index, removeEmail) => {
              return (
                <div data-tag key={index}>
                  {email}
                  <span data-tag-handle onClick={() => removeEmail(index)}>
                    {" "}
                    ×{" "}
                  </span>
                </div>
              );
            }}
          />
        </div>
        <div className="mt2 clearfix submit-options-buttons">
          <div className="form-row col col-8">
            <Button
              onClick={() => {
                this.emailSLAReportHandler(this.state.emails);
              }}
              variant="contained"
              color="primary"
              disabled={!this.state.parcelReady}
            >
              {i18n.__("report.Send Email")}
            </Button>
          </div>
        </div>
      </div>
    );
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

  // toggle
  renderViewToggle() {
    return (
      <div className="view-toggle clearfix">
        <div className="left search-inline">
          <input
            type="text"
            className="margin-right-15"
            placeholder={i18n.__("report.Scan / Type org_placeholder Barcode")}
            value={this.state.barcode}
            onChange={this.handleChange}
          />
          <select
            className="margin-right-15"
            onChange={this.toggleSearchFilter}
          >
            <option value="show">{i18n.__("report.Show Search")}</option>
            <option value="hide">{i18n.__("report.Hide Search")}</option>
          </select>
          <Button
            onClick={this.clearSearchForm}
            variant="outlined"
            color="default"
          >
            {i18n.__("report.Clear")}
          </Button>
        </div>

        <div className="right">
          <div className="buttons">
            <span onClick={this.setBoxView} title={i18n.__("report.box view")}>
              <img
                alt={i18n.__("report.box view")}
                src={`${publicDir}/svg/point-icon.png`}
              />
            </span>
            <span
              onClick={this.setListView}
              title={i18n.__("report.list view")}
            >
              <img
                alt={i18n.__("report.list view")}
                src={`${publicDir}/svg/bullets_icon.png`}
              />
            </span>
            <span
              onClick={this.setChartView}
              title={i18n.__("report.chart view")}
            >
              <img
                alt={i18n.__("report.chart view")}
                src={`${publicDir}/svg/line_chart_icon.png`}
              />
            </span>
            <span
              onClick={this.setPieView}
              title={i18n.__("report.SLA Report")}
            >
              <img
                alt={i18n.__("report.SLA Report")}
                src={`${publicDir}/svg/chart_icon.png`}
              />
            </span>
          </div>
        </div>
      </div>
    );
  }

  setView = (parcelsView) => this.setState({ parcelsView });
  setBoxView = () => this.setView(this.BOX_VIEW);
  setListView = () => this.setView(this.LIST_VIEW);
  setChartView = () => this.setView(this.CHART_VIEW);
  setPieView = () => this.setView(this.PIE_VIEW);
  toggleSearchFilter = () =>
    this.setState({ showSearchFilters: !this.state.showSearchFilters });

  changeDeliverySeparator = async ({ target }) => {
    await new Promise((resolve) =>
      this.setState({ deliverySeparator: target.checked }, () =>
        resolve(this.generateLineChartData())
      )
    );
  };
  changeInOutSeparator = async ({ target }) => {
    await new Promise((resolve) =>
      this.setState({ inOutSeparator: target.checked }, () =>
        resolve(this.generateLineChartData())
      )
    );
  };
  changeSourceSeparator = async ({ target }) => {
    await new Promise((resolve) =>
      this.setState({ sourceSeparator: target.checked }, () =>
        resolve(this.generateLineChartData())
      )
    );
  };

  //function to call line-chart api on state update
  generateLineChartData = async () => {
    const deliverySeparator = this.state.deliverySeparator;
    const inOutSeparator = this.state.inOutSeparator;
    const sourceSeparator = this.state.sourceSeparator;
    const chartArray = this.state.chartData;

    //set columns to display

    if (
      deliverySeparator === false &&
      inOutSeparator === false &&
      sourceSeparator === false
    ) {
      indexlist.set([0, 9]);
    }
    if (
      deliverySeparator === true &&
      inOutSeparator === true &&
      sourceSeparator === true
    ) {
      indexlist.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
    if (
      deliverySeparator == false &&
      inOutSeparator == true &&
      sourceSeparator == true
    ) {
      indexlist.set([0, 5, 6, 7, 8]);
    }
    if (
      deliverySeparator == false &&
      inOutSeparator == false &&
      sourceSeparator == true
    ) {
      indexlist.set([0, 12, 13]);
    }
    if (
      deliverySeparator == true &&
      inOutSeparator == true &&
      sourceSeparator == false
    ) {
      indexlist.set([0, 10, 11, 16, 17]);
    }
    if (
      deliverySeparator == true &&
      inOutSeparator == false &&
      sourceSeparator == true
    ) {
      indexlist.set([0, 12, 13, 18, 19]);
    }
    if (
      deliverySeparator == true &&
      inOutSeparator == false &&
      sourceSeparator == false
    ) {
      indexlist.set([0, 14, 15]);
    }
    if (
      deliverySeparator == false &&
      inOutSeparator == true &&
      sourceSeparator == false
    ) {
      indexlist.set([0, 10, 11]);
    }
    // chartDataFiltered.set(this.filterChartArray(chartArray, indexlist.get()))
    let thisComponent = this;
    await new Promise((resolve) =>
      this.filterChartArray(chartArray, indexlist.get()).then((result) => {
        // chartDataFiltered.set(result)
        thisComponent.setState({ chartDataFiltered: result });
      })
    );
  };

  //array for filtering chartData
  filterChartArray = async (chartArray, indexlist) => {
    return chartArray.map(function (array) {
      return indexlist.map(function (idx) {
        return array[idx];
      });
    });
  };
  //function for clear search form
  clearSearchForm = () => {
    this.setState({
      selectDeliveryUserValue: "",
      selectDeliveryTypeValue: "",
      selectCarrierValue: "",
      selectLocationValue: "",
      dateFromValue: moment().subtract(90, "day").startOf("day").toDate(),
      dateToValue: moment().endOf("day").toDate(),
      barcode: "",
      selectItemTypeValue: "",
      selectDeliveryStatusValue: "",
    });

    this.inputRecipient.state.value = "";
    this.inputSender.state.value = "";
    // set search params
    searchParams.set(this.getSearchParams());
  };

  renderSearchFilters() {
    if (this.state.showSearchFilters === true) {
      return (
        <div className="search-filter-container">
          <div className="form-row">
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder={i18n.__("report.From date")}
                value={this.state.dateFromValue}
                onChange={() => {}}
                onAccept={(date) => {
                  this.handleDateFromChange(date);
                }}
                maxDate={this.state.dateToValue}
                minDate={this.state.maxFromDateRange}
              />
            </MuiPickersUtilsProvider>
          </div>

          <div className="form-row">
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder={i18n.__("report.To date")}
                value={this.state.dateToValue}
                onChange={() => {}}
                onAccept={(date) => {
                  this.handleDateToChange(date);
                }}
                minDate={this.state.dateFromValue}
                maxDate={this.state.maxToDateRange}
              />
            </MuiPickersUtilsProvider>
          </div>

          <div className="form-row">
            <AsyncSelect
              theme={org_placeholderTheme}
              cacheOptions={false}
              placeholder={i18n.__("report.Choose Location/Company")}
              value={
                this.state.selectLocationValue !== "" &&
                this.state.selectLocationValue !== undefined
                  ? {
                      label: this.state.selectLocationValue,
                      value: this.state.selectLocationValue,
                    }
                  : {
                      label: i18n.__("report.Choose Location/Company"),
                      value: "",
                    }
              }
              isLoading={!this.props.locationSubscription}
              isClearable={true}
              loadOptions={this.loadLocationOptions}
              defaultOptions={locationDefaultOptions.get()}
              onInputChange={this.handleLocationChange}
              onChange={this.handleSelectLocationChange}
              onMenuScrollToBottom={this.scrollMoreLocations}
            />
          </div>

          <div className="form-row">
            <InputAutosuggest
              getValue={(obj) => obj.senderName}
              url="autocomplete.senders"
              placeholder={i18n.__("report.Type a sender")}
              ref={(ref) => {
                this.inputSender = ref;
              }}
              onChange={this.handleSenderChange}
            />
          </div>

          <div className="form-row">
            <InputAutosuggest
              getValue={(obj) => obj.recipientName}
              url="autocomplete.recipients"
              placeholder={i18n.__("report.Type a recipient")}
              ref={(ref) => {
                this.inputRecipient = ref;
              }}
              onChange={this.handleRecipientChange}
            />
          </div>

          <div className="form-row">
            <AsyncSelect
              cacheOptions={false}
              theme={org_placeholderTheme}
              placeholder={i18n.__("report.Choose carrier")}
              value={
                this.state.selectCarrierValue !== "" &&
                this.state.selectCarrierValue !== undefined
                  ? {
                      label: this.state.selectCarrierValue,
                      value: this.state.selectCarrierValue,
                    }
                  : { label: i18n.__("report.Choose carrier"), value: "" }
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
              theme={org_placeholderTheme}
              cacheOptions={false}
              placeholder={i18n.__("report.Choose type")}
              value={
                this.state.selectDeliveryTypeValue !== "" &&
                this.state.selectDeliveryTypeValue !== undefined
                  ? {
                      label: this.state.selectDeliveryTypeValue,
                      value: this.state.selectDeliveryTypeValue,
                    }
                  : { label: i18n.__("report.Choose type"), value: "" }
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
              theme={org_placeholderTheme}
              cacheOptions={false}
              placeholder={i18n.__("report.Choose User/Action")}
              value={
                this.state.selectDeliveryUserValue !== "" &&
                this.state.selectDeliveryUserValue !== undefined
                  ? {
                      label: this.state.selectDeliveryUserValue,
                      value: this.state.selectDeliveryUserValue,
                    }
                  : { label: i18n.__("report.Choose User/Action"), value: "" }
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
                {i18n.__("report.Choose status")}
              </option>
              <option value="delivered">{i18n.__("report.Delivered")}</option>
              <option value="undelivered">
                {i18n.__("report.Undelivered")}
              </option>
            </select>
          </div>

          <div className="form-row">
            <select
              name="itemTypes"
              defaultValue=""
              value={this.state.selectItemTypeValue}
              onChange={this.handleItemTypeChange}
            >
              <option value="" defaultValue>
                {i18n.__("report.Choose Inbound/Outbound")}
              </option>
              <option value="inbound">{i18n.__("report.Inbound")}</option>
              <option value="outbound">{i18n.__("report.Outbound")}</option>
            </select>
          </div>

          <div className="mt2 clearfix submit-options-buttons">
            <div className="form-row col col-4">
              <Button
                onClick={this.resetSLAandRunReport}
                variant="contained"
                color="primary"
                fullWidth={true}
                disabled={!this.props.parcelsSub}
                title={
                  !this.props.parcelsSub
                    ? i18n.__("report.Data is loading please wait")
                    : ""
                }
              >
                {decode(i18n.__("report.Generate & Show Report"))}
              </Button>
            </div>

            <div className="form-row col col-4 middle">
              {this.props.parcelsSub ? (
                <Button
                  variant="contained"
                  fullWidth={true}
                  color="primary"
                  title={
                    !this.state.parcelReady
                      ? i18n.__("report.Please generate the report")
                      : ""
                  }
                  disabled={!this.state.parcelReady}
                  onClick={_.debounce(this.generateReport, 300)}
                >
                  {i18n.__("report.Email Report")}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth={true}
                  disabled={true}
                >
                  Email Report
                </Button>
              )}
            </div>

            <div className="form-row col col-4">
              {this.props.parcelsSub ? (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth={true}
                  title={
                    !this.state.parcelReady
                      ? i18n.__("report.Please generate the report")
                      : ""
                  }
                  disabled={!this.state.parcelReady}
                  onClick={_.debounce(this.emailCSV, 300)}
                >
                  {i18n.__("report.Email CSV")}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth={true}
                  disabled={true}
                >
                  {i18n.__("report.Email CSV")}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  emailSLAReportHandler = async (emails) => {
    if (emails.length < 1) {
      alert("Please enter emails.");
      return;
    }

    var rootElement = document.getElementById("piechartcls");
    let parcelDeliver = this.state.slaReportData;
    let slaSlots = this.state.slaSlots;
    let thisComponent = this;
    var fromDatevalue = this.state.dateFromValue.toString();
    var toDateValue = this.state.dateToValue.toString();
    thisComponent.setState({ reportInProgress: true });
    let reportSvg =
      rootElement.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
        .childNodes[0].childNodes[0].childNodes[0];

    svgToImage.svgAsPngUri(reportSvg).then((dataUrl) => {
      let Params = {
        dataUrl,
        emails,
        parcelDeliver,
        slaSlots,
        clientId: Meteor.user().profile.clientId,
        dateFromRequested: fromDatevalue,
        dateToRequested: toDateValue,
      };

      Meteor.call("email-sla-report", Params, function (err, res) {
        if (res) {
          let message = i18n.__(
            "report.Your SLA report has been emailed to selected email address"
          );
          thisComponent.setState({
            emails: [],
            isSendEmail: 0,
            successMsg: message,
            reportInProgress: false,
          });
        }
      });
    });

    //hide success message
    setTimeout(
      function () {
        thisComponent.setState({
          successMsg: "",
        });
      }.bind(this),
      5000
    );
  };

  renderParcelContainer() {
    //generate the report alert
    if (!this.state.parcelReady) {
      return (
        <div className="center">
          <b>
            {decode(
              i18n.__(
                "report.Please click `Generate & show report` to display your search criteria. You must ensure you have provided start and end dates"
              )
            )}
          </b>
        </div>
      );
    }

    //if no records found
    if (this.props.parcels.length == 0) {
      return (
        <div className="center">
          <b>{i18n.__("report.No records found")}</b>
        </div>
      );
    }

    if (this.state.parcelsView === this.PIE_VIEW) {
      let thisComponent = this;
      const graphStyle = {
        display: "inline-block",
        width: "60%",
        float: "left",
      };

      if (this.state.slaReady) {
        return (
          <div className="row">
            <div
              className="center col-lg-6 col-md-6 col-sm-12 graphclass"
              style={graphStyle}
              id="capture"
            >
              <div id="piechartcls">
                <ul>
                  <Chart
                    width={"550px"}
                    height={"370px"}
                    chartType="PieChart"
                    loader={
                      <div>
                        <b>
                          <span style={{ color: "red" }}>
                            {decode(
                              i18n.__(
                                "report.The chart is loading, Please do not send emails while complete load the chart"
                              )
                            )}
                          </span>
                        </b>
                      </div>
                    }
                    data={[
                      ["Task", "Parcels diliver"],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[0].from +
                          "-" +
                          this.state.slaSlots[0].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[1],
                      ],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[1].from +
                          "-" +
                          this.state.slaSlots[1].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[2],
                      ],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[2].from +
                          "-" +
                          this.state.slaSlots[2].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[3],
                      ],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[3].from +
                          "-" +
                          this.state.slaSlots[3].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[4],
                      ],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[4].from +
                          "-" +
                          this.state.slaSlots[4].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[5],
                      ],
                      [
                        i18n.__("report.Post delivered in") +
                          " " +
                          this.state.slaSlots[5].from +
                          "-" +
                          this.state.slaSlots[5].to +
                          " " +
                          i18n.__("report.hours"),
                        this.state.slaReportData[6],
                      ],
                      [
                        i18n.__("report.Post delivered in 12+ hours"),
                        this.state.slaReportData[12],
                      ],
                      [
                        i18n.__("report.Undelivered Parcels"),
                        this.state.slaReportData[13],
                      ],
                    ]}
                    options={{
                      title: "SLA Report",
                      is3D: true,
                    }}
                    rootProps={{ "data-testid": "1" }}
                  />
                </ul>
                <div id="new element"></div>
              </div>
              <table className="syncDetails">
                <tbody>
                  <tr>
                    <td>{i18n.__("report.Total Posts")}</td>
                    <td>{this.state.parcelsLength}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="send_graph_email">
              <div className="successmsg relative-position">
                {thisComponent.state.successMsg}
              </div>
              <div className="mt2 clearfix submit-options-buttons report_mail">
                <div className="form-row col col-12 full-width">
                  <Button
                    variant="contained"
                    color="primary"
                    className="fullwidthcls"
                    onClick={() => {
                      if (
                        window.confirm(
                          i18n.__("report.Are you sure to send mail to client?")
                        )
                      ) {
                        this.emailSLAReportHandler([
                          Meteor.user().emails[0].address,
                        ]);
                      }
                    }}
                  >
                    {i18n.__("report.Email SLA Report to client")}
                  </Button>
                </div>
                <div className="form-row col col-7 full-width">
                  {thisComponent.addEmailForm()}
                </div>
              </div>
            </div>

            <IconButton
              onClick={() => this.setState({ openCustomSLAForm: true })}
              style={{
                height: "25px",
                padding: 0,
                margin: "6px",
                display: "block",
              }}
            >
              <IconSettings viewBox="0 0 18 18" />
              <p className="h5 mt2">
                {i18n.__("report.Click here for custom SLA report")}
              </p>
            </IconButton>

            <Modal open={this.state.openCustomSLAForm}>
              <div className="clearfix">
                <div className="col col-12">
                  <Box className="bg-white p4">
                    <div className="col col-12">
                      <IconButton
                        className="right"
                        onClick={() =>
                          this.setState({ openCustomSLAForm: false })
                        }
                      >
                        <CloseIcon fontSize="large" />
                      </IconButton>
                    </div>
                    {/* custom SLA start  */}
                    <CustomSLATimeSlotsForm
                      generateCustomSLA={this.generateCustomSLA}
                    />
                    {/* custom SLA end  */}
                  </Box>
                </div>
              </div>
            </Modal>
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
              <b>
                {i18n.__(
                  "report.Please wait while your report is being processed Do not close the window while processing the report"
                )}
              </b>
            </div>
          </div>
        );
      }
    }

    if (this.state.parcelsView === this.BOX_VIEW) {
      const { selectItemTypeValue } = this.state;
      return (
        <div>
          <ul>
            {this.props.parcels.map((parcel) => (
              <ParcelDelivered
                key={parcel._id}
                parcel={parcel}
                postType={selectItemTypeValue}
                timezone={timeZone.get()}
              />
            ))}
          </ul>
          {this.props.searchParcels.length > this.props.parcels.length ? (
            <div className="form-row" align="center">
              <div className="margin-bottom-65">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.LoadMoreReport}
                >
                  {i18n.__("report.Load More")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* show loader while subscription load data */}
          {!this.props.parcelsSub ? (
            <div>
              <b>{i18n.__("report.Loading")}</b>
            </div>
          ) : (
            <div> </div>
          )}
        </div>
      );
    }
    if (this.state.parcelsView === this.CHART_VIEW) {
      let totalData = this.state.totalData;

      let chartData = this.state.chartDataFiltered;
      let options = this.state.options;
      const checkboxStyle = {
        display: "inline-block",
        width: "auto",
        margin: "0 20px",
      };
      const iconStyle = {
        right: 0,
      };
      const checkboxLabelStyle = {
        color: "#111",
        textAlign: "left",
        width: "auto",
      };

      if (this.state.lineChartReady) {
        return (
          <div className="center">
            <FormControlLabel
              control={
                <Checkbox
                  labelstyle={checkboxLabelStyle}
                  iconstyle={iconStyle}
                  style={checkboxStyle}
                  color="primary"
                  onChange={this.changeDeliverySeparator}
                  checked={
                    this.state.deliverySeparator &&
                    !this.state.selectDeliveryStatusValue
                  }
                  disabled={!!this.state.selectDeliveryStatusValue}
                />
              }
              label={i18n.__("report.Delivery status")}
              labelPlacement="start"
            />

            <FormControlLabel
              control={
                <Checkbox
                  labelstyle={checkboxLabelStyle}
                  iconstyle={iconStyle}
                  style={checkboxStyle}
                  color="primary"
                  onChange={this.changeInOutSeparator}
                  checked={
                    this.state.inOutSeparator && !this.state.selectItemTypeValue
                  }
                  disabled={!!this.state.selectItemTypeValue}
                />
              }
              label={i18n.__("report.Inbound/Outbound")}
              labelPlacement="start"
            />

            <FormControlLabel
              control={
                <Checkbox
                  labelstyle={checkboxLabelStyle}
                  iconstyle={iconStyle}
                  style={checkboxStyle}
                  color="primary"
                  onChange={this.changeSourceSeparator}
                  checked={this.state.sourceSeparator}
                />
              }
              label={i18n.__("report.By website/app")}
              labelPlacement="start"
            />

            <ReportsChart data={chartData} options={options} />

            <table className="syncDetails">
              <tbody>
                {Object.entries(totalData).map(([key, val]) => {
                  return (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{val}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <b>
                {i18n.__(
                  "report.Please wait while your report is being processed Do not close the window while processing the report"
                )}
              </b>
            </div>
          </div>
        );
      }
    }
    if (this.state.parcelsView === this.LIST_VIEW) {
      return (
        <div>
          {this.props.parcels.length > 0 ? (
            <div>
              <table>
                <thead>
                  <tr>
                    <th className="delivery-status">
                      <org_placeholderTriangle className="default" />
                    </th>
                    <th>{i18n.__("report.Barcode / ID")}</th>
                    <th>{i18n.__("report.Carrier")}</th>
                    <th>{i18n.__("report.Sender")}</th>
                    <th>{i18n.__("report.Delivery Type")}</th>
                    <th>{i18n.__("report.Action")}</th>
                    <th>{i18n.__("report.Location")}</th>
                    <th>{i18n.__("report.Recipient / Addressee")}</th>
                    <th>{i18n.__("report.Signee")}</th>
                    <th>{i18n.__("report.Signature")}</th>
                    <th>{i18n.__("report.Received At")}</th>
                    <th>{i18n.__("report.Received By")}</th>
                    <th>{i18n.__("report.Number of Items")}</th>
                    <th>{i18n.__("report.Delivered At")}</th>
                    <th>{i18n.__("report.Delivered By")}</th>
                    <th>{i18n.__("report.Outbound Address")}</th>
                    <th>{i18n.__("report.Notes")}</th>
                    <th>{i18n.__("report.Scan through X-ray")}</th>
                    <th>{i18n.__("common.Assign user")}</th>
                  </tr>
                </thead>
                <tbody>
                  {this.props.parcels.map((parcel) => (
                    <ParcelDeliveredRow
                      key={parcel._id}
                      parcel={parcel}
                      timezone={timeZone.get()}
                    />
                  ))}
                </tbody>
              </table>
              {this.props.searchParcels.length > this.props.parcels.length ? (
                <div className="form-row" align="center">
                  <div className="margin-bottom-65">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.LoadMoreReport}
                    >
                      {i18n.__("report.Load More")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* show loader while subscription load data */}
          {!this.props.parcelsSub ? (
            <div>
              <b>{i18n.__("report.Loading")}</b>
            </div>
          ) : (
            <div> </div>
          )}
        </div>
      );
    }
  }

  getSearchParams() {
    this.setState({
      parcelReady: false,
    });
    const {
      barcode,
      selectCarrierValue,
      selectLocationValue,
      selectDeliveryUserValue,
      selectDeliveryTypeValue,
      selectDeliveryStatusValue,
      dateFromValue,
      dateToValue,
      selectItemTypeValue,
    } = this.state;

    const dateInterval = {
      $gte: dateFromValue,
      $lte: dateToValue,
    };

    let searchParams = {
      recipientName: this.inputRecipient.getValue(),
      sender: this.inputSender.getValue(),
      carrier: selectCarrierValue,
      location: selectLocationValue,
      deliveryType: selectDeliveryTypeValue,
      deliveryUser: selectDeliveryUserValue,
      type: selectItemTypeValue,
      // clientId: Meteor.user().profile.clientId,
      $or: [{ createdAt: dateInterval }, { deliveredAt: dateInterval }],
    };

    if (barcode) {
      const client = this.props.currentClient;
      const { clientBarcodeId } = client[0];

      // @TODO: may be error when user enters the custom barcode that starts with client barcode id. need refactor
      if (barcode.startsWith(clientBarcodeId)) {
        searchParams.clientUniqueBarcode = { $regex: escapeRegExp(barcode) };
      } else {
        searchParams.barcode = { $regex: escapeRegExp(barcode) };
      }
    }

    if (selectDeliveryStatusValue === "delivered") {
      searchParams.deliveredAt = { $ne: null };
    } else if (selectDeliveryStatusValue === "undelivered") {
      searchParams.deliveredAt = null;
    }

    searchParams = _.omitBy(
      searchParams,
      (field) => _.isUndefined(field) || field === ""
    );
    return searchParams;
  }

  resetSLAandRunReport = () => {
    this.setState(
      {
        slaSlots: [
          { from: 0, to: 1 },
          { from: 1, to: 2 },
          { from: 2, to: 3 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
          { from: 5, to: 6 },
        ],
      },
      () => this.runReport()
    );
  };
  runReport = async () => {
    this.setState({
      dateFromRequested: this.state.dateFromValue,
      dateToRequested: this.state.dateToValue,
      slaReady: false,
      lineChartReady: false,
    });
    const {
      barcode,
      selectCarrierValue,
      selectLocationValue,
      selectDeliveryUserValue,
      selectDeliveryTypeValue,
      selectDeliveryStatusValue,
      selectItemTypeValue,
      slaSlots,
    } = this.state;

    limit.set(LIMIT_INCREMENT);
    searchParams.set(this.getSearchParams());

    this.setState({ parcelReady: true });

    var fromDatevalue = this.state.dateFromValue.toString();
    var toDateValue = this.state.dateToValue.toString();

    let searchParamsForSLA = {
      clientId: Meteor.user().profile.clientId,
      dateFromValue: fromDatevalue,
      dateToValue: toDateValue,
      recipientName: this.inputRecipient.getValue(),
      sender: this.inputSender.getValue(),
      carrier: selectCarrierValue,
      location: selectLocationValue,
      deliveryType: selectDeliveryTypeValue,
      deliveryUser: selectDeliveryUserValue,
      type: selectItemTypeValue,
      barcode: escapeRegExp(barcode),
      selectDeliveryStatusValue: selectDeliveryStatusValue,
      slaSlots: slaSlots,
    };

    let thisComponent = this;

    //get sla data
    Meteor.call(
      "generate-sla-api",
      searchParamsForSLA,
      function (error, response) {
        if (response) {
          thisComponent.setState({
            slaReportData: response.parcelDeliver,
            parcelsLength: response.parcelslength,
            slaReady: true,
          });
        }
      }
    );

    let searchParamsForLineChart = {
      clientId: Meteor.user().profile.clientId,
      dateFromValue: fromDatevalue,
      dateToValue: toDateValue,
      recipientName: this.inputRecipient.getValue(),
      sender: this.inputSender.getValue(),
      carrier: selectCarrierValue,
      location: selectLocationValue,
      deliveryType: selectDeliveryTypeValue,
      deliveryUser: selectDeliveryUserValue,
      type: selectItemTypeValue,
      barcode: escapeRegExp(barcode),
      selectDeliveryStatusValue: selectDeliveryStatusValue,
      timezone: timeZone.get(),
    };

    //get line-chart data
    await Meteor.call(
      "generate-line-chart-api",
      searchParamsForLineChart,
      function (err, res) {
        thisComponent.setState(
          {
            totalData: res.totalData,
            chartData: res.chartData,
            options: res.options,
            lineChartReady: true,
          },
          () => thisComponent.generateLineChartData()
        );
      }
    );
  };

  LoadMoreReport = () => {
    subscriptionLimit.set(subscriptionLimit.get() + LIMIT_INCREMENT);
    limit.set(limit.get() + LIMIT_INCREMENT);
  };

  generateReport = () => {
    searchParams.set(this.getSearchParams());
    let thisComponent = this;
    var fromDatevalue = this.state.dateFromValue;
    var toDateValue = this.state.dateToValue;
    let Params = {
      to: Meteor.user().emails[0].address,
      searchParams: this.getSearchParams(),
      clientId: Meteor.user().profile.clientId,
      dateFromRequested: fromDatevalue,
      dateToRequested: toDateValue,
      timezone: timeZone.get(),
    };
    thisComponent.setState({ reportInProgress: true });
    //call email api
    Meteor.call("email-report", Params, function (err, res) {
      if (res) {
        thisComponent.setState({
          reportInProgress: false,
        });
        alert(
          i18n.__("report.Your report has been generated and emailed to you")
        );
      }
    });
  };

  emailCSV = () => {
    searchParams.set(this.getSearchParams());
    let thisComponent = this;
    var fromDatevalue = this.state.dateFromValue;
    var toDateValue = this.state.dateToValue;
    let Params = {
      to: Meteor.user().emails[0].address,
      searchParams: this.getSearchParams(),
      clientId: Meteor.user().profile.clientId,
      dateFromRequested: fromDatevalue,
      dateToRequested: toDateValue,
      timezone: timeZone.get(),
    };
    thisComponent.setState({ reportInProgress: true });
    //call email-csv api
    Meteor.call("email-csv-report", Params, function (err, res) {
      if (res) {
        thisComponent.setState({
          reportInProgress: false,
        });
        alert(
          i18n.__("report.Your report has been generated and emailed to you")
        );
      }
    });
  };

  render() {
    return (
      <div>
        {!this.props.parcelsSub ? (
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
        {this.state.reportInProgress ? (
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>
                {i18n.__(
                  "report.Please wait while your report is being processed Do not close the window while processing the report"
                )}
              </b>
            </div>
          </div>
        ) : (
          ""
        )}
        {this.renderViewToggle()}
        {this.renderSearchFilters()}
        {this.renderParcelContainer()}
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
  const parcelsSub = Meteor.subscribe(
    "parcelsForReport",
    searchParams.get(),
    subscriptionLimit.get()
  ).ready();
  const user = Meteor.user();

  /**
   * Patch: To fix language set functionality issue on page reload time
   * Todo : Remove the lang set functionality from report component
   *
   */

  if (user) {
    //if user set the language
    if (
      typeof user.profile.language !== "undefined" &&
      user.profile.language !== ""
    ) {
      i18n.setLocale(user.profile.language);
    }
    //if user not set the language
    else {
      if (currentClientSub) {
        const currentClient = Clients.find({}).fetch();
        if (
          typeof currentClient[0].defaultLanguage !== "undefined" &&
          currentClient[0].defaultLanguage !== ""
        ) {
          i18n.setLocale(currentClient[0].defaultLanguage);
        }
      }
    }
  }

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
        .map((user, key) => {
          return { value: user._id, label: user.username };
        })
    )
  );
  return {
    carriers: Carriers.find({}).fetch(),
    locations: Locations.find({}).fetch(),
    deliveryTypes: DeliveryTypes.find({}).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    currentClient: Clients.find({}).fetch(),
    parcels:
      Object.keys(searchParams.get()).length > 0
        ? Parcels.find(
            {},
            {
              fields: {
                postrubellaBarcode: 0,
                recipientSignature: 0,
                owner: 0,
                deliveredByOwner: 0,
                clientId: 0,
              },
              sort: { createdAt: -1 },
              limit: limit.get(),
            }
          ).fetch()
        : [],
    searchParcels:
      Object.keys(searchParams.get()).length > 0
        ? Parcels.find(
            {},
            {
              fields: {
                postrubellaBarcode: 0,
                recipientSignature: 0,
                owner: 0,
                deliveredByOwner: 0,
                clientId: 0,
              },
              sort: { createdAt: -1 },
            }
          ).fetch()
        : [],
    parcelsSub: parcelsSub,
    carrierSubscription: carrierSubscription,
    locationSubscription: locationSubscription,
    deliveryTypeSubscription: deliveryTypeSubscription,
    userSubscription: userSubscription,
  };
})(ReportsPage);
