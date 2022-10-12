import React, { Component }             from 'react';
import PropTypes                        from 'prop-types';
import { FlowRouter }                   from 'meteor/ostrio:flow-router-extra';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import Button                           from '@material-ui/core/Button';
import { Parcels }                      from '/imports/api/parcels.js';
import SelectableParcel                 from '/imports/ui/components/SelectableParcel.jsx';
import {
  Clients
} from '/imports/api/';

import '/imports/languages/en/en.deliverparcel.i18n.yml';
import '/imports/languages/de/de.deliverparcel.i18n.yml';
import '/imports/languages/en-JM/en-JM.deliverparcel.i18n.yml';

var timeZone = new ReactiveVar(Intl.DateTimeFormat().resolvedOptions().timeZone);
var parcelsList = new ReactiveVar([]);
class AddToPostbagConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list:[]
    };
  }

  componentDidMount(){
    this.setState({list:parcelsList.get()});
  }
  
  renderParcels() {
    const allParcels  = this.props.parcels;
    const isSelected = true;

    return allParcels.map(parcel => (
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

  onChecked = (id, isChecked) => {
    const list = parcelsList.get();
    if (!isChecked) {
      delete list[id];
    }
    if (isChecked) {
      list[id] = id;
    }
    parcelsList.set(list);
    this.setState({ list });
  };

  renderBottomBar() {
    const countList = Object.keys(this.state.list).length;

    if (countList < 1) {
      return;
    }

    return (
      <div className="postbag confirmed clearfix">

        <div className="mb1">{i18n.__("deliverparcel.You have")} {countList} {i18n.__("deliverparcel.parcel(s)")}</div>

        <div className="form-row margin-bottom-25">
          <Button  color="primary" onClick={this.addToPostbag} fullWidth={true} variant="contained">
          {i18n.__("deliverparcel.Add to My Delivery")}
          </Button>
        </div>

      </div>
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  addToPostbag = (event) => {
    event.preventDefault();

    const postbagOwner = Meteor.userId();

    // oh man.. where is parcel id? This was and will never work without it!
    //Meteor.call('parcels.update', postbagOwner);
    const parcelIds = Object.keys(parcelsList.get());

    parcelIds.forEach((parcelId) => {
      Parcels.update(parcelId, {
        $set: {
          postbagOwner,
          updatedAt: new Date(),
        },
      });
    });
    FlowRouter.go('/add');
  };

  render() {
    if (!this.props.parcelsReady) {
      return (
        <div>{i18n.__("deliverparcel.loading")}</div>
      );
    }

    return (
      <div>

        <form>

          <div className="clearfix">
            <ul>{this.renderParcels()}</ul>
          </div>

          { this.renderBottomBar() }

        </form>

      </div>
    );
  }
}
AddToPostbagConfirm.propTypes = {
  parcels: PropTypes.array.isRequired,
};


// container
export default withTracker(({ parcels }) => {
  const currentClientSub  = Meteor.subscribe('currentClient').ready();
  const parcelSub  =  Meteor.subscribe('parcelsUndelivered');
  const user = Meteor.user();
  //set timezone 
  if(currentClientSub) {
    const currentClient = Clients.find({}).fetch();
    
    if (user){
      if((typeof user.profile.timezone !== 'undefined') && (user.profile.timezone !== '')){
        timeZone.set(user.profile.timezone)
      }
      else if((typeof currentClient[0].defaultTimeZone !== 'undefined') && (currentClient[0].defaultTimeZone !== '')){
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
    parcels: Parcels.find({ _id: { $in: parcels }, recipientSignature: null }, { sort: { createdAt: -1 } }).fetch(),
  };
})(AddToPostbagConfirm);
