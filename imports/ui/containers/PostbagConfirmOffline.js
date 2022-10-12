import React, { Component }             from 'react';
import PropTypes                        from 'prop-types';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import { getParcelsDb }                 from '../../lib/PouchDB';
import { FlowRouter }                   from 'meteor/ostrio:flow-router-extra';
import SignatureCanvas                  from 'react-signature-canvas'
import Button                           from '@material-ui/core/Button';
import SelectableParcelOffline          from '/imports/ui/containers/SelectableParcelOffline.js';
import { Loading }                      from '/imports/ui/components/';
import fetchPouchDB                     from '../../client/cordova/fetchPouchDB';
import '/imports/languages/en/en.mydelivery.i18n.yml';
import '/imports/languages/de/de.mydelivery.i18n.yml';
import '/imports/languages/en-JM/en-JM.mydelivery.i18n.yml';
const publicDir = `${Meteor.settings.public.cdn}/public`;
var timeZone = new ReactiveVar(Intl.DateTimeFormat().resolvedOptions().timeZone);
class PostbagConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parcels: null,
      currentUser: null,

      list: this.props.parcelsIds.reduce((obj, item) => {
        obj[item] = item;

        return obj;
      }, {}),

      syncStatus: false,
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
    delete pouchData.list;
    pouchData.parcels = pouchData.parcels.filter(parcel => parcelsIds.includes(parcel._id));
    this.setState(pouchData);
  }

  componentDidMount() {
    this.fetchCoreData();
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
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

  scrollToBottom() {
    if (this.postbag) this.postbag.scrollIntoView();
  }

  renderBottomBar() {
    const countList = Object.keys(this.state.list).length;

    if (countList < 1) {
      return;
    }

    return (
      <div ref={c => { this.postbag = c; }} className="postbag confirmed clearfix">

        <div className="mb1">{i18n.__("mydelivery.You have")}{countList} {i18n.__("mydelivery.parcel(s)")}</div>
        <div className="mb1"><b>{i18n.__("mydelivery.Please fill the recipient name and draw the signature below")}</b></div>

        <div className="block-signature">
          <div className="block-signature">
            <div className="form-row">
              <input
                type="text"
                ref={c => { this.recipientInput = c; }}
                placeholder={i18n.__("mydelivery.Type signee's name")}
              />
            </div>
            <div className="form-row block-signature-pad">
            <SignatureCanvas clearOnResize={false} ref={c => { this.mySignature = c; }} canvasProps={{ className: 'sigCanvas' }} penColor='black' />
              <div className="cancel" onClick={this.clearSig}><img src={`${publicDir}/svg/Cancel.svg`} /></div>
            </div>
            <div className="clearfix">
             <div className="sm-col sm-col-6">
             <div className="margin-bottom-25">
                  <Button
                    onClick={this.acceptSig}
                    fullWidth={true}
                    color="primary"
                    variant="contained"
                    className="full-height"
                  >
                  {i18n.__("mydelivery.Deliver Parcel(s)")}
                  </Button>
                </div>
              </div>
              <div className="sm-col sm-col-6">
                <div className="margin-bottom-25">
                    <Button
                    onClick={this.attemptedToDeliver}
                    fullWidth={true}
                    color="primary"
                    variant="contained"
                    className="full-height"
                  >
                  {i18n.__("mydelivery.Attempted to Deliver")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }


  // sig
  clearSig = () => {
    this.mySignature.clear();
  };

  /**
   * deliver parcel
   * Accepts signee and signature and set parcel delivered data.
   *
   * TODO: detect reasons of error: App: deliver parcel Error: missing. Parcel: `undefined`.
   * @memberof PostbagConfirm
   */
  acceptSig = async (event) => {
    event.preventDefault();

    const { currentUser, list } =  this.state;

    const signature = this.mySignature;

    if (signature.isEmpty()) {
      return alert(i18n.__("mydelivery.Please sign for the parcel"));
    }
    const recipientSignature = signature.toDataURL();
    const signee = this.recipientInput.value.trim();

    if (!signee) {
      return alert(i18n.__("mydelivery.Please provide your name"));
    }

    let parcelsDb;
    let parcelsOffline = Session.get('parcelsOffline') || [];
    const parcelIds = Object.keys(list);

    console.log(parcelIds);

    try {
      parcelsDb = await getParcelsDb();
      await Promise.all(parcelIds.map(async (parcelId) => {
        let parcel;

        try {
          parcel = await parcelsDb.get(parcelId);
          parcel.deliveredAt = new Date();
          parcel.deliveredByOwner = currentUser.owner;
          parcel.deliveredByUsername = currentUser.username;
          parcel.recipientSignature = recipientSignature;
          parcel.signee = signee;
          parcel.offline = true;
          parcelsOffline = parcelsOffline.filter(parc => parc._id !== parcelId);
          parcelsOffline.push(parcel);
          Session.set('parcelsOffline', parcelsOffline);
          await parcelsDb.put(parcel);
        } catch (err) {
          console.error('deliver parcel:', err, 'parcel', parcel);
          Meteor.call('sendToSlack', `App: deliver parcel Error: ${err.message}. \n ${getAppInfo()}`);
        }
      }));
      FlowRouter.go('/'+this.props.redirectUrl);
    } catch (err) {
      console.error(err);
      Meteor.call('sendToSlack', `App deliver parcel Error: ${err.message}. \n${getAppInfo()}`);
    }
  };

  attemptedToDeliver = async (event) => {
    event.preventDefault();

    const { list } =  this.state;
    const parcelIds = Object.keys(list);
    let parcelsDb;
    let parcelsOffline = Session.get('parcelsOffline') || [];

    console.log(parcelIds);

    try {
      parcelsDb = await getParcelsDb();
      await Promise.all(parcelIds.map(async (parcelId) => {
        let parcel;

        try {
          parcel = await parcelsDb.get(parcelId);

          let { attemptedToDeliver } = parcel;

          if (!attemptedToDeliver) {
            attemptedToDeliver = [];
          }
          attemptedToDeliver.push(new Date());
          parcel.attemptedToDeliver = attemptedToDeliver;
          parcel.offline = true;
          parcelsOffline = parcelsOffline.filter(parc => parc._id !== parcelId);
          parcelsOffline.push(parcel);
          Session.set('parcelsOffline', parcelsOffline);
          await parcelsDb.put(parcel);
        } catch (err) {
          console.error('attempt to deliver parcel:', err, parcel);
          Meteor.call('sendToSlack', `App attempt to deliver Error: ${err.message}. \n${getAppInfo()}`);
        }
      }));
      FlowRouter.go('/'+this.props.redirectUrl);
    } catch (err) {
      console.error('attempt to deliver parcel:', err);
      Meteor.call('sendToSlack', `App attempt to deliver Error: ${err.message}. \n${getAppInfo()}`);
    }
  }

  render() {
    const {
      syncStatus,
    } = this.state;

    if (!syncStatus) return <Loading message={i18n.__('mydelivery.Loading')} />;

    return (
      <div>
          <div className="clearfix">
            <ul>{this.renderParcels()}</ul>
          </div>
          { this.renderBottomBar() }
      </div>
    );
  }
}
PostbagConfirm.propTypes = {
  parcels: PropTypes.array.isRequired,
};

export default withTracker(({ parcels, redirectUrl }) => {
  return {parcelsOffline: Session.get('parcelsOffline'), parcelsIds: parcels, redirectUrl:redirectUrl}
})(PostbagConfirm);
