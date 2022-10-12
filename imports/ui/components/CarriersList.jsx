import React, { Component }             from 'react';
import { Meteor }                       from 'meteor/meteor';
import { withTracker }                  from 'meteor/react-meteor-data';
import Carriers                         from '/imports/api/carriers.js';
import GridView                         from '/imports/ui/components/GridView.jsx';
import Button                           from '@material-ui/core/Button';


const publicDir = `${Meteor.settings.public.cdn}/public`;
import '/imports/languages/en/en.carriers.i18n.yml';
import '/imports/languages/de/de.carriers.i18n.yml';
import '/imports/languages/en-JM/en-JM.carriers.i18n.yml';

class CarriersList extends Component {

  constructor(props){
     super(props);

     this.state = {
      load_more: false,
      limit:20,
      searchColumns:{},
     }

  }


  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$and' : [
            { "carrierName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "clientId" : Meteor.user().profile.clientId}
        ]
      };
      this.setState({searchColumns: column_search});
  });

  handleSubmit = (event) => {
    event.preventDefault();

    const carrierName         = this.carrierName.value.trim();
    const currentUserClientId = Meteor.user().profile.clientId;
    const clientId            = currentUserClientId;

    if (carrierName.length    <= 1) return;

    // Validate string
    var regEx = /^[a-zA-Z0-9-_ ]+$/;
    if (!regEx.test(carrierName)) {
      alert(i18n.__("carriers.Special characters not allowed"));
      return;
    }

  //check for a match
    const carrier = Carriers.findOne({
      carrierName: new RegExp(carrierName, 'i'),
    });
   if(carrier) {
    let text = carrier.carrierName.toLowerCase().split(/\s/).join('');
    let newCarrier = carrierName.toLowerCase().split(/\s/).join('');
    if (text == newCarrier) {
      alert(i18n.__("carriers.Carrier already exists"));
      return;
    } 
   }
  //insert new carrier  
    Carriers.insert({
      carrierName,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
      clientId,
    });
    this.carrierName.value = '';
  };
  

  renderCarriersForm() {
    const currentUserId = Meteor.userId();

    if (!Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
      return (
        <div>
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
          initialColumns={['clientId']}
          publications={['carriers']} 
          collection={Carriers} 
          renderComponent={'Carrier'}
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
    return {
     status: Meteor.status()
    };
})(CarriersList);