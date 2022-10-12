import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";
import ChipInput from "material-ui-chip-input";
import SelectVirtualized from "react-virtualized-select";
import { createFilter } from "react-select";
import Button from "@material-ui/core/Button";
import org_placeholderTriangle from "/imports/ui/components/icons/org_placeholderTriangle";
import SelectableParcelRow from "/imports/ui/components/SelectableParcelRow.jsx";
import { Loading } from "/imports/ui/components/";
import fetchPouchDB from "../../client/cordova/fetchPouchDB";
import SelectableParcelOffline from "/imports/ui/containers/SelectableParcelOffline.js";
import "/imports/languages/en/en.postrubella.i18n.yml";
import "/imports/languages/de/de.postrubella.i18n.yml";
import "/imports/languages/en-JM/en-JM.postrubella.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
export default class postrubellaList extends Component {
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
      // dateFromValue            : undefined,
      // dateToValue              : undefined,
      listView: true,
      boxView: false,
      showSearchFilters: true,
      parcels: null,
      carriers: [],
      locations: [],
      deliveryTypes: null,
      users: null,
      clients: null,
      checked: false,
      pouchDataReady: false,
    };
    this.list = {};
    this.prevFilters = {};
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
  fixView() {
    // @FIXME Make more reactive
    if (window.innerWidth <= 960) {
      this.setState({
        listView: false,
        boxView: true,
      });
    }
  }
  componentDidMount() {
    this.fetchCoreData();
    this.fixView();

    // console.log(Session.get('timezone'))
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
      "recipientName",
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
  handleDeliveryStatusChange = (event) => {
    this.setState({ selectDeliveryStatusValue: event.target.value });
    this.filterParcels();
  };
  handleItemTypeChange = (event) => {
    this.setState({ selectItemTypeValue: event.target.value });
    this.filterParcels();
  };

  renderDeliveryTypes() {
    const { deliveryTypes } = this.state;

    return deliveryTypes.map((deliveryType) => (
      <option key={deliveryType._id}>{deliveryType.deliveryTypeName}</option>
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
              "postrubella.Type Client UniqueBarcode(Type and hit enter to add multiple barcodes)"
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
              "postrubella.Type Barcode(Type and hit enter to add multiple barcodes)"
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
    this.setState({ showSearchFilters: !this.state.showSearchFilters });
  };

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

        return (
          <SelectableParcelOffline
            selectAll={this.state.checked}
            key={parcel._id}
            parcel={parcel}
            selectable="true"
            checked={!!list[parcel._id]}
            onChecked={this.onChecked}
            timezone={timeZone.get()}
          />
        );
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
              name="locations"
              placeholder={i18n.__("postrubella.Choose Carrier")}
              value={this.state.selectCarrierValue}
              onChange={this.handleCarrierChange}
              options={this.state.carriers}
              defaultValue=""
            />
          </div>

          <div className="form-row">
            <SelectVirtualized
              name="locations"
              filterOption={createFilter({ ignoreAccents: false })}
              placeholder={i18n.__("postrubella.Choose Location/Company")}
              value={this.state.selectLocationValue}
              onChange={this.handleLocationChange}
              options={this.state.locations}
            />
          </div>

          <div className="form-row">
            <select
              name="deliveryTypes"
              defaultValue=""
              value={this.state.selectDeliveryTypeValue}
              onChange={this.handleDeliveryTypeChange}
            >
              <option value="" defaultValue>
                {i18n.__("postrubella.Choose Type")}
              </option>
              <option value="Normal">{i18n.__("postrubella.Normal")}</option>
              {this.renderDeliveryTypes()}
            </select>
          </div>

          <div className="form-row">
            <select
              name="users"
              defaultValue=""
              value={this.state.selectDeliveryUserValue}
              onChange={this.handleDeliveryUserChange}
            >
              <option value="" defaultValue>
                {i18n.__("postrubella.Choose User/Action")}
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
              defaultValue=""
              value={this.state.selectDeliveryStatusValue}
              onChange={this.handleDeliveryStatusChange}
            >
              <option value="" defaultValue>
                {i18n.__("postrubella.Choose status")}
              </option>
              <option value="delivered">
                {i18n.__("postrubella.Delivered")}
              </option>
              <option value="undelivered">
                {i18n.__("postrubella.Undelivered")}
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
                {i18n.__("postrubella.Choose Inbound/Outbound")}
              </option>
              <option value="inbound">{i18n.__("postrubella.Inbound")}</option>
              <option value="outbound">
                {i18n.__("postrubella.Outbound")}
              </option>
            </select>
          </div>
        </div>
      );
    }
  }

  renderParcelContainer() {
    if (this.state.boxView === true) {
      return <div className="parcel-container">{this.renderParcels()}</div>;
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
                    type="checkbox"
                    checked={this.state.checked}
                  />
                </th>
                <th>{i18n.__("postrubella.Barcode/ID")}</th>
                <th>{i18n.__("postrubella.Carrier")}</th>
                <th>{i18n.__("postrubella.Sender")}</th>
                <th>{i18n.__("postrubella.Action")}</th>
                {this.state.clients[0].clientGroupId != undefined ? (
                  <>
                    <th>{i18n.__("postrubella.Destination")}</th>
                    <th>{i18n.__("postrubella.Last Processed")}</th>
                  </>
                ) : null}
                <th>{i18n.__("postrubella.Location")}</th>
                <th>{i18n.__("postrubella.Recipient/Addressee")}</th>
                <th>{i18n.__("postrubella.Received At")}</th>
                <th>{i18n.__("postrubella.Number of Items")}</th>
                <th>{i18n.__("postrubella.Delivered At")}</th>
                <th>{i18n.__("postrubella.Outbound Address")}</th>
                <th>{i18n.__("postrubella.Notes")}</th>
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
            reject(
              new Error(i18n.__("postrubella.Scanning failed:")`${error}`)
            );
          },
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
          {i18n.__("postrubella.You have")} {countList}
        </div>
        <a
          href={`/postbag-confirm/offline/${Object.keys(this.state.list).join(
            ","
          )}?redirect_url=postrubella/offline`}
        >
          {i18n.__("postrubella.Deliver Parcel(s)")}
        </a>
      </div>
    );
  }

  renderBarcodeScanner() {
    if (!Meteor.isCordova) return;

    return (
      <div className="form-row">
        <Button
          onClick={() => this.handleClick()}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("postrubella.Scan Barcode")}
        </Button>
      </div>
    );
  }
  renderAllSelectOption() {
    if (!Meteor.isCordova) return;
    if (this.state.filteredParcels.length < 1) return;

    return (
      <div className="form-row">
        <Button
          onClick={this.toggleCheckboxes}
          fullWidth={true}
          color="primary"
          variant="contained"
        >
          {i18n.__("postrubella.Select All")}
        </Button>
      </div>
    );
  }

  toggleCheckboxes = () => {
    this.setState({ checked: !this.state.checked });
  };

  render() {
    const { syncStatus } = this.state;
    if (this.state.pouchDataReady) {
      if (!syncStatus)
        return (
          <Loading
            message={i18n.__(
              "postrubella.Please sync your postrubella before viewing your items"
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

          {this.renderAllSelectOption()}

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
