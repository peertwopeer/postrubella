import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { DeliveryTypes }                from '/imports/api/deliveryTypes.js';
import GridView                         from '/imports/ui/components/GridView.jsx';
import { Clients }                      from '/imports/api/clients.js';
import { withTracker }                  from 'meteor/react-meteor-data';
import Button                           from '@material-ui/core/Button';
import SelectVirtualized                from 'react-virtualized-select';
import _                                from 'lodash';
import memoize                          from 'memoize-one';
import '/imports/languages/en/en.deliver.i18n.yml';
import '/imports/languages/de/de.deliver.i18n.yml';
import '/imports/languages/en-JM/en-JM.deliver.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
// deliveryType list + adding collection
class DeliveryTypesList extends Component {

  constructor(props){
     super(props);

     this.state = {
      load_more: false,
      limit:20,
      selectedClient:'',
      searchColumns:{},
      }
  }

  componentWillUnmount() {
  }

  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$or' : [
          { "deliveryTypeName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
        ]
      };
      this.setState({searchColumns: column_search});
  });

  
  handleSubmit = (event) => {
    event.preventDefault();

    // Find the text field via the React ref
    const clientSelect            = this.state.selectedClient 
    const deliveryTypeName        = this.deliveryTypeName.value.trim()
    
  if (deliveryTypeName.length  <= 0) return;

    const currentUserClientId = Meteor.user().profile.clientId;
    const clientId = clientSelect ? clientSelect.value : currentUserClientId ;
   //check for a match
    const deliveryType = DeliveryTypes.findOne({
      deliveryTypeName: new RegExp(deliveryTypeName, 'i'),
      clientId,
    });
    if(deliveryType) {
      let text = deliveryType.deliveryTypeName.toLowerCase().split(/\s/).join('');
      let newDeliveryType = deliveryTypeName.toLowerCase().split(/\s/).join('');
      if (text == newDeliveryType) {
        console.error(deliveryType, 'already exists!');
        alert(i18n.__("deliver.DeliveryType already exists"))
        return;
      } 
    }
  //insert new deliveryType  
   Meteor.call('deliveryTypes.insert', deliveryTypeName,clientId);
    
    // Clear form
    this.deliveryTypeName.value = '';
  };



  changeClient = ()=>{
    if(this.clientSelect.value !== '0'){
      let column_search = {
        '$or' : [
          { "clientId" : this.clientSelect.value },
        ]
      };
      this.setState({ selectedClient: this.clientSelect.value });
      this.setState({searchColumns: column_search});
    }else{
      let column_search = {};
      this.setState({searchColumns: column_search});
    }
  }
  
   mapItemsForSelect = memoize(item => item.map(({ _id: value, clientName: label }) => ({ value, label })));

  updateClientId = (val) => {
    if (val) {
      val.value = val.value.trim();
    } else {
      return;
    }
    this.setState({ selectedClient: val });
    return val;
  }
  getCurrentClient() {
    const client = this.props.clients[0]

    return !client? null: client._id;
  }
  renderDeliveryTypesForm() {
    const currentUserId = Meteor.userId();
    const selectedClient = this.state.selectedClient? this.state.selectedClient.value: this.getCurrentClient();
    if (!Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
    return (
        <div>
          <div className="form-row">
             <SelectVirtualized
              name="clients"
              placeholder={i18n.__("deliver.Choose Client")}
              value={selectedClient}
              onChange={this.updateClientId}
              options={this.mapItemsForSelect(this.props.clients)}
            />
          </div>
          <form>
          <div className="form-row">
            <input
              type="text"
              ref={c => { this.deliveryTypeName = c; }}
              placeholder={i18n.__("deliver.Add new deliveryType")}
            />
           </div>
          </form> 
          <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
              >{i18n.__("deliver.Add Delivery Type")}
              </Button>
            </div>
          <br />
        {/* Data listing component */}
        <GridView 
          limit={this.state.limit} 
          LimitIncFunction={this.limitIncFunction}
          searchFunction={this.searchcFunction}
          searchColumns={this.state.searchColumns}
          initialColumns={['selectedClient']}
          publications={[['admin.deliveryTypes',selectedClient]]} 
          collection={DeliveryTypes} 
          renderComponent={'DeliveryType'}
          selectedClient={selectedClient}
        />
        </div>
      );
    }
    if (Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
      return (
        <div className="center m2">
                   {i18n.__("common.You are not authorised to view this page")} 
        </div>
      );
    }
  }

  render() {
    const { status } = this.props;
    if(status.connected){
      return (
        <div className="width-narrow">
  
          {this.renderDeliveryTypesForm()}
  
        </div>
      );
    }
    return(
    <div className="width-narrow">
     <div>
     <div className="simple-loader">
        <img src={`${publicDir}/img/loading.gif`} />
     </div>
     <div className="data-processing-message">
        <br></br>
        <b>{i18n.__("common.You are offline check your internet connection and try again")}</b>
     </div>
     </div></div>
    )
  }
}



export default withTracker(() => {
  Meteor.subscribe('clients');

  return {
    clients: Clients.find({}, { sort: [['clientName', 'asc']] }).fetch(),
    status: Meteor.status(),
};
})(DeliveryTypesList);
