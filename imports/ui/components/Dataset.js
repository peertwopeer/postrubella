import React, { Component }             from 'react';
import { withTracker }                  from 'meteor/react-meteor-data';

import Carriers                         from '/imports/api/carriers.js';
import {DefaultCarriers }               from '/imports/api/defaultCarriers.js'
import { DefaultDeliveryTypes }         from '/imports/api/defaultDeliveryTypes.js';
import { DeliveryTypes}                 from '/imports/api/deliveryTypes.js';
import Button                           from '@material-ui/core/Button';
import { decode }                       from 'html-entities';
import { FlowRouter }                   from 'meteor/ostrio:flow-router-extra';
import '/imports/languages/en/en.client.i18n.yml';
import '/imports/languages/en-JM/en-JM.client.i18n.yml';

function loadFakeData(event) {
  event.preventDefault();

  const currentUserId = Meteor.userId();

  if (Roles.userIsInRole(currentUserId, ['super-admin'])) {
    Meteor.call('fakedata');
  }
  alert('Your fake data has been added. Please remember this may take a while, as it is going to add 50,000.');
}


function loadSenderData() {
  Meteor.call('loadSenderData');
  alert('Your sender data has been added.');
}

class Dataset extends Component {
  constructor(props){
    super(props);

    this.state = {
     carriers:[],
     deliveryTypes:[],
     disableAddCarrier:false,
     disableAdddeliveryType:false,
     recipientsData: '',
     loadRecipients: false,
    }
  }
  
  componentWillUnmount() {
    }

  renderAdminDataset() {
    const countCarriers = this.props.carriers.length;

    if (countCarriers > 0) return null;

    return (
      <div>
        <div onClick={loadFakeData}>Load Fake Data</div>
      </div>
    );
  }
  loadCarrierData = async () => {
   
    const ClientId = FlowRouter.getParam("_id")
    const countCarriers = await Carriers.find({ clientId: ClientId }, {limit: 2 }).count();
    if (countCarriers > 1) {
      alert(i18n.__("client.Carriers already exist")); 
      this.setState({disableAddCarrier: true})
      return;
    };
    const user = Meteor.user()
    const carrierData = this.props.carriersData
    carrierData.forEach((carrier) => {
      Carriers.insert({
        carrierName: carrier.carrierName,
        clientId: ClientId,
        owner: user._id,
        username: user.username,
        createdAt: new Date(),
        
      });
    });
   
    alert(i18n.__("client.Your carrier data has been added"));
    this.setState({disableAddCarrier: true})
   
  }
  loadDeliveryTypesData = async () => {
    
    const ClientId = FlowRouter.getParam("_id")
    const countDeliveryType = await DeliveryTypes.find({ clientId : ClientId },{limit:2}).count();
    if (countDeliveryType > 1) {
      alert(i18n.__("client.DeliveryTypes already exist")); 
      this.setState({disableAdddeliveryType: true});
      return;
    };
    const user = Meteor.user()
    const deliveryTypeData = this.props.deliveryTypesData
   
    deliveryTypeData.forEach((deliveryType) => {
      DeliveryTypes.insert({
      deliveryTypeName: deliveryType.DeliveryTypeName,
      clientId : ClientId,
      owner: user._id,
      username: user.username,
      createdAt: new Date(),
      });
    });
   
    alert(i18n.__("client.Your DeliveryTypes data has been added"));
    this.setState({disableAdddeliveryType: true})
  }
  renderCarrierDataset() {
    const countCarriers = this.props.carriers.length;

    if (countCarriers > 0) return null;

    return (
      <div>
        <div onClick={loadCarrierData}>Add Carrier Data</div>
      </div>
    );
  }
  
  renderSenderDataset() {
    const countSenders = this.props.senders.length;

    if (countSenders > 0) return null;

    return (
      <div>
        <div onClick={loadSenderData}>Add Sender Data</div>
      </div>
    );
  }
redirectToClient =() =>{
  FlowRouter.go('/clients')
}
//upload csv 
onCSVChange = (event) =>{
    var fileType = event.target.files[0].type;
    //validate input file
    if(fileType === 'text/csv'){
      this.setState({recipientsData: event.target.files[0]})
    }
    else{
      alert(htmlEntities.decode(i18n.__("client.The uploaded file is not valid please follow the instruction")))
      this.csvFile.value = '';
    }
};
loadRecipientsData = (event) =>{
    const ClientId = FlowRouter.getParam("_id")
    if(this.state.recipientsData === '' || this.state.recipientsData === undefined){
      return alert(i18n.__("client.Please choose a file to upload"))
    }
    this.setState({ loadRecipients: true });
      let thisComponent = this;
      Papa.parse( this.state.recipientsData, {
        header: true,
        skipEmptyLines: true,
        complete( results, file ) {
          Meteor.call( 'recipients.uploadData', results.data, ClientId, ( error, response ) => {
            if ( error ) {
             console.log(error)
            } else {
              alert(i18n.__("client.Your Recipients data has been added"));
            }
            thisComponent.setState({ loadRecipients: false })
          })
        }
      })
        this.setState({recipientsData: ''});
        this.csvFile.value = '';   
  }
  render() {
    return (
      <div className="width-narrow clearfix">
          
          <div className="form-row">
              <Button
                onClick={this.loadCarrierData}
                disabled={this.state.disableAddCarrier}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
              {i18n.__("client.Add default carriers")}
              </Button>
            </div>
            <br></br>
            <div className="form-row">
              <Button
                onClick={this.loadDeliveryTypesData}
                disabled={this.state.disableAdddeliveryType}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
              {i18n.__("client.Add default deliverytypes")}
              </Button>
            </div>
            <br/>
            <div>
            <label><span className={"client-form-logo-label"}>{i18n.__('client.Upload Recipients')}</span></label>
            <br></br>
                <p className={"client-form-logo-description"}>{decode(i18n.__('client.Instructions for uploading recipients'))}</p>
                <input
                 type="file"
                 onChange={this.onCSVChange}
                 ref={c => { this.csvFile = c; }}
                /> 
            </div>
            <br></br>
            <div className="form-row">
              <Button
                onClick={this.loadRecipientsData}
                fullWidth={true}
                color="primary"
                variant="contained"
                disabled={this.state.loadRecipients}
              >
              {i18n.__("client.Add Recipients")}
              </Button>
            </div>
            <br></br>
            <div className="form-row">
              <Button
                onClick={this.redirectToClient}
                fullWidth={true}
                color="primary"
                variant="contained"
              >
              {i18n.__("client.Back to Client Page")}
              </Button>
            </div>
        {/* { this.renderAdminDataset() } */}

        {/* { this.renderCarrierDataset() } */}

        {/* { this.renderSenderDataset() } */}

      </div>
    );
  }
}

export default withTracker(() => {
  const clientId = FlowRouter.getParam('_id');
  Meteor.subscribe('defaultCarriers');
  Meteor.subscribe('defaultDeliveryTypes');
  Meteor.subscribe('carriers',clientId);
  Meteor.subscribe('deliveryTypes',clientId);
  
  const user = Meteor.user();
  const query = {};
  
  if (user) query.clientId = user.profile.clientId;
  return {
    carriersData: DefaultCarriers.find({}).fetch(),
    deliveryTypesData: DefaultDeliveryTypes.find({}).fetch(),
    };
})(Dataset);

