import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import SignatureCanvas from "react-signature-canvas";
import moment from "moment-timezone";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Button from "@material-ui/core/Button";
import { Parcels } from "/imports/api/parcels.js";
import SelectableParcel from "/imports/ui/components/SelectableParcel.jsx";
import { Recipients } from "/imports/api/recipients.js";
import InputAutosuggest from "/imports/ui/components/InputAutosuggest.jsx";
import { Clients } from "/imports/api/";
import "/imports/languages/en/en.mydelivery.i18n.yml";
import "/imports/languages/de/de.mydelivery.i18n.yml";
import "/imports/languages/en-JM/en-JM.mydelivery.i18n.yml";
const publicDir = `${Meteor.settings.public.cdn}/public`;
var timeZone = new ReactiveVar(
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
var parcelsList = new ReactiveVar([]);

// Spaces
let spacesFolder = "signatures";

if (Meteor.absoluteUrl().includes("localhost")) {
  spacesFolder = "tmp/signatures";
}
if (Meteor.absoluteUrl().includes("dev.postrubella.org_placeholder.io")) {
  spacesFolder = "tmp/signatures";
}

class PostbagConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: {},
    };
  }

  componentDidMount() {
    this.setState({ list: parcelsList.get() });
    this.scrollToBottom();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  onChecked = (id, isChecked) => {
    const list = parcelsList.get();
    if (!isChecked) {
      delete list[id];
    }
    if (isChecked) {
      list[id] = id;
    }
    this.setState({
      list,
    });
    parcelsList.set(list);
    this.setState({ list });
  };

  scrollToBottom() {
    if (this.postbag) this.postbag.scrollIntoView();
  }

  clearSig = () => {
    this.mySignature.clear();
  };

  acceptSig = (event) => {
    event.preventDefault();

    const signee = this.inputRecipient.getValue();
    const signature = this.mySignature;

    if (signature.isEmpty()) {
      return alert(i18n.__("mydelivery.Please sign for the parcel"));
    }

    if (!signee) {
      return alert(i18n.__("mydelivery.Please provide your name"));
    }

    const recipientSignature = signature.toDataURL();
    // get first parcel to name the signature
    const firstParcel = Object.keys(this.state.list)[0];

    // @TODO: make this more dynamic
    const todayPath = moment().format("YYYY/MM/DD");
    const recipientSignatureImage = `https://postrubella.ams3.digitaloceanspaces.com/${spacesFolder}/${todayPath}/${firstParcel}.png`;

    Meteor.call("s3.signature", recipientSignature, firstParcel, todayPath);
    // TODO: this will not work, guys. parcelId not specified, order of params is wrong. And the same error on whole project.
    // Meteor.call('parcels.update', recipientSignatureImage, signee);

    const parcelIds = Object.keys(parcelsList.get());
    const deliveredAt = new Date();
    const {
      _id: deliveredByOwner,
      username: deliveredByUsername,
      profile,
    } = Meteor.user();

    parcelIds.forEach((parcelId) => {
      Parcels.update(parcelId, {
        $set: {
          recipientSignatureImage,
          signee,
          deliveredAt,
          deliveredByOwner,
          deliveredByUsername,
          updatedAt: deliveredAt,
        },
      });
    });

    // update parcel status if the parcel belongs to client group and
    // send notification email for sender
    for (const parcel of this.props.parcels) {
      if (parcel.destinationId != undefined) {
        Meteor.call(
          "parcelLogs.update",
          {
            status: "delivered",
            parcelId: parcel._id,
            clientId: this.props.currentClient[0]._id,
            clientName: this.props.currentClient[0].clientName,
            destination: parcel.destination,
            destinationId: parcel.destinationId,
            updatedAt: deliveredAt,
          },
          function (error, result) {
            if (error) console.log(error);
          }
        );

        // send email notification to sender
        Meteor.call("clientGroupDelivered", {
          location: parcel.location,
          senderId: parcel.senderId,
          photoName: parcel.photoName,
          type: parcel.type,
          barcode: parcel.barcode,
          clientUniqueBarcode: parcel.clientUniqueBarcode,
          updatedAt: parcel.updatedAt,
          carrier: parcel.carrier,
          recipientName: parcel.recipientName,
          outboundAddress: parcel.outboundAddress,
          deliveryType: parcel.deliveryType,
          numberOfItems: parcel.numberOfItems,
          notes: parcel.notes,
          signee,
          deliveredAt,
          deliveredByOwner,
          deliveredByUsername,
        });
      }
    }
    const locations = this.props.parcels.reduce((uniqueLocations, parcel) => {
      uniqueLocations[parcel.location] = {
        _id: parcel.locationId,
        locationName: parcel.location,
      };

      return uniqueLocations;
    }, {});

    Meteor.call("todayOutboundDelivered", {
      locations: Object.values(locations),
      parcelIds,
      utcOffset: moment().utcOffset(),
    });

    // adding name to db if not already there
    const { clientId } = profile;

    Recipients.insert({
      recipientName: signee,
      createdAt: deliveredAt,
      owner: deliveredByOwner,
      username: deliveredByUsername,
      clientId,
    });
    FlowRouter.go("/" + this.props.redirectUrl);
  };

  attemptedToDeliver = async (event) => {
    event.preventDefault();

    const parcelIds = Object.keys(parcelsList.get());

    await parcelIds.forEach(async (parcelId) => {
      // Clients

      var parcels_details = await Parcels.findOne({ _id: parcelId });

      // console.log("-------- parcels_details for "+parcelId+" ---------------");
      // console.log(parcels_details);
      // console.log("------------------------------------");
      //
      if (
        parcels_details.locationId != "" &&
        typeof parcels_details.locationId != "undefined" &&
        parcels_details.locationId != undefined &&
        parcels_details.locationId != null
      ) {
        // console.log("Location Id : ", parcels_details.locationId);
        // var locations = await Locations.find({ '_id ' : parcels_details.locationId }).fatch();
        //
        //
        // console.log("location : ", location);
        // // var to_email = 'nevil.magnates@gmail.com';
        await Meteor.call("attemptedToDeliverEmail", {
          locationId: parcels_details.locationId,
          utcOffset: moment().utcOffset(),
        });
      } else {
        // alert("mail feature not work on this parcel");
      }

      // Console.log('Get Client ID : '+ parcels_details.username);
      await Parcels.update(parcelId, {
        $push: {
          attemptedToDeliver: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      });
    });
    alert(i18n.__("mydelivery.Email sent to recipient of post"));
    // await Meteor.call('parcels.attemptedToDeliver');
    //
    // alert("Email Sent");
    // TODO: Man. Of course you will get error and update "perfectly" in the same time. You calling two methods for update - on the server by "Meteor.call", but not provide the required attribute 'id' and others data that must be updated in document. Here you see error. At the same performong update on client going well, but it is insecure. Very insecure, Carl.
    // TODO?!: Error invoking Method 'parcels.update': Match failed [400] - However updating perfectly fine.
    // Meteor.call('parcels.update');

    /**
    |----------------------------------------------------
    |   Comment By Nevil
    |----------------------------------------------------
    |
    */
    FlowRouter.go("/" + this.props.redirectUrl);
  };

  renderBottomBar() {
    const countList = Object.keys(this.state.list).length;

    if (countList < 1) {
      return;
    }

    return (
      <div
        ref={(c) => {
          this.postbag = c;
        }}
        className="postbag confirmed clearfix"
      >
        <div className="mb1">
          {i18n.__("mydelivery.You have")} {countList}{" "}
          {i18n.__("mydelivery.parcel(s)")}
        </div>
        <div className="mb1">
          <b>
            {i18n.__(
              "mydelivery.Please fill the recipient name and draw the signature below"
            )}
          </b>
        </div>

        <div className="block-signature">
          <div className="block-signature">
            <div className="form-row">
              <InputAutosuggest
                onRef={(ref) => {
                  this.inputRecipient = ref;
                }}
                getValue={(obj) => obj.recipientName}
                url="autocomplete.recipients"
                placeholder={i18n.__("mydelivery.Type a recipient")}
                onChange={function () {}}
              />
            </div>

            <div className="form-row block-signature-pad">
              <SignatureCanvas
                clearOnResize={false}
                ref={(c) => {
                  this.mySignature = c;
                }}
                canvasProps={{ className: "sigCanvas" }}
                penColor="black"
              />
              <div className="cancel" onClick={this.clearSig}>
                <img src={`${publicDir}/svg/Cancel.svg`} alt="cancel" />
              </div>
            </div>
            <div className="form-row left col col-6">
              <div className="margin-bottom-25">
                <Button
                  color="primary"
                  variant="contained"
                  onClick={this.acceptSig}
                  fullWidth={true}
                >
                  {i18n.__("mydelivery.Deliver Parcel(s)")}
                </Button>
              </div>
            </div>
            <div className="form-row right col col-6">
              <div className="margin-bottom-25">
                <Button
                  color="primary"
                  variant="contained"
                  onClick={this.attemptedToDeliver}
                  fullWidth={true}
                >
                  {i18n.__("mydelivery.Attempted to Deliver")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderParcels() {
    const allParcels = this.props.parcels;
    const isSelected = true;

    return allParcels.map((parcel) => (
      <SelectableParcel
        key={parcel._id}
        parcel={parcel}
        selectable="true"
        checked={isSelected}
        onChecked={this.onChecked}
        timezone={timeZone.get()}
        isGroupClient={this.props.currentClient[0].clientGroupId != undefined}
      />
    ));
  }

  render() {
    if (!this.props.parcelsReady) {
      return <div>{i18n.__("mydelivery.Loading")}</div>;
    }

    return (
      <div>
        <div className="clearfix">
          <ul>{this.renderParcels()}</ul>
        </div>
        {this.renderBottomBar()}
      </div>
    );
  }
}
PostbagConfirm.propTypes = {
  parcels: PropTypes.array.isRequired,
};

// container
export default withTracker(({ parcels, redirectUrl }) => {
  const currentClientSub = Meteor.subscribe("currentClient").ready();
  const parcelSub = Meteor.subscribe("parcelsUndelivered");
  Meteor.subscribe("locations");

  const user = Meteor.user();
  //set timezon
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
  //set parcels list
  const list = {};
  parcels.forEach((parcel) => {
    list[parcel] = parcel;
  });
  parcelsList.set(list);

  return {
    parcelsReady: parcelSub.ready(),
    currentClient: Clients.find().fetch(),
    parcels: Parcels.find(
      { _id: { $in: parcels } },
      { sort: { createdAt: -1 } }
    ).fetch(),
    redirectUrl: redirectUrl,
  };
})(PostbagConfirm);
