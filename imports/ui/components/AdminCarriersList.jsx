import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import SelectVirtualized                from 'react-virtualized-select';
import _                                from 'lodash';
import Carriers                         from '/imports/api/carriers.js';
import { Clients }                      from '/imports/api/clients.js';
import memoize                          from 'memoize-one';
import GridView                         from '/imports/ui/components/GridView.jsx';
import Button                           from '@material-ui/core/Button';

const publicDir = `${Meteor.settings.public.cdn}/public`;
import '/imports/languages/en/en.carriers.i18n.yml';
import '/imports/languages/de/de.carriers.i18n.yml';
import '/imports/languages/en-JM/en-JM.carriers.i18n.yml';

class CarriersList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedClient: null,
      load_more: false,
      limit:20,
      searchColumns:{},
    };

  }

  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$or' : [
          { "carrierName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
        ]
      };
      this.setState({searchColumns: column_search});
  });

  
  componentWillUnmount() {
  }
  handleSubmit = (event) => {
    event.preventDefault();
    const carrierName         = this.carrierName.value.trim();
    const clientId = this.state.selectedClient ? this.state.selectedClient.value : Meteor.user().profile.clientId;
    if (carrierName.length    <= 1) return;

    // Validate string
    var regEx = /^[a-zA-Z0-9-_ ]+$/;
    if (!regEx.test(carrierName)) {
      alert(i18n.__("carriers.Special characters not allowed"));
      return;
    }

    const carrier = Carriers.findOne({
      carrierName: new RegExp(carrierName.toLowerCase(), 'i'),
      clientId,
    });

    if (!carrier) {
      Carriers.insert({
        carrierName,
        createdAt: new Date(),
        owner: Meteor.userId(),
        username: Meteor.user().username,
        clientId,
      });
    } else {
      alert(i18n.__("carriers.Carrier already exists"))
    }
    this.carrierName.value = '';
  };
  

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
    const client = _.find(this.props.clients, { _id: Meteor.user().profile.clientId });

      if(client){
        let currentClient = {
          value: client._id,
          label: client.clientName,
        };
        return currentClient.value;
      }
  }
  renderCarriersForm() {
    const currentUserId = Meteor.userId();

    if (Roles.userIsInRole(currentUserId, ['super-admin'])) {
      const selectedClient = this.state.selectedClient? this.state.selectedClient.value: this.getCurrentClient();
      
      return (
        <div>
          <div className="form-row">
            <SelectVirtualized
              name="clients"
              placeholder={i18n.__("carriers.Choose Client")}
              value={selectedClient}
              onChange={this.updateClientId}
              options={this.mapItemsForSelect(this.props.clients)}
            />
          </div>
          <form>
          <div className="form-row">
            <input
              type="text"
              ref={c => { this.carrierName = c; }}
              placeholder={i18n.__("carriers.Add new carrier")}
            />
            </div>
          </form>
          <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
              > 
              {i18n.__("carriers.Add carrier")} 
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
          publications={[['carriers.admin',selectedClient] ]}
          collection={Carriers} 
          renderComponent={'Carrier'}
          selectedClient={selectedClient}
        />

         
        </div>
      );
    }
    if (!Roles.userIsInRole(currentUserId, ['super-admin'])) {
      return (
        <div className="center m2">
                    {i18n.__("common.You are not authorised to view this page")} 
        </div>
      );
    }
  }
  render() {
    const { status } = this.props;
    return (
      <div className="width-narrow">
       {(!status.connected) ?
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>{i18n.__("common.You are offline check your internet connection and try again")}</b>
            </div></div> : this.renderCarriersForm()}
      </div>
    );
  }
}


export default withTracker(() => {
  Meteor.subscribe('carriers.admin');
  Meteor.subscribe('clients');

  return {
    clients: Clients.find({}, { sort: [['clientName', 'asc']] }).fetch(),
    status: Meteor.status(),
  };
})(CarriersList);