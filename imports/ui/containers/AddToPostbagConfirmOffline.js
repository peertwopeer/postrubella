import React, { Component }                   from 'react';
import PropTypes                              from 'prop-types';
import { withTracker }                        from 'meteor/react-meteor-data';
import { getParcelsDb }                       from '../../lib/PouchDB';
import { FlowRouter }                         from 'meteor/ostrio:flow-router-extra';
import fetchPouchDB                           from '/imports/client/cordova/fetchPouchDB';
import Button                                 from '@material-ui/core/Button';
import SelectableParcelOffline                from '/imports/ui/containers/SelectableParcelOffline.js';
import { Loading } from '/imports/ui/components/';
import { Meteor } from 'meteor/meteor';

import '/imports/languages/en/en.deliverparcel.i18n.yml';
import '/imports/languages/de/de.deliverparcel.i18n.yml';
import '/imports/languages/en-JM/en-JM.deliverparcel.i18n.yml';

var timeZone = new ReactiveVar(Intl.DateTimeFormat().resolvedOptions().timeZone);
class AddToPostbagConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parcels: [],
      currentUser: null,
      list: props.parcelsIds.reduce((obj, item) => {
        obj[item] = item;

        return obj;
      }, {}),
    };
  }

  async fetchCoreData() {
    const pouchData = await fetchPouchDB();
    const { parcelsIds } = this.props;
    
    if(pouchData.currentUser){
      //set timezone
      if((typeof pouchData.currentUser.timezone !== 'undefined') && (pouchData.currentUser.timezone !== '')){
        timeZone.set(pouchData.currentUser.timezone);
      }
      else if((typeof pouchData.clients[0].defaultTimeZone !== 'undefined') && (pouchData.clients[0].defaultTimeZone !== '')){
            timeZone.set(pouchData.clients[0].defaultTimeZone)
      }
    }
    pouchData.parcels = pouchData.parcels.filter(parcel => parcelsIds.includes(parcel._id));
    this.setState(pouchData);
  }

  componentDidMount() {
    this.fetchCoreData();
  }

  renderParcels() {
    const allParcels  = this.state.parcels;
    const isSelected = true;

    return allParcels.map((parcel) => (
      <SelectableParcelOffline
        key={parcel._id}
        parcel={parcel}
        selectable="true"
        checked={isSelected}
        onChecked={this.onChecked}
        timezone={timeZone.get()}
      />
    ));
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

  renderBottomBar() {
    const countList = Object.keys(this.state.list).length;

    if (countList < 1) return;

    return (
      <div className="postbag confirmed clearfix">

        <div className="mb1">{i18n.__("deliverparcel.You have")} {countList} {i18n.__("deliverparcel.parcel(s)")}</div>

        <div className="form-row">
          <div className="margin-bottom-65">
            <Button
              onClick={this.addToPostbag}
              fullWidth={true}
              color="primary"
              variant="contained"
            >
            {i18n.__("deliverparcel.Add to My Delivery")}
            </Button>
          </div>
        </div>

      </div>
    );
  }

  addToPostbag = async (event) => {
    event.preventDefault();

    const { currentUser, list } =  this.state;
    const postbagOwner = currentUser.owner;
    const parcelIds = Object.keys(list);
    let parcelsDb;
    let parcelsOffline = Session.get('parcelsOffline') || [];

    try {
      parcelsDb = await getParcelsDb();
      for (const parcelId of parcelIds) {
        const parcel = await parcelsDb.get(parcelId).catch(e => {
          if (e.status === 404) return {};

          throw e;
        });

        parcel.postbagOwner = postbagOwner;
        parcel.offline = true;
        await parcelsDb.put(parcel);
        parcelsOffline = parcelsOffline.filter(parc => parc._id !== parcelId);
        parcelsOffline.push(parcel);
        Session.set('parcelsOffline', parcelsOffline);
      }

      FlowRouter.go('/add/offline');
    } catch (err) {
      console.error(err);
      Meteor.call('sendToSlack', `App add to postbag Error: ${err.message}. \n${getAppInfo()}`);
    }
  }

  render() {
    const {
      syncCoreStatus,
    } = this.state;

    if (!syncCoreStatus) return <Loading message={i18n.__("deliverparcel.loading")} />;

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


export default withTracker(({ parcels }) => {
  return {parcelsIds: parcels}
})(AddToPostbagConfirm);
