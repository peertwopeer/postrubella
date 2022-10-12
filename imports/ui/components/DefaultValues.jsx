// npm
import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import Button from "@material-ui/core/Button";
// collections
import { Clients } from "/imports/api/clients.js";

import {
  Carriers,
  Senders,
  Locations,
  DeliveryTypes,
  Recipients,
} from "/imports/api/";

import "/imports/languages/en/en.client.i18n.yml";
import "/imports/languages/de/de.client.i18n.yml";
import "/imports/languages/en-JM/en-JM.client.i18n.yml";

const publicDir = `${Meteor.settings.public.cdn}/public`;
// client list + adding collection
class DefaultValues extends Component {
  constructor(props) {
    super(props);

    this.state = {
      load_more: false,
      limit: 20,
      searchColumns: {},
      selectDeliveryTypeValue: "",
      deliveryUserSelect: "",
      selectDeliveryReceiveUser: "",
    };
  }

  handleDeliveryTypeChange = (event) => {
    this.setState({ selectDeliveryTypeValue: event.target.value });
  };

  handleDeliveryUserChange = (event) => {
    this.setState({ deliveryUserSelect: event.target.value });
  };

  handleDeliveryReceiveUserChange = (event) => {
    this.setState({ selectDeliveryReceiveUser: event.target.value });
  };

  renderDeliveryTypes() {
    const allDeliveryTypes = this.props.deliveryTypes;
    return allDeliveryTypes.map((deliveryType) => (
      <option
        key={deliveryType._id}
        hidden={
          this.props.currentClient[0].deliveryType ==
          deliveryType.deliveryTypeName
        }
      >
        {deliveryType.deliveryTypeName}
      </option>
    ));
  }

  renderUsers() {
    const users = this.props.allUsers;

    return users.map((user) => (
      <option
        key={user._id}
        hidden={this.props.currentClient[0].deliveryUser == user.username}
      >
        {user.username}
      </option>
    ));
  }
  renderReceiveUsers() {
    const users = this.props.allUsers;

    return users.map((user) => (
      <option
        key={user._id}
        hidden={this.props.currentClient[0].receiveUser == user.username}
      >
        {user.username}
      </option>
    ));
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    const clientId = this.props.currentClient[0]._id;

    const deliveryType = this.deliveryTypeSelect.value.trim();
    const deliveryUser = this.deliveryUserSelect.value.trim();
    const receiveUser = this.deliveryReceiveUserSelect.value.trim();

    Meteor.call(
      "clients.update.defaultValues",
      clientId,
      deliveryType,
      deliveryUser,
      receiveUser,
      function () {
        alert("Default values updated.");
      }
    );
  };

  renderClientsForm() {
    const currentUserId = Meteor.userId();

    if (
      Roles.userIsInRole(currentUserId, ["client-manager", "location-manager"])
    ) {
      return (
        <div>
          <form>
            <div className="form-row">
              <select
                name="deliveryTypes"
                ref={(c) => {
                  this.deliveryTypeSelect = c;
                }}
                defaultValue={
                  this.props.currentClient[0].deliveryType
                    ? this.props.currentClient[0].deliveryType
                    : i18n.__("client.Set a default Delivery Type")
                }
                onChange={this.handleDeliveryTypeChange}
                required
              >
                <option
                  value={
                    this.props.currentClient[0].deliveryType
                      ? this.props.currentClient[0].deliveryType
                      : ""
                  }
                  defaultValue
                >
                  {this.props.currentClient[0].deliveryType
                    ? this.props.currentClient[0].deliveryType
                    : i18n.__("client.Set a default Delivery Type")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryType ==
                    i18n.__("client.Normal")
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
                // defaultValue={this.props.currentClient[0].deliveryUser?this.props.currentClient[0].deliveryUser:"Set a default Assign Action"}
                onChange={this.handleDeliveryUserChange}
                required
              >
                <option
                  value={
                    this.props.currentClient[0].deliveryUser
                      ? this.props.currentClient[0].deliveryUser
                      : ""
                  }
                  defaultValue
                >
                  {this.props.currentClient[0].deliveryUser
                    ? this.props.currentClient[0].deliveryUser
                    : i18n.__("client.Set a default Assign Action")}
                </option>

                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Collect from postrubella")
                  }
                  value="Collect from postrubella"
                >
                  {i18n.__("client.Collect from postrubella")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Reception")
                  }
                  value="Reception"
                >
                  {i18n.__("client.Reception")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Security")
                  }
                  value="Security"
                >
                  {i18n.__("client.Security")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Delivery AM")
                  }
                  value="Delivery AM"
                >
                  {i18n.__("client.Delivery AM")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Delivery PM")
                  }
                  value="Delivery PM"
                >
                  {i18n.__("client.Delivery PM")}
                </option>
                <option
                  hidden={
                    this.props.currentClient[0].deliveryUser ==
                    i18n.__("client.Delivered Today")
                  }
                  value="Delivered Today"
                >
                  {i18n.__("client.Delivered Today")}
                </option>
                {this.renderUsers()}
              </select>
            </div>

            <div className="form-row">
              <select
                name="users"
                ref={(c) => {
                  this.deliveryReceiveUserSelect = c;
                }}
                defaultValue={
                  this.props.currentClient[0].receiveUser
                    ? this.props.currentClient[0].receiveUser
                    : i18n.__("client.Set a default Receiving Action")
                }
                onChange={this.handleDeliveryReceiveUserChange}
              >
                <option
                  value={
                    this.props.currentClient[0].receiveUser
                      ? this.props.currentClient[0].receiveUser
                      : ""
                  }
                  defaultValue
                >
                  {this.props.currentClient[0].receiveUser
                    ? this.props.currentClient[0].receiveUser
                    : i18n.__("client.Set a default Receiving Action")}
                </option>
                {this.renderReceiveUsers()}
              </select>
            </div>
            <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
                {i18n.__("client.Update Default Values")}
              </Button>
            </div>
          </form>
          <br />
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
      return this.props.currentClientSub ? (
        <div className="width-narrow">{this.renderClientsForm()}</div>
      ) : (
        <div></div>
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
  Meteor.subscribe("deliveryTypes");
  Meteor.subscribe("allUsers");
  const currentClientSub = Meteor.subscribe("currentClient").ready();
  const user = Meteor.user();
  const query = {};

  if (user) query.clientId = user.profile.clientId;

  return {
    currentClient: Clients.find({}).fetch(),
    deliveryTypes: DeliveryTypes.find(query).fetch(),
    allUsers: Meteor.users.find({}).fetch(),
    currentClientSub: currentClientSub,
    status: Meteor.status(),
  };
})(DefaultValues);
