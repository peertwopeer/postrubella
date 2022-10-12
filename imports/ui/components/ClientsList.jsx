// npm
import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
// theme: components
import org_placeholderTheme from "/imports/lib/AppTheme";
import Button from "@material-ui/core/Button";
import AsyncSelect from "react-select/async";
// collections
import { Clients } from "/imports/api/clients.js";
import GridView from "/imports/ui/components/GridView.jsx";
import { Languages } from "/imports/api/languages.js";
import { timeZones } from "/imports/api/timeZones.js";
import { DeliveryTypes } from "/imports/api/";
import { decode } from "html-entities";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import "/imports/languages/en/en.client.i18n.yml";
import "/imports/languages/de/de.client.i18n.yml";
import "/imports/languages/en-JM/en-JM.client.i18n.yml";
const publicDir = `${Meteor.settings.public.cdn}/public`;
// client list + adding collection
var _id = 0;
function loadClientData(client) {
  _id = client;
  FlowRouter.go("Dataset", { _id });
}
var Limit = 10;
var findDefaultTimezones = new ReactiveVar({});
var findOptionalTimezones = new ReactiveVar({});
var defaultTimezoneLimit = new ReactiveVar(10);
var optionalTimezoneLimit = new ReactiveVar(10);
var languageDefaultOptions = new ReactiveVar([]);
var timeZoneDefaultOptions = new ReactiveVar([]);
class ClientsList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      load_more: false,
      limit: 20,
      searchColumns: {},
      clientId: "",
      selectDefaultLanguage: "",
      selectDefaultTimeZone: "",
      optionalLanguages: [],
      optionalTimeZones: [],
      logo: "",
      customEmailChecked: false,
    };
  }
  componentDidMount() {
    findDefaultTimezones.set({});
    findOptionalTimezones.set({});
  }
  onSelected = () => {
    if (this.state.customEmailChecked) {
      this.setState({
        customEmailChecked: false,
      });
    } else {
      this.setState({
        customEmailChecked: true,
      });
    }
  };

  uncheckIt() {
    this.setState({
      customEmailChecked: false,
    });
  }
  //load more functions for drpdowns
  scrollMoreDefaultTimezones = () => {
    defaultTimezoneLimit.set(defaultTimezoneLimit.get() + Limit);
  };
  scrollMoreOptionalTimezones = () => {
    optionalTimezoneLimit.set(optionalTimezoneLimit.get() + Limit);
  };
  handleDeliveryTypeChange = (event) => {
    this.setState({ selectDeliveryTypeValue: event.target.value });
  };

  handleDeliveryUserChange = (event) => {
    this.setState({ deliveryUserSelect: event.target.value });
  };

  handleDeliveryReceiveUserChange = (event) => {
    this.setState({ selectDeliveryReceiveUser: event.target.value });
  };
  handleDefaultLanguage = (event) => {
    this.setState({ selectDefaultLanguage: event.target.value });
  };
  onLogoChange = (event) => {
    var reader = new FileReader();
    var thisComponent = this;
    var fileSize = event.target.files[0].size;
    var fileType = event.target.files[0].type;

    if (
      (fileType !== "image/png" && fileType !== "image/jpeg") ||
      fileSize > 1000000
    ) {
      alert(
        decode(
          i18n.__(
            "client.The uploaded file is not valid please follow the instruction"
          )
        )
      );
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
        // validate image dimension
        if (
          this.width < 300 &&
          this.height < 300 &&
          this.height > 100 &&
          this.width > 100
        ) {
          thisComponent.setState({ logo: reader.result });
        } else {
          alert(
            decode(
              i18n.__(
                "client.The uploaded file is not valid please follow the instruction"
              )
            )
          );
        }
      };
    };
  };

  limitIncFunction = (limit) => {
    this.setState({ limit: this.state.limit + limit });
  };

  searchcFunction = (searchValue) => {
    let column_search = {
      $or: [
        { clientName: { $regex: searchValue.trim() + ".*", $options: "i" } },
        { clientEmail: { $regex: searchValue.trim() + ".*", $options: "i" } },
        {
          clientBarcodeId: { $regex: searchValue.trim() + ".*", $options: "i" },
        },
        {
          clientBarcodeNumber: {
            $regex: searchValue.trim() + ".*",
            $options: "i",
          },
        },
      ],
    };
    this.setState({ searchColumns: column_search });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    let custom_email = 0;
    if (this.customEmails.checked) custom_email = 1;
    const clientName = this.clientName.value.trim();
    const clientEmail = this.clientEmail.value.trim();
    const clientBarcodeId = this.clientBarcodeId.value.trim();
    const clientBarcodeNumber = 10000;
    console.log(clientBarcodeNumber);

    const defaultLanguage = this.languageSelect.value.trim();
    const optionalLanguages = this.state.optionalLanguages;
    const defaultTimeZone = this.state.selectDefaultTimeZone;
    const optionalTimeZones = this.state.optionalTimeZones;
    const logo = this.state.logo;
    const customEmail = custom_email;

    if (clientName.length <= 3)
      return alert(i18n.__("client.Please enter a Client name"));
    if (defaultLanguage.length <= 1)
      return alert(i18n.__("client.Please select a language"));
    if (defaultTimeZone.length <= 1)
      return alert(i18n.__("client.Please select a timezone"));
    if (clientName.length <= 3)
      return alert(i18n.__("client.Please enter a Client name"));
    if (clientEmail.length <= 6)
      return alert(i18n.__("client.Please enter a a valid email address"));
    if (clientBarcodeId.length <= 2)
      return alert(
        i18n.__(
          "client.Please enter a Client Barcode ID more than 2 characters"
        )
      );

    var client_details_found = Clients.findOne({ clientEmail: clientEmail });

    if (
      client_details_found != "" &&
      typeof client_details_found != "undefined" &&
      client_details_found != undefined &&
      client_details_found != null
    ) {
      return alert(
        i18n.__(
          "client.Please enter a Different Client Email. This Email is Already used"
        )
      );
    }

    var client_details_found = Clients.findOne({
      clientBarcodeId: clientBarcodeId,
    });

    if (
      client_details_found != "" &&
      typeof client_details_found != "undefined" &&
      client_details_found != undefined &&
      client_details_found != null
    ) {
      return alert(
        i18n.__(
          "client.Please enter a Different Barcode ID. This Barcode ID is Already used"
        )
      );
    }
    const user = Meteor.user();
    const newClient = {
      clientName,
      clientEmail,
      clientBarcodeId,
      clientBarcodeNumber,
      defaultLanguage,
      optionalLanguages,
      defaultTimeZone,
      optionalTimeZones,
      createdAt: new Date(),
      owner: user._id,
      username: user.username,
      logo,
      customEmail,
    };

    Meteor.call("clients.insert", newClient, function (err, result) {
      if (result) {
        {
          loadClientData(result);
        }
      }
    });

    this.clientName.value = "";
    this.clientEmail.value = "";
    this.clientBarcodeId.value = "";
    this.uncheckIt();
  };

  // languages
  renderLanguages() {
    return this.props.languages.map((language) => (
      <option key={language._id} value={language.code}>
        {language.name}
      </option>
    ));
  }

  loadLanguageOptions = (inputValue, callback) => {
    let languageOptions = this.props.languages.map((language, key) => {
      return { value: language.code, label: language.name };
    });
    callback(languageOptions.filter((i) => i));
  };

  handleLanguageInputChange = (inputValue) => {
    findQueryLanguages.set({
      name: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  handleLanguageChange = (selectedOption) => {
    this.setState({
      optionalLanguages: selectedOption
        ? selectedOption
        : [{ value: "", label: "" }],
    });
  };
  loadMoreLanguageOptions = (inputValue, callback) => {
    let languageOptions = this.props.languages.map((language, key) => {
      return { value: language.code, label: language.name };
    });
    callback(languageOptions.filter((i) => i));
  };
  optionalLanguageInputChange = (inputValue) => {
    findQueryOptionalLanguages.set({
      name: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  // timezones
  renderTimeZones() {
    return this.props.timezones.map((timezone) => (
      <option key={timezone._id} value={timezone.zone}>
        {timezone.zone}
      </option>
    ));
  }
  loadDefaultTimeZones = (inputValue, callback) => {
    let timeZoneOptions = this.props.timezonesDefault.map((timezone, key) => {
      return { value: timezone.zone, label: timezone.zone };
    });
    callback(timeZoneOptions.filter((i) => i));
  };
  handleTimeZoneChange = (selectedOption) => {
    this.setState({
      selectDefaultTimeZone: selectedOption ? selectedOption.value : "",
    });
  };
  defaultTimeZoneInputChange = (inputValue) => {
    findDefaultTimezones.set({
      zone: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };
  handleOptionalTimeZones = (selectedOption) => {
    this.setState({
      optionalTimeZones: selectedOption
        ? selectedOption
        : [{ value: "", label: "" }],
    });
  };
  loadOptionalTimeZones = (inputValue, callback) => {
    let timeZoneOptions = this.props.timezonesOptional.map((timezone, key) => {
      return { value: timezone.zone, label: timezone.zone };
    });
    callback(timeZoneOptions.filter((i) => i));
  };

  optionalTimeZoneInputChange = (inputValue) => {
    findOptionalTimezones.set({
      zone: { $regex: inputValue + ".*", $options: "i" },
    });
    return inputValue;
  };

  renderClientsForm() {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ["super-admin"])) {
      return (
        <div>
          <form>
            <div className="form-row">
              <input
                type="text"
                ref={(c) => {
                  this.clientName = c;
                }}
                placeholder={i18n.__("client.Add new client")}
              />
            </div>
            <div className="form-row">
              <input
                type="email"
                ref={(c) => {
                  this.clientEmail = c;
                }}
                placeholder={i18n.__("client.Client Email")}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                ref={(c) => {
                  this.clientBarcodeId = c;
                }}
                placeholder={i18n.__("client.Set Barcode ID")}
              />
            </div>

            <div className="form-row">
              <select
                required
                name="clients"
                ref={(c) => {
                  this.languageSelect = c;
                }}
                onChange={this.handleDefaultLanguage}
              >
                <option value="" defaultValue>
                  {i18n.__("client.Set a default Language")}
                </option>
                {this.renderLanguages()}
              </select>
            </div>
            <div className="form-row">
              <AsyncSelect
                cacheOptions={false}
                placeholder={i18n.__("client.Choose more Languages")}
                theme={org_placeholderTheme}
                isMulti={true}
                isClearable={true}
                isSearchable={false}
                isLoading={!this.props.languageSubscription}
                loadOptions={this.loadLanguageOptions}
                defaultOptions={languageDefaultOptions.get()}
                onChange={this.handleLanguageChange}
              />
            </div>
            <div className="form-row">
              <AsyncSelect
                cacheOptions={false}
                placeholder={i18n.__("client.Set a default TimeZone")}
                theme={org_placeholderTheme}
                isLoading={!this.props.defaultTimezoneSubscription}
                loadOptions={this.loadDefaultTimeZones}
                defaultOptions={timeZoneDefaultOptions.get()}
                onChange={this.handleTimeZoneChange}
                onInputChange={this.defaultTimeZoneInputChange}
                onMenuScrollToBottom={this.scrollMoreDefaultTimezones}
              />
            </div>
            <div className="form-row">
              <AsyncSelect
                cacheOptions
                placeholder={i18n.__("client.Choose more TimeZones")}
                theme={org_placeholderTheme}
                isMulti={true}
                isClearable={true}
                isLoading={!this.props.optionalTimezoneSubscription}
                loadOptions={this.loadOptionalTimeZones}
                defaultOptions={timeZoneDefaultOptions.get()}
                onChange={this.handleOptionalTimeZones}
                onInputChange={this.optionalTimeZoneInputChange}
                onMenuScrollToBottom={this.scrollMoreOptionalTimezones}
              />
            </div>
            <div>
              <label>
                <span className={"client-form-logo-label"}>
                  {i18n.__("client.Upload Logo")}
                </span>
              </label>
              <br></br>
              <p className={"client-form-logo-description"}>
                {decode(
                  i18n.__("client.Instructions for uploading client logo")
                )}
              </p>
              <input
                type="file"
                onChange={this.onLogoChange}
                ref={(c) => {
                  this.logo = c;
                }}
              />
            </div>
            <br></br>
            <div className="form-row">
              <div className="form-row-label left col col-6">
                {i18n.__("client.Customize emails for the client?")}
              </div>
              <div className="form-row right col col-6">
                <input
                  type="checkbox"
                  ref={(c) => {
                    this.customEmails = c;
                  }}
                  className="chkbox"
                  defaultChecked={this.props.checked}
                  name="custom email"
                  value="0"
                  checked={this.state.customEmailChecked}
                  onChange={this.onSelected}
                />
              </div>
            </div>
            <br></br>
            <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
                {i18n.__("client.Add Client")}
              </Button>
            </div>
          </form>
          <br />

          {/* Data listing component */}
          <GridView
            limit={this.state.limit}
            LimitIncFunction={this.limitIncFunction}
            searchFunction={this.searchcFunction}
            searchColumns={this.state.searchColumns}
            initialColumns={[]}
            publications={["clients"]}
            collection={Clients}
            renderComponent={"Client"}
          />
        </div>
      );
    }
    if (Roles.userIsInRole(currentUserId, ["normal-user", "group-admin"])) {
      return (
        <div className="center m2">
          {i18n.__("common.You are not authorised to view this page")}
        </div>
      );
    }
  }

  render() {
    const { status } = this.props;
    if (status.connected) {
      return (
        <div className="width-narrow">
          {!this.props.dataSubscription ? (
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
            this.renderClientsForm()
          )}
        </div>
      );
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
  const dataSubscription = Meteor.subscribe("clients").ready();
  Meteor.subscribe("deliveryTypes");
  Meteor.subscribe("allUsers");
  const languageSubscription = Meteor.subscribe("languages").ready();
  const defaultTimezoneSubscription = Meteor.subscribe(
    "time-zones",
    defaultTimezoneLimit.get(),
    findDefaultTimezones.get()
  ).ready();
  const optionalTimezoneSubscription = Meteor.subscribe(
    "time-zones",
    optionalTimezoneLimit.get(),
    findOptionalTimezones.get()
  ).ready();
  const user = Meteor.user();
  const query = {};

  if (user) query.clientId = user.profile.clientId;

  languageDefaultOptions.set(
    Languages.find({})
      .fetch()
      .map((language, key) => {
        return { value: language.code, label: language.name };
      })
  );
  timeZoneDefaultOptions.set(
    timeZones
      .find({})
      .fetch()
      .map((timezone, key) => {
        return { value: timezone.zone, label: timezone.zone };
      })
  );
  return {
    currentClient: Clients.find({}).fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    languages: Languages.find({}).fetch(),
    timezonesDefault: timeZones.find(findDefaultTimezones.get()).fetch(),
    timezonesOptional: timeZones.find(findOptionalTimezones.get()).fetch(),
    defaultTimezoneSubscription: defaultTimezoneSubscription,
    optionalTimezoneSubscription: optionalTimezoneSubscription,
    languageSubscription: languageSubscription,
    dataSubscription: dataSubscription,
    status: Meteor.status(),
  };
})(ClientsList);
