import React, { Component } from "react";
import PropTypes from "prop-types";
import org_placeholderTheme from "/imports/lib/AppTheme";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import moment from "moment-timezone";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import AsyncSelect from "react-select/async";
import { Clients } from "/imports/api/clients.js";
import { DeliveryTypes } from "/imports/api/deliveryTypes.js";
import { Languages } from "/imports/api/languages.js";
import { timeZones } from "/imports/api/timeZones.js";
import { decode } from "html-entities";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import "/imports/languages/en/en.client.i18n.yml";
import "/imports/languages/de/de.client.i18n.yml";
import "/imports/languages/en-JM/en-JM.client.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
var Limit = 10;
var findDefaultTimezones = new ReactiveVar({});
var findOptionalTimezones = new ReactiveVar({});
var defaultTimezoneLimit = new ReactiveVar(10);
var optionalTimezoneLimit = new ReactiveVar(10);
var languageDefaultOptions = new ReactiveVar([]);
var timeZoneDefaultOptions = new ReactiveVar([]);

class Client extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: null,
      clientName: this.props.client.clientName,
      clientEmail: this.props.client.clientEmail,
      clientBarcodeId: this.props.client.clientBarcodeId,
      selectDeliveryTypeValue: this.props.client.deliveryType
        ? this.props.client.deliveryType
        : "",
      deliveryUserSelect: this.props.client.deliveryUser
        ? this.props.client.deliveryUser
        : "",
      selectDeliveryReceiveUser: this.props.client.receiveUser
        ? this.props.client.receiveUser
        : "",
      selectDefaultLanguage: this.props.client.defaultLanguage
        ? this.props.client.defaultLanguage
        : "",
      selectDefaultTimeZone: this.props.client.defaultTimeZone
        ? this.props.client.defaultTimeZone
        : "",
      optionalLanguages: this.props.client.optionalLanguages
        ? this.props.client.optionalLanguages
        : [],
      optionalTimeZones: this.props.client.optionalTimeZones
        ? this.props.client.optionalTimeZones
        : [],
      logo: "",
      customEmailChecked: this.props.client.customEmail ? true : false,
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
  renderDeliveryTypes() {
    if (this.props.deliveryTypesSubscription) {
      if (
        typeof this.props.client.deliveryType !== "undefined" &&
        this.props.client.deliveryType !== ""
      ) {
        return this.props.deliveryTypes
          .filter(
            (deliveryType) =>
              (deliveryType.clientId.value
                ? deliveryType.clientId.value
                : deliveryType.clientId) == this.props.client._id
          )
          .map((deliveryType) => (
            <option
              hidden={
                this.props.client.deliveryType == deliveryType.deliveryTypeName
              }
              key={deliveryType._id}
            >
              {deliveryType.deliveryTypeName}
            </option>
          ));
      }
      return this.props.deliveryTypes
        .filter(
          (deliveryType) =>
            (deliveryType.clientId.value
              ? deliveryType.clientId.value
              : deliveryType.clientId) == this.props.client._id
        )
        .map((deliveryType) => (
          <option key={deliveryType._id}>
            {deliveryType.deliveryTypeName}
          </option>
        ));
    }
  }
  renderUsers() {
    const users = this.props.allUsers;
    if (this.props.userSubscription) {
      return users
        .filter((user) => user.profile.clientId == this.props.client._id)
        .map((user) => <option key={user._id}>{user.username}</option>);
    }
  }
  handleClientNameChange = (event) => {
    this.setState({ clientName: event.target.value });
  };
  handleClientEmailChange = (event) => {
    this.setState({ clientEmail: event.target.value });
  };
  handleClientBarcodeIdChange = (event) => {
    this.setState({ clientBarcodeId: event.target.value });
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

  deleteInputChange = (event) => {
    this.setState({ deleteInputValue: event.target.value });
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

  // languages
  renderLanguages() {
    if (
      typeof this.props.client.defaultLanguage !== "undefined" &&
      this.props.client.defaultLanguage !== ""
    ) {
      return this.props.languages.map((language) => (
        <option
          selected={
            language.value == this.props.client.defaultLanguage || false
          }
          key={language._id}
          value={language.code}
        >
          {language.name}
        </option>
      ));
    }
    return this.props.languages.map((language) => (
      <option key={language._id} value={language.code}>
        {language.name}
      </option>
    ));
  }
  handleDefaultLanguage = (event) => {
    this.setState({ selectDefaultLanguage: event.target.value });
  };

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
  cancelEditing = () => {
    this.setState({ editing: null });
  };
  toggleEditing = () => {
    this.setState({ editing: this.props.client._id });
  };

  deleteButton() {
    if (this.state.deleteInputValue !== "DELETE") {
      return (
        <div className="block-icon" onClick={this.cancelEditing}>
          <img src={`${publicDir}/svg/Cancel.svg`} />
        </div>
      );
    }
    if (this.state.deleteInputValue === "DELETE") {
      return (
        <div className="block-icon" onClick={this.handleDelete}>
          <img src={`${publicDir}/svg/icon-bin.svg`} />
        </div>
      );
    }
  }

  handleDelete = (event) => {
    event.preventDefault();

    if (
      window.confirm(
        i18n.__("client.Are you sure to Delete Client") +
          this.clientName.value.trim() +
          " ?"
      )
    ) {
      const clientId = this.props.client._id;
      let thisComponent = this;
      Meteor.call("clients.remove", clientId, function (err, result) {
        if (result) {
          alert(
            i18n.__("client.Client") +
              thisComponent.clientName.value.trim() +
              i18n.__("common.Deleted Successfully")
          );
          window.location.reload();
        }
      });
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();

    let custom_email = 0;
    if (this.customEmails.checked) custom_email = 1;
    const clientId = this.state.editing;
    const clientName = this.clientName.value.trim();
    const clientEmail = this.clientEmail.value.trim();
    const clientBarcodeId = this.clientBarcodeId.value.trim();
    const deliveryType = this.state.selectDeliveryTypeValue.trim();
    const deliveryUser = this.state.deliveryUserSelect.trim();
    const receiveUser = this.state.selectDeliveryReceiveUser.trim();
    const defaultLanguage = this.state.selectDefaultLanguage;
    const optionalLanguages = this.state.optionalLanguages
      ? this.state.optionalLanguages
      : this.props.client.optionalLanguages;
    const defaultTimeZone = this.state.selectDefaultTimeZone;
    const optionalTimeZones = this.state.optionalTimeZones
      ? this.state.optionalTimeZones
      : this.props.client.optionalTimeZones;
    const logo = this.state.logo;
    const customEmail = custom_email;

    if (clientName.length <= 0)
      return alert(i18n.__("client.Please enter a Client name"));
    if (clientEmail.length <= 6)
      return alert(i18n.__("client.Please enter a Client Email"));
    if (clientBarcodeId.length <= 0)
      return alert(i18n.__("client.Please enter a Client Barcode ID"));
    if (defaultLanguage.length <= 1)
      return alert(i18n.__("client.Please enter a Default language"));
    if (defaultTimeZone.length <= 1)
      return alert(i18n.__("client.Please enter a Default timezone"));
    var client_details_found = Clients.findOne({
      clientEmail: clientEmail,
      _id: { $ne: clientId },
    });

    if (
      client_details_found != "" &&
      typeof client_details_found != "undefined" &&
      client_details_found != undefined &&
      client_details_found != null
    ) {
      return alert(
        i18n.__(
          "client.Please enter a Different Client Email This Email is Already used"
        )
      );
    }

    var client_details_found = Clients.findOne({
      clientBarcodeId: clientBarcodeId,
      _id: { $ne: clientId },
    });

    if (
      client_details_found != "" &&
      typeof client_details_found != "undefined" &&
      client_details_found != undefined &&
      client_details_found != null
    ) {
      return alert(
        i18n.__(
          "client.Please enter a Different Barcode ID This Barcode ID is Already used"
        )
      );
    }

    Meteor.call(
      "clients.update",
      clientId,
      clientName,
      clientEmail,
      clientBarcodeId,
      deliveryType,
      deliveryUser,
      receiveUser,
      defaultLanguage,
      optionalLanguages,
      defaultTimeZone,
      optionalTimeZones,
      logo,
      customEmail,
      function (err, result) {
        if (result) window.location.reload();
      }
    );
    this.setState({ editing: null });
  };
  removeLogo = () => {
    Meteor.call(
      "clients.removeLogo",
      this.props.client._id,
      function (err, result) {
        if (result) window.location.reload();
      }
    );
  };
  redirectToDataset = () => {
    const _id = this.props.client._id;
    FlowRouter.go("Dataset", { _id });
  };
  renderOrEditClient() {
    if (this.state.editing === null) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">
              <div className="block-content clearix">
                <div className="inside">
                  <div className="block-title">
                    {this.props.client.clientName}
                  </div>
                  <div className="block-title medium">
                    {i18n.__("client.Client Email:")}{" "}
                    {this.props.client.clientEmail}
                  </div>
                  <div className="block-title medium">
                    {i18n.__("client.Barcode ID:")}{" "}
                    {this.props.client.clientBarcodeId}
                  </div>
                  <div className="block-title medium">
                    {i18n.__("client.Barcode Number:")}{" "}
                    {this.props.client.clientBarcodeNumber}
                  </div>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text">
                    <div className="block-row">
                      <b>{i18n.__("common.Added By:")}</b>
                      {this.props.client.username}
                    </div>
                    <div className="block-row">
                      <b>{i18n.__("common.Added At:")}</b>
                      {moment(this.props.client.createdAt)
                        .tz(this.props.timezone)
                        .format("lll")}
                    </div>
                  </div>
                  <div className="block-meta-links">
                    <div className="block-icon" onClick={this.toggleEditing}>
                      <img src={`${publicDir}/svg/IconSettings.svg`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }

    const clickedId = this.props.client._id;

    if (this.state.editing === clickedId) {
      return (
        <div>
          <Paper elevation={3}>
            <div className="block">
              <div className="block-content clearix">
                <div className="inside">
                  <form>
                    <div className="form-row">
                      <input
                        type="text"
                        ref={(c) => {
                          this.clientName = c;
                        }}
                        placeholder={i18n.__("client.Client Name")}
                        value={this.state.clientName}
                        onChange={this.handleClientNameChange}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="email"
                        ref={(c) => {
                          this.clientEmail = c;
                        }}
                        placeholder={i18n.__("client.Client Email")}
                        value={this.state.clientEmail}
                        onChange={this.handleClientEmailChange}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        ref={(c) => {
                          this.clientBarcodeId = c;
                        }}
                        placeholder={i18n.__("client.Client Barcode ID")}
                        value={this.state.clientBarcodeId}
                        onChange={this.handleClientBarcodeIdChange}
                      />
                    </div>
                    <div className="form-row">
                      <select
                        name="deliveryTypes"
                        ref={(c) => {
                          this.deliveryTypeSelect = c;
                        }}
                        defaultValue={
                          typeof this.props.client.deliveryType !==
                            "undefined" && this.props.client.deliveryType !== ""
                            ? this.props.client.deliveryType
                            : ""
                        }
                        onChange={this.handleDeliveryTypeChange}
                        required
                      >
                        <option
                          value={
                            typeof this.props.client.deliveryType !==
                              "undefined" &&
                            this.props.client.deliveryType !== ""
                              ? this.props.client.deliveryType
                              : ""
                          }
                          defaultValue
                        >
                          {typeof this.props.client.deliveryType !==
                            "undefined" && this.props.client.deliveryType !== ""
                            ? this.props.client.deliveryType
                            : i18n.__("client.Set a default Delivery Type")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryType !==
                              "undefined" &&
                            this.props.client.deliveryType !== ""
                              ? this.props.client.deliveryType == "Normal"
                              : false
                          }
                          value="Normal"
                        >
                          {i18n.__("client.Normal")}
                        </option>
                        {this.renderDeliveryTypes()}
                      </select>
                    </div>
                    <div className="form-row">
                      <select
                        name="users"
                        ref={(c) => {
                          this.deliveryUserSelect = c;
                        }}
                        defaultValue={
                          typeof this.props.client.deliveryUser !==
                            "undefined" && this.props.client.deliveryUser !== ""
                            ? this.props.client.deliveryUser
                            : ""
                        }
                        onChange={this.handleDeliveryUserChange}
                        required
                      >
                        <option
                          value={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser
                              : ""
                          }
                          defaultValue
                        >
                          {typeof this.props.client.deliveryUser !==
                            "undefined" && this.props.client.deliveryUser !== ""
                            ? this.props.client.deliveryUser
                            : i18n.__("client.Set a default Assign Action")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser ==
                                "Collect from postrubella"
                              : false
                          }
                          value="Collect from postrubella"
                        >
                          {i18n.__("client.Collect from postrubella")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser == "Reception"
                              : false
                          }
                          value="Reception"
                        >
                          {i18n.__("client.Reception")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser == "Security"
                              : false
                          }
                          value="Security"
                        >
                          {i18n.__("client.Security")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser == "Delivery AM"
                              : false
                          }
                          value="Delivery AM"
                        >
                          {i18n.__("client.Delivery AM")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser == "Delivery PM"
                              : false
                          }
                          value="Delivery PM"
                        >
                          {i18n.__("client.Delivery PM")}
                        </option>
                        <option
                          hidden={
                            typeof this.props.client.deliveryUser !==
                              "undefined" &&
                            this.props.client.deliveryUser !== ""
                              ? this.props.client.deliveryUser ==
                                "Delivered Today"
                              : false
                          }
                          value="Delivered Today"
                        >
                          {i18n.__("client.Delivered Today")}
                        </option>
                        {/* {this.renderUsers()} */}
                      </select>
                    </div>

                    <div className="form-row">
                      <select
                        name="users"
                        ref={(c) => {
                          this.deliveryReceiveUserSelect = c;
                        }}
                        defaultValue={
                          typeof this.props.client.receiveUser !==
                            "undefined" && this.props.client.receiveUser !== ""
                            ? this.props.client.receiveUser
                            : ""
                        }
                        onChange={this.handleDeliveryReceiveUserChange}
                      >
                        <option
                          value={
                            typeof this.props.client.receiveUser !==
                              "undefined" &&
                            this.props.client.receiveUser !== ""
                              ? this.props.client.receiveUser
                              : ""
                          }
                          defaultValue
                        >
                          {typeof this.props.client.receiveUser !==
                            "undefined" && this.props.client.receiveUser !== ""
                            ? this.props.client.receiveUser
                            : i18n.__("client.Set a default Receiving Action")}
                        </option>
                        {this.renderUsers()}
                      </select>
                    </div>
                    <div className="form-row">
                      <select
                        name="clients"
                        ref={(c) => {
                          this.languageSelect = c;
                        }}
                        defaultValue={this.state.selectDefaultLanguage}
                        onChange={this.handleDefaultLanguage}
                      >
                        <option value="">
                          {i18n.__("client.Set a default Language")}
                        </option>

                        {this.renderLanguages()}
                      </select>
                    </div>
                    <div>
                      <AsyncSelect
                        cacheOptions={false}
                        placeholder={i18n.__("client.Choose more Languages")}
                        theme={org_placeholderTheme}
                        isMulti={true}
                        isClearable={true}
                        isSearchable={false}
                        isLoading={!this.props.languageSubscription}
                        defaultValue={this.props.client.optionalLanguages.map(
                          (lang) => {
                            if (lang.value !== "" && lang.label !== "")
                              return lang;
                          }
                        )}
                        loadOptions={this.loadLanguageOptions}
                        defaultOptions={languageDefaultOptions.get()}
                        onChange={this.handleLanguageChange}
                      />
                    </div>
                    <br></br>
                    <div>
                      <AsyncSelect
                        cacheOptions={false}
                        isRequired={true}
                        placeholder={i18n.__("client.Set a default TimeZone")}
                        theme={org_placeholderTheme}
                        defaultValue={
                          this.state.selectDefaultTimeZone
                            ? {
                                label: this.state.selectDefaultTimeZone,
                                value: this.state.selectDefaultTimeZone,
                              }
                            : { label: "Set a default TimeZones", value: "" }
                        }
                        isLoading={!this.props.defaultTimezoneSubscription}
                        loadOptions={this.loadDefaultTimeZones}
                        defaultOptions={timeZoneDefaultOptions.get()}
                        onChange={this.handleTimeZoneChange}
                        onInputChange={this.defaultTimeZoneInputChange}
                        onMenuScrollToBottom={this.scrollMoreDefaultTimezones}
                      />
                    </div>
                    <br></br>
                    <div>
                      <AsyncSelect
                        cacheOptions={false}
                        placeholder={i18n.__("client.Choose more TimeZones")}
                        theme={org_placeholderTheme}
                        isMulti={true}
                        isClearable={true}
                        isLoading={!this.props.optionalTimezoneSubscription}
                        defaultValue={this.props.client.optionalTimeZones.map(
                          (zone) => {
                            if (zone.value !== "" && zone.label !== "")
                              return zone;
                          }
                        )}
                        loadOptions={this.loadOptionalTimeZones}
                        defaultOptions={timeZoneDefaultOptions.get()}
                        onChange={this.handleOptionalTimeZones}
                        onInputChange={this.optionalTimeZoneInputChange}
                        onMenuScrollToBottom={this.scrollMoreOptionalTimezones}
                      />
                      <br></br>
                      <div>
                        <label>
                          <span className={"client-form-logo-label"}>
                            {i18n.__("client.Upload Logo")}
                          </span>
                        </label>
                        <br></br>
                        <p className={"client-form-logo-description"}>
                          {decode(
                            i18n.__(
                              "client.Instructions for uploading client logo"
                            )
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
                      <div>
                        {typeof this.props.client.logo !== "undefined" &&
                        this.props.client.logo !== "" ? (
                          <img src={this.props.client.logo} />
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="form-row">
                        {typeof this.props.client.logo !== "undefined" &&
                        this.props.client.logo !== "" ? (
                          <Button
                            onClick={this.removeLogo}
                            variant="contained"
                            color="primary"
                            fullWidth={true}
                          >
                            Remove Logo
                          </Button>
                        ) : (
                          ""
                        )}
                      </div>
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
                    <div className="form-row">
                      <Button
                        onClick={this.handleSubmit}
                        variant="contained"
                        color="primary"
                        fullWidth={true}
                      >
                        {i18n.__("common.Update")}
                      </Button>
                    </div>
                    <div className="form-row">
                      <Button
                        onClick={this.redirectToDataset}
                        variant="contained"
                        color="primary"
                        fullWidth={true}
                      >
                        {i18n.__("common.Load default data")}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="block-status clearix" />

              <div className="block-meta clearix">
                <div className="inside">
                  <div className="block-meta-text col-6">
                    <div className="block-row">
                      <input
                        type="text"
                        placeholder="DELETE"
                        value={this.state.deleteInputValue}
                        onChange={this.deleteInputChange}
                      />
                    </div>
                  </div>
                  <div className="block-meta-links col-6">
                    {this.deleteButton()}
                  </div>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      );
    }
  }

  render() {
    return <div>{this.renderOrEditClient()}</div>;
  }
}
// props
Client.propTypes = {
  client: PropTypes.object.isRequired,
};
export default withTracker(() => {
  const deliveryTypesSubscription =
    Meteor.subscribe("allDeliveryTypes").ready();
  const userSubscription = Meteor.subscribe("adminAllUsers").ready();
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
  //set default options for dropdowns
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
    deliveryTypes: DeliveryTypes.find({}).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    languages: Languages.find({}).fetch(),
    timezonesDefault: timeZones.find(findDefaultTimezones.get()).fetch(),
    timezonesOptional: timeZones.find(findOptionalTimezones.get()).fetch(),
    languageSubscription: languageSubscription,
    defaultTimezoneSubscription: defaultTimezoneSubscription,
    optionalTimezoneSubscription: optionalTimezoneSubscription,
    deliveryTypesSubscription: deliveryTypesSubscription,
    userSubscription: userSubscription,
  };
})(Client);
