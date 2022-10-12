import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import moment from "moment-timezone";
import _ from "lodash";
import { withTracker } from "meteor/react-meteor-data";
import ReportsChart from "/imports/ui/ReportsChart.jsx";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/moment";
import { Clients, Locations } from "../../api";
import { Chart } from "react-google-charts";
import AsyncSelect from "react-select/async";
import org_placeholderTheme from "/imports/lib/AppTheme";

const publicDir = `${Meteor.settings.public.cdn}/public`;

var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
var toDate = new ReactiveVar(moment().endOf("day").toDate());
var fromDate = new ReactiveVar(
  moment().subtract(90, "day").startOf("day").toDate()
);
var maxFromDateRange = moment().subtract(1, "years").startOf("day").toDate();
var maxToDateRange = moment().endOf("day").toDate();

var indexlist = new ReactiveVar([]);
var Limit = 10;

var findQueryLocations = new ReactiveVar({});
var locationsLimit = new ReactiveVar(10);

var locationDefaultOptions = new ReactiveVar([]);

class DashboardWeb extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: [],
      totalData: 0,
      deliverySeparator: false,
      inOutSeparator: false,
      sourceSeparator: false,
      options: "",
      chartDataFiltered: [],
      lineChartReady: false,
      slaReportData: [],
      parcelsLength: 0,
      reportInProgress: false,
      dateFromValue: null,
      dateToValue: null,
      maxToDateRange: null,
      maxFromDateRange: null,
      undeliveredCount: 0,
      overdueCount: 0,
      selectLocationValue: "",
      slaSlots: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 6 },
      ],
    };
  }

  // scroll for more functions
  scrollMoreLocations = () => {
    locationsLimit.set(locationsLimit.get() + Limit);
  };

  // handle changes
  loadLocationOptions = (inputValue, callback) => {
    let locationOptions = this.props.locations.map((location, key) => {
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
    let selectedOptionLabel = selectedOption ? selectedOption.label : "";
    this.setState({ selectLocationValue: selectedOptionLabel }, () =>
      this.callAPI()
    );
  };
  handleDateFromChange = (dateFromValue) => {
    var dateFromValueFormatted = moment(dateFromValue).startOf("day").toDate();
    this.setState({ dateFromValue: dateFromValueFormatted }, () =>
      this.callAPI()
    );
    fromDate.set(dateFromValueFormatted);
  };
  handleDateToChange = (dateToValue) => {
    var dateToValueFormatted = moment(dateToValue).endOf("day").toDate();
    var maxFromDateRangeFormatted = moment(dateToValue)
      .subtract(1, "years")
      .startOf("day")
      .toDate();
    this.setState(
      {
        dateToValue: dateToValueFormatted,
        maxFromDateRange: maxFromDateRangeFormatted,
      },
      () => this.callAPI()
    );
    toDate.set(dateToValueFormatted);
  };
  componentDidMount() {
    let thisComponent = this;
    this.setState({
      dateFromValue: fromDate.get(),
      dateToValue: toDate.get(),
      maxFromDateRange: maxFromDateRange,
      maxToDateRange: maxToDateRange,
    });
    setTimeout(function () {
      thisComponent.callAPI();
    }, 4000);
    findQueryLocations.set({});
  }

  callAPI = () => {
    let thisComponent = this;
    var fromDatevalue = this.state.dateFromValue.toString();
    var toDateValue = this.state.dateToValue.toString();
    var location = this.state.selectLocationValue;

    //Undelivered parcels count
    let searchParamsForUndeliveredParcel = {
      clientId: Meteor.user().profile.clientId,
      dateFromRequested: fromDatevalue,
      dateToRequested: toDateValue,
      location: location,
    };

    Meteor.call(
      "undeliveredParcelsCount",
      searchParamsForUndeliveredParcel,
      function (err, res) {
        thisComponent.setState({ undeliveredCount: res.undeliveredCount });
        thisComponent.setState({ overdueCount: res.overdueCount });
      }
    );

    //line chart params
    let searchParamsForLineChart = {
      clientId: Meteor.user().profile.clientId,
      dateFromValue: fromDatevalue,
      dateToValue: toDateValue,
      timezone: timeZone.get(),
      recipientName: "",
      sender: "",
      carrier: "",
      location: location,
      deliveryType: "",
      deliveryUser: "",
      type: "",
      barcode: "",
      selectDeliveryStatusValue: "",
    };
    //call line chart api
    Meteor.call(
      "generate-line-chart-api",
      searchParamsForLineChart,
      function (err, res) {
        thisComponent.setState({ totalData: res.totalData });
        thisComponent.setState({ chartData: res.chartData });
        thisComponent.setState({ options: res.options });
        thisComponent.setState({ lineChartReady: true });
        thisComponent.generateLineChartData();
      }
    );
    let searchParamsForSLA = {
      clientId: Meteor.user().profile.clientId,
      dateFromValue: fromDatevalue,
      dateToValue: toDateValue,
      recipientName: "",
      sender: "",
      carrier: "",
      location: location,
      deliveryType: "",
      deliveryUser: "",
      type: "",
      barcode: "",
      selectDeliveryStatusValue: "",
      slaSlots: this.state.slaSlots,
    };
    Meteor.call(
      "generate-sla-api",
      searchParamsForSLA,
      function (error, response) {
        if (response) {
          thisComponent.setState({ slaReportData: response.parcelDeliver });
          thisComponent.setState({ parcelsLength: response.parcelslength });
          thisComponent.setState({ slaReady: true });
        }
      }
    );
  };

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
    let thisComponent = this;
    await new Promise((resolve) =>
      this.filterChartArray(chartArray, indexlist.get()).then((result) => {
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
  renderLineChart() {
    let totalData = this.state.totalData;
    let chartData = this.state.chartDataFiltered;
    let options = this.state.options;
    const checkboxStyle = {
      display: "inline-block",
      width: "auto",
      margin: "0 25px 0 0",
    };
    const iconStyle = {
      right: 0,
    };
    const checkboxLabelStyle = {
      color: "#111",
      textAlign: "left",
      width: "auto",
    };
    return (
      <div className="center h6 bg-white text15  ">
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
                  <td>{i18n.__("report.Total Posts")}</td>
                  <td>{val}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  renderSLAChart() {
    const graphStyle = {
      display: "inline-block",
      width: "100%",
      float: "left",
    };
    return (
      <div className="row">
        <div
          className="center col-lg-6 col-md-6 col-sm-12 graphclass"
          style={graphStyle}
          id="capture"
        >
          <div id="piechartcls" className="bg-white">
            <ul>
              <Chart
                width={"auto"}
                height={"200px"}
                chartType="PieChart"
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
            <table className="syncDetails">
              <tbody>
                <tr>
                  <td>{i18n.__("report.Total Posts")}</td>
                  <td>{this.state.parcelsLength}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="clearfix ">
            <div className="col sm-col-12 md-col-6 p2 mt3">
              <AsyncSelect
                theme={org_placeholderTheme}
                cacheOptions={false}
                placeholder={i18n.__("report.Company")}
                value={
                  this.state.selectLocationValue !== "" &&
                  this.state.selectLocationValue !== undefined
                    ? {
                        label: this.state.selectLocationValue,
                        value: this.state.selectLocationValue,
                      }
                    : { label: i18n.__("report.Location"), value: "" }
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
            <div className="col sm-col-12 md-col-6 p2">
              <div className="clearfix ">
                <div className="col col-6  px2">
                  <h4 className="m0 text-gray px1">
                    {i18n.__("report.Start Date")}
                  </h4>
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <DatePicker
                      format="DD-MM-YYYY"
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
                <div className="col col-6  px2">
                  <h4 className="m0 text-gray px1">
                    {i18n.__("report.End Date")}
                  </h4>
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <DatePicker
                      format="DD-MM-YYYY"
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
              </div>
            </div>
          </div>
        </div>
        <div className="container bg-light-gray">
          <div className="clearfix ">
            <div className="col sm-col-12 md-col-6 p2">
              <div className="clearfix ">
                <div className="col">
                  <div className="clearfix mb2 bg-white rounded p2 ">
                    <div className="left p2 px3 mr2 bg-red rounded">
                      <h4 className="white text40 m0">
                        {" "}
                        {this.state.overdueCount}
                      </h4>
                    </div>
                    <div className="p2 ">
                      <h3 className="text25 gray m0">
                        {i18n.__("report.ITEMS CURRENTLY OVERDUE BY 2+ WEEKS")}
                      </h3>
                    </div>
                  </div>

                  {this.state.lineChartReady ? (
                    this.renderLineChart()
                  ) : (
                    <h3>{i18n.__("report.Loading")}</h3>
                  )}
                </div>
              </div>
            </div>
            <div className="col sm-col-12 md-col-6 p2">
              <div className="clearfix ">
                <div className="col">
                  <div className="clearfix mb2 bg-white rounded p2 ">
                    <div className="left p2 px3 mr2 bg-yellow rounded">
                      <h4 className="white text40 m0 ">
                        {" "}
                        {this.state.undeliveredCount}
                      </h4>
                    </div>
                    <div className="p2 ">
                      <h3 className="text25 gray m0">
                        {i18n.__("report.ITEMS CURRENTLY UNDELIVERED")}
                      </h3>
                    </div>
                  </div>

                  {this.state.slaReady ? (
                    this.renderSLAChart()
                  ) : (
                    <h3>{i18n.__("report.Loading")}</h3>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTracker(() => {
  //subscriptions
  const locationSubscription = Meteor.subscribe(
    "locations.list.dropdowns",
    locationsLimit.get(),
    findQueryLocations.get()
  ).ready();

  const currentClientSub = Meteor.subscribe("currentClient").ready();
  const user = Meteor.user();
  const currentClient = Clients.find({}).fetch();
  //set timezone
  if (currentClientSub) {
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

  // default options for dropdown
  locationDefaultOptions.set(
    Locations.find({})
      .fetch()
      .map((location, key) => {
        return { value: location._id, label: location.locationName };
      })
  );

  return {
    currentClientSub: currentClientSub,
    currentUser: user,
    currentClient: currentClient,
    locationSubscription: locationSubscription,
  };
})(DashboardWeb);
