import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";
import SelectVirtualized from "react-virtualized-select";
import { createFilter } from "react-select";
import ChipInput from "material-ui-chip-input";
import Button from "@material-ui/core/Button";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import SelectableParcelOffline from "/imports/ui/containers/SelectableParcelOffline.js";
import SelectableParcelRow from "/imports/ui/components/SelectableParcelRow.jsx";

import { Loading } from "/imports/ui/components/";
import fetchPouchDB from "../../client/cordova/fetchPouchDB";

import "/imports/languages/en/en.postbag.i18n.yml";
import "/imports/languages/de/de.postbag.i18n.yml";
import "/imports/languages/en-JM/en-JM.postbag.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
export default class AddToPostbag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: {},
      barcode: [],
      clientUniqueBarcode: [],
      selectCarrierValue: undefined,
      selectLocationValue: undefined,
      selectDeliveryUserValue: undefined,
      selectDeliveryTypeValue: undefined,
      selectDeliveryStatusValue: undefined,
      selectItemTypeValue: undefined,
      listView: true,
      boxView: false,
      showSearchFilters: true,

      parcels: [],
      carriers: [],
      locations: [],
      deliveryTypes: [],
      users: [],
      clients: [],

      checked: false,
      pouchDataReady: false,
    };
    this.list = {};
    this.prevFilters = {};
  }

  componentDidMount() {
    this.fetchCoreData();
    // @FIXME Make more reactive
    this.fixView();
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

  fixView() {
    if (window.innerWidth <= 960) {
      this.setState({
        listView: false,
        boxView: true,
      });
    }
  }

  async fetchCoreData() {
    const pouchData = await fetchPouchDB();
    if (pouchData.syncStatus) {
      if (pouchData.currentUser) {
        //set timezone
        if (
          typeof pouchData.currentUser.timezone !== "undefined" &&
          pouchData.currentUser.timezone !== ""
        ) {
          timeZone.set(pouchData.currentUser.timezone);
        } else if (
          typeof pouchData.clients[0].defaultTimeZone !== "undefined" &&
          pouchData.clients[0].defaultTimeZone !== ""
        ) {
          timeZone.set(pouchData.clients[0].defaultTimeZone);
        }
      }
      pouchData.list = {};
      pouchData.locations = pouchData.locations.map(
        ({ locationName: label }) => ({ value: label, label })
      );
      pouchData.carriers = pouchData.carriers.map(({ carrierName: label }) => ({
        value: label,
        label,
      }));
      pouchData.parcels = pouchData.parcels.filter((parcel) => {
        if (
          !parcel.deliveredAt &&
          (!parcel.postbagOwner ||
            parcel.postbagOwner == "" ||
            parcel.postbagOwner == "false")
        ) {
          if (parcel.offline) pouchData.list[parcel._id] = parcel._id;

          return true;
        }

        return false;
      });
      pouchData.parcels.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      pouchData.filteredParcels = pouchData.parcels;
      this.setState(pouchData, () => {
        this.setState({ pouchDataReady: true });
      });
      this.filterParcels();
    } else {
      this.setState({ pouchDataReady: true });
    }
  }

  toggleCheckboxes = () => {
    this.setState({ checked: !this.state.checked });
  };

  handleCarrierChange = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.value : "";
    this.setState({
      selectCarrierValue: selectedOption,
    });
    this.filterParcels();
  };
  handleLocationChange = (selectedOption) => {
    selectedOption = selectedOption ? selectedOption.value : "";
    this.setState({
      selectLocationValue: selectedOption,
    });
    this.filterParcels();
  };
  handleDeliveryUserChange = (event) => {
    this.setState({ selectDeliveryUserValue: event.target.value });
    this.filterParcels();
  };
  handleDeliveryTypeChange = (event) => {
    this.setState({ selectDeliveryTypeValue: event.target.value });
    this.filterParcels();
  };
  handledeliveryStatusChange = (event) => {
    this.setState({ selectDeliveryStatusValue: event.target.value });
    this.filterParcels();
  };
  handleItemTypeChange = (event) => {
    this.setState({ selectItemTypeValue: event.target.value });
    this.filterParcels();
  };

  // render collections
  renderCarriers() {
    const { carriers } = this.state;

    return carriers.map((carrier) => (
      <option key={carrier._id}>{carrier.carrierName}</option>
    ));
  }
  renderDeliveryTypes() {
    const { deliveryTypes } = this.state;

    return deliveryTypes.map((deliveryType) => (
      <option key={deliveryType._id}>{deliveryType.deliveryTypeName}</option>
    ));
  }
  renderLocations() {
    const { locations } = this.state;

    return locations.map((location) => (
      <option key={location._id}>{location.locationName}</option>
    ));
  }
  renderUsers() {
    const { users } = this.state;

    return users.map((user) => <option key={user._id}>{user.username}</option>);
  }

  handleChangeChips(chips) {
    if (this.state.barcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ barcode: chips }, () => {
      this.filterParcels();
    });
  }

  handleDeleteChip(chip, index) {
    var chips = this.state.barcode;
    chips.splice(index, 1);
    this.setState({ barcode: chips }, () => {
      this.filterParcels();
    });
  }
  handleClientBarcode(chips) {
    if (this.state.clientUniqueBarcode.includes(chips[chips.length - 1])) {
      alert("This barcode has already been scanned");
      chips.pop();
      return;
    }
    this.setState({ clientUniqueBarcode: chips }, () => {
      this.filterParcels();
    });
  }
  handleDeleteClientBarcode(chip, index) {
    var chips = this.state.clientUniqueBarcode;
    chips.splice(index, 1);
    this.setState({ clientUniqueBarcode: chips }, () => {
      this.filterParcels();
    });
  }
  // toggle
  renderViewToggle() {
    return (
      <div className="view-toggle clearfix">
        <div className="left">
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
        <div className="left">
          <ChipInput
            label={i18n.__(
              "postbag.Type Barcode(Type and hit enter to add multiple barcodes)"
            )}
            value={this.state.barcode}
            onChange={(chips) => this.handleChangeChips(chips)}
            onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
            fullWidth={true}
            allowDuplicates={true}
          />
        </div>

        <div className="right">
          <div className="buttons">
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
    );
  }

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

  filterParcels(recalled) {
    // stupid async
    if (!recalled) {
      return setTimeout(() => {
        this.filterParcels(true);
      }, 0);
    }

    const {
      barcode,
      clientUniqueBarcode,
      clients,
      parcels,
      selectCarrierValue,
      selectLocationValue,
      selectDeliveryUserValue,
      selectDeliveryTypeValue,
      selectItemTypeValue,
    } = this.state;

    let { list, filteredParcels } = this.state;

    const searchParams = {};
    const searchWithBarcodes = {};
    const searchWithClientBarcode = {};
    const reselectTriggers = [
      "clientUniqueBarcode",
      "barcode",
      "carrier",
      "location",
      "deliveryType",
    ];

    if (barcode.length) {
      searchWithBarcodes.barcode = barcode;
    }
    if (clientUniqueBarcode.length) {
      searchWithClientBarcode.clientUniqueBarcode = clientUniqueBarcode;
    }
    if (selectCarrierValue) {
      searchParams.carrier = selectCarrierValue;
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
    if (selectItemTypeValue) {
      if (selectItemTypeValue === "inbound") {
        searchParams.type = selectItemTypeValue;
      }
      if (selectItemTypeValue === "outbound") {
        searchParams.type = selectItemTypeValue;
      }
    }

    const selectedFilters = Object.keys(searchParams);

    // filter parcels
    if (
      selectedFilters.some((filter) => this.prevFilters.hasOwnProperty(filter))
    ) {
      filteredParcels = _.filter(filteredParcels, searchParams);
    } else {
      filteredParcels = _.filter(parcels, searchParams);
    }
    //filter with barcode
    if (!_.isEmpty(searchWithBarcodes)) {
      let BcodefilteredParcels = filteredParcels.filter((filteredParcel) => {
        if (searchWithBarcodes.barcode.includes(filteredParcel.barcode)) {
          return filteredParcel;
        } else {
          return undefined;
        }
      });

      this.setState({
        filteredParcels: BcodefilteredParcels,
      });
    }

    //filter with client barcode
    else if (!_.isEmpty(searchWithClientBarcode)) {
      let clientBcodefilteredParcels = filteredParcels.filter(
        (filteredParcel) => {
          if (
            searchWithClientBarcode.clientUniqueBarcode.includes(
              filteredParcel.clientUniqueBarcode
            )
          ) {
            return filteredParcel;
          } else {
            return undefined;
          }
        }
      );

      this.setState({
        filteredParcels: clientBcodefilteredParcels,
      });
    } else {
      this.setState({
        filteredParcels,
      });
    }
    this.prevFilters = selectedFilters;
  }
  renderParcels() {
    if (!this.state.parcels) return;

    const { filteredParcels, list } = this.state;

    return filteredParcels
      .filter((parcel) => parcel.temp == undefined)
      .map((parcel, index) => {
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
              isGroupClient={this.state.clients[0].clientGroupId != undefined}
            />
          );
        }
        if (this.state.boxView === true) {
          return (
            <SelectableParcelOffline
              key={parcel._id}
              parcel={parcel}
              selectable="true"
              checked={!!list[parcel._id]}
              onChecked={this.onChecked}
              timezone={timeZone.get()}
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
          {/* <div className="form-row"> */}
          {/* <DatePicker textFieldStyle={{width: '100%'}} hintText="From date" value={ this.state.dateFromValue } onChange={ this.handleDateFromChange }/> */}
          {/* </div> */}

          {/* <div className="form-row"> */}
          {/* <DatePicker textFieldStyle={{width: '100%'}} hintText="To date" value={ this.state.dateToValue} onChange={ this.handleDateToChange } /> */}
          {/* </div> */}

          <div className="form-row">
            <SelectVirtualized
              name="carriers"
              placeholder={i18n.__("postbag.Choose Carrier")}
              value={this.state.selectCarrierValue}
              onChange={this.handleCarrierChange}
              options={this.state.carriers}
              defaultValue=""
            />
          </div>

          <div className="form-row">
            <SelectVirtualized
              name="locations"
              placeholder={i18n.__("postbag.Choose Location/Company")}
              value={this.state.selectLocationValue}
              filterOption={createFilter({ ignoreAccents: false })}
              onChange={this.handleLocationChange}
              options={this.state.locations}
              defaultValue=""
            />
          </div>

          <div className="form-row">
            <select
              name="deliveryTypes"
              ref="deliveryTypeSelect"
              defaultValue=""
              value={this.state.selectDeliveryTypeValue}
              onChange={this.handleDeliveryTypeChange}
            >
              <option value="" defaultValue>
                {i18n.__("postbag.Choose Type")}
              </option>
              <option value="Normal">{i18n.__("postbag.Normal")}</option>
              {this.renderDeliveryTypes()}
            </select>
          </div>

          <div className="form-row">
            <select
              name="users"
              ref="deliveryUserSelect"
              defaultValue=""
              value={this.state.selectDeliveryUserValue}
              onChange={this.handleDeliveryUserChange}
            >
              <option value="" defaultValue>
                {i18n.__("postbag.Choose User/Action")}
              </option>
              <option value="Collect from postrubella" defaultValue>
                Collect from postrubella
              </option>
              <option value="Reception">Reception</option>
              <option value="Security">Security</option>
              <option value="Delivery AM">Delivery AM</option>
              <option value="Delivery PM">Delivery PM</option>
              <option value="Delivered Today">Delivered Today</option>
              {this.renderUsers()}
            </select>
          </div>

          <div className="form-row hide">
            <select
              name="deliveryTypes"
              ref="deliveryStatusSelect"
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

          <div className="form-row">
            <select
              name="itemTypes"
              ref="itemTypesSelect"
              defaultValue=""
              value={this.state.selectItemTypeValue}
              onChange={this.handleItemTypeChange}
            >
              <option value="" defaultValue>
                {i18n.__("postbag.Choose Inbound/Outbound")}
              </option>
              <option value="inbound">{i18n.__("postbag.Inbound")}</option>
              <option value="outbound">{i18n.__("postbag.Outbound")}</option>
            </select>
          </div>
        </div>
      );
    }
  }

  handleBarcode() {
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
          (error) => reject(new Error(`Scanning failed: ${error.message}`)),
          {
            //  "showFlipCameraButton" : true,
            //  "prompt" : "Place a barcode inside the scan area",
            orientation: "portrait",
          }
        );
      });
    });

    value.then((barcode) => {
      var chips = this.state.barcode;
      if (chips.includes(barcode.trim())) {
        alert("This barcode has already been scanned");
      }
      chips.push(barcode);
      var chipsTrimmed = chips.map((chip) => chip.trim());
      var chipsFiltered = [...new Set(chipsTrimmed)];
      this.setState({ barcode: chipsFiltered });
      this.filterParcels();
    });
    value.catch((error) => {
      this.setState({ barcode: [] });
      this.filterParcels();
    });
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
        <a
          href={`/add-postbag-confirm/offline/${Object.keys(
            this.state.list
          ).join(",")}`}
        >
          {i18n.__("postbag.Add to My Delivery")}
        </a>
      </div>
    );
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
                {this.state.clients[0].clientGroupId != undefined ? (
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
                <th></th>
                <th>{i18n.__("common.Assign user")}</th>
              </tr>
            </thead>

            <tbody>{this.renderParcels()}</tbody>
          </table>
        </div>
      );
    }
  }

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          onClick={() => this.handleBarcode()}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("postbag.Scan Barcode")}
        </Button>
      </div>
    );
  }

  render() {
    const { syncCoreStatus } = this.state;
    if (this.state.pouchDataReady) {
      if (!syncCoreStatus)
        return (
          <Loading
            message={i18n.__(
              "postbag.Please sync your postrubella before viewing your items"
            )}
            link="/sync"
            color="red"
          />
        );

      return (
        <div>
          {this.renderBarcodeScanner()}

          {this.renderViewToggle()}

          {this.renderSearchFilters()}

          {this.renderParcelContainer()}

          {this.renderBottomBar()}
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
}
