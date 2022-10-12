// npm
import React, { Component }  from 'react';
import { Meteor }            from 'meteor/meteor';
import { withTracker }       from 'meteor/react-meteor-data';
import Button                from '@material-ui/core/Button';

// collections
import { Locations } from '/imports/api/locations.js';
import GridView from '/imports/ui/components/GridView.jsx';

import '/imports/languages/en/en.location.i18n.yml';
import '/imports/languages/de/de.location.i18n.yml';
import '/imports/languages/en-JM/en-JM.location.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
// location list + adding collection
class LocationsList extends Component {

  constructor(props){
     super(props);

     this.state = {
      load_more: false,
      limit:20,
      searchColumns:{},
      locationName: '',
     }
  }

  limitIncFunction = ((limit) => {
    this.setState({limit: this.state.limit + limit});
  });
  
  searchcFunction = ((searchValue) => {
      let column_search = {
        '$or' : [
            { "locationName" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
            { "locationEmail" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
        ]
      };
      this.setState({searchColumns: column_search});
  });

  handleSubmit = (event) => {
    event.preventDefault();

    const locationName        = this.locationName.value.trim();
    const locationEmail       = this.locationEmail.value.replace(/(\s*,?\s*)*$/, "");
    const { clientId }        = Meteor.user().profile;

    if (locationName.length <= 0) {
      alert(i18n.__("location.Please enter a Location name"));
      return;
    }
    // validate email
    if (locationEmail.length != 0) {
      let emails = locationEmail.replace(/\s/g, "").split(",");
      let regex =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      for (let i = 0; i < emails.length; i++) {
        if (emails[i] == "" || !regex.test(emails[i])) {
          return alert(i18n.__("location.Invalid Email Address"));
        }
      }
    }

    //check for a match
    const locations = Locations.findOne({
      locationName: new RegExp("^" + locationName + "$", 'i'),
      clientId,
    });
    if(locations) {
      alert(i18n.__("location.Location name already exists"));
      return;
    }

    //insert new location
    Meteor.call('locations.insert', locationName, locationEmail, clientId);
    
    // Clear form
    this.locationName.value = '';
    this.locationEmail.value = '';
  };

  

  renderLocationsForms() {
    const currentUserId = Meteor.userId();

       
      if (!Roles.userIsInRole(currentUserId, ['normal-user','group-admin'])) {
        return (
          <div className="width-narrow">
            <form>
  
              <div className="form-row">
                <input
                  type="text"
                  ref={c => { this.locationName = c; }}
                  placeholder={i18n.__("location.Location Name")}
                />
              </div>
  
              <div className="form-row">
                <input
                  type="text"
                  ref={c => { this.locationEmail = c; }}
                  placeholder={i18n.__("location.Location Email")}
                />
              </div>
              
              <div className="form-row">
                <p className="text-dark-gray react-multi-email">{i18n.__("location.Empty Email Text")}</p>
              </div>
  
              <div className="form-row">
              <Button
                onClick={this.handleSubmit}
                fullWidth={true}
                color="primary"
                variant="contained"
               >
              {i18n.__("location.Add Location")}
              </Button>
              </div>
            </form>
            <br />
            {/* Data listing component */}
          <GridView 
            limit={this.state.limit} 
            LimitIncFunction={this.limitIncFunction}
            searchFunction={this.searchcFunction}
            searchColumns={this.state.searchColumns}
            initialColumns={[]}
            publications={['locations']} 
            collection={Locations} 
            renderComponent={'Location'}
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
   </div></div>: this.renderLocationsForms()}
  </div>
   );
  }
}
export default withTracker(() => {
  const user = Meteor.user();

  if (user){
    //set language
    if((typeof user.profile.language !== 'undefined') && (user.profile.language !== '')){
      i18n.setLocale(user.profile.language);
    }  
  }


  return {
     status: Meteor.status()
  };
})(LocationsList);