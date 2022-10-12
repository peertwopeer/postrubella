import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import Button  from '@material-ui/core/Button';
import User from '/imports/ui/User.jsx';
import Client from '/imports/ui/Client.jsx';
import Location from '/imports/ui/Location.jsx';
import Carrier from '/imports/ui/Carrier.jsx';
import Sender  from '/imports/ui/Sender.jsx';
import DeliveryType from '/imports/ui/DeliveryType.jsx';
import Recipient from '/imports/ui/Recipient.jsx';
import EmailLogs from '/imports/ui/EmailLogs.jsx';
import { Clients } from '/imports/api/clients.js';
import {Languages} from '/imports/api/languages.js';
import '/imports/languages/en/en.common.i18n.yml';
import '/imports/languages/de/de.common.i18n.yml';
import '/imports/languages/en-JM/en-JM.common.i18n.yml';

const publicDir = `${Meteor.settings.public.cdn}/public`;
var limit = 10;
var timeZone = new ReactiveVar(Intl.DateTimeFormat().resolvedOptions().timeZone);
var dataSubs = new ReactiveVar(false);

class GridView extends Component {
    constructor(props){
    super(props);
    limit = props.limit;
    this.searchInput = React.createRef();
    this.state = {
      load_more : true,
      list: {},
     };
     this.list = {};
   }

  componentWillUnmount() {
  }
  
  handleLoadMore = () => {
    this.props.LimitIncFunction(limit);
    if(this.props.limit >= this.props.totalCount){
      this.setState({load_more:false});
    }
    };
    
  handleSearch = () => {
    let searchValue = this.searchInput.current.value;
    this.props.searchFunction(searchValue);
    if(searchValue !==  ""){
      this.setState({load_more:false});
    }else{
      this.setState({load_more:true});
    }
  };
  
   renderDataList = () => {
    const { list } = this.state;

    switch(this.props.renderComponent) {
      case 'User' :
        let clients = Clients.find({}).fetch();
        return(<div>
          <div align="center"> {i18n.__("common.Total Users :")} {this.props.totalCount} </div>
          {this.props.collections.filter(user => user._id !== this.props.user._id).map((user) => {
            let client = clients.filter(obj => {
              return obj._id == user.profile.clientId
            });
            if(client.length>0){
                        return <User 
                        key={user._id} 
                        user={user} 
                        clientName={client[0].clientName} 
                        timezone={timeZone.get()} 
                        />
                }
          })}
        </div>);
      break;
      case 'Client' :
       return(<div>
          <div align="center"> {i18n.__("common.Total Clients :")}  {this.props.totalCount} </div>
        {this.props.collections.map((client) => {
         let defaultLanguageName = Languages.find({code: client.defaultLanguage}).fetch();
          return(
            <Client
            key={client._id}
            client={client}
            timezone={timeZone.get()}
            defaultLanguage={defaultLanguageName}
            />
           )
        })}
        </div>);
      break;
      case 'Location' :
       
        return(
          <div>
           <div align="center">{i18n.__("common.Total Locations :")} {this.props.totalCount} </div>
            { this.renderDeleteButton() }
            {this.props.collections.map(location => (
            <Location
               key={location._id}
               location ={location}
               timezone={timeZone.get()}
               selectable="true"
               checked={(!!list[location._id])}
               onChecked={this.onChecked}
               />
           ))}
          </div>
        );
      break;
      case 'Carrier' :
      
        return(<div>
          <div align="center"> {i18n.__("common.Total Carriers :")} {this.props.totalCount} </div>
          { this.renderDeleteButton() }
        {this.props.collections.map(carrier => (
            <Carrier
               key={carrier._id}
               carrier={carrier}
               timezone={timeZone.get()}
               selectable="true"
               checked={(!!list[carrier._id])}
               onChecked={this.onChecked}
               />
           ))}
        </div>);
      break;
      case 'Sender' :
        return(<div>
          <div align="center"> {i18n.__("common.Total Senders :")} {this.props.totalCount} </div>
          { this.renderDeleteButton() }
        {this.props.collections.map(sender => (
            <Sender
               key={sender._id}
               sender={sender}
               timezone={timeZone.get()}
               selectable="true"
               checked={(!!list[sender._id])}
               onChecked={this.onChecked}
               />
           ))}
        </div>);
      break;
      case 'DeliveryType' :
        
        return(<div>
          <div align="center">  {i18n.__("common.Total Delivery Types :")} {this.props.totalCount} </div>
        {this.props.collections.map(deliveryType => (
            <DeliveryType
               key={deliveryType._id}
               deliveryType={deliveryType}
               timezone={timeZone.get()}
               />
           ))}
        </div>);
      break;
      case 'Recipient' :
        return(
        <div>
          <div align="center"> {i18n.__("common.Total Recipients :")}  {this.props.totalCount}</div>
          { this.renderDeleteButton() }
          {this.props.collections.map(recipient => (
            <Recipient
              key={recipient._id}
              recipient={recipient}
              timezone={timeZone.get()}
              selectable="true"
              checked={(!!list[recipient._id])}
              onChecked={this.onChecked}
            />
          ))}
        </div>);
      break;
      case 'EmailLogs' :
        return(<div>
          <div align="center"> {i18n.__("common.Total Logs :")} {this.props.totalCount} </div>
        {this.props.collections.map(log => (
        <EmailLogs
          key={log._id}
          log={log}
          timezone={timeZone.get()}
        />
      ))}
        </div>);
      break;
      default:
          throw new Meteor.Error('View component not found');
    }
  };
  renderDeleteButton() {
    let that = this;
    const countList = Object.keys(that.state.list).length;
    if (countList < 1) {
      return;
    }
  
    return (
      <div align="right" style={{
        marginBottom: '10px',
      }}>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            if (
              confirm(
                `${i18n.__(
                  "common.You have selected"
                )} ${countList} ${i18n.__(`common.${that.props.renderComponent}${countList>1?"s":""}`).toLowerCase()}. ${i18n.__(
                  "common.Delete"
                )}? ${i18n.__("common.This cannot be undone")}`
              )
            ) {
              Meteor.call(
                `${that.props.renderComponent.toLowerCase()}s.remove`,
                Object.values(this.state.list),
                function (err, result) {
                  if (result) {
                    alert(i18n.__("common.Deleted Successfully"));
                    that.setState({ list: {} });
                  }
                }
              );
            }
          }}
        >
          {i18n.__("common.Delete Selected")}
        </Button>
      </div>
    );
  };
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
  render() {
    if((dataSubs.get()) && (this.props.clientSubscription) && (this.props.langSubscription)){
      return (
        <div className="width-narrow">
            {/* search form */}
            <div className="form-row">
                <input
                  type="text"
                  ref={this.searchInput}
                  placeholder={i18n.__("common.Search Here")}
                />
                
            </div>
            <div className="form-row" align="center">
                  <Button onClick={this.handleSearch} variant="contained" color="primary" fullWidth={true} >{i18n.__("common.Search")}</Button>
              </div>
            {/* search form close*/}
            <br/>
            {/* render data list*/}
            {
              (this.props.collections.length > 0) ?
                <ul id="user_list">{this.renderDataList()}</ul>
              :
                <div align="center">
                  <p>{i18n.__("common.No records found")}</p>
                </div>
            }
            {
              (this.state.load_more)?
                <div className="form-row" align="center">
                  <div className="margin-bottom-65">
                  <Button onClick={this.handleLoadMore} variant="contained" color="primary"> {i18n.__("common.Load More")} </Button>
                  </div>
                </div>
              :
                null
            }
        </div>
      );
    }else{
      return(
          <div>
            <div className="simple-loader">
              <img src={`${publicDir}/img/loading.gif`} />
            </div>
            <div className="data-processing-message">
              <br></br>
              <b>{i18n.__("common.The data is loading please wait")}</b>
            </div>
          </div>
        );
    }
   
  }
}
export default withTracker((props) => {
  let publications = props.publications;
  let subscriptions = [];
  let collection = props.collection;
  let limit = props.limit;
  let searchColumns = props.searchColumns;
  let initialColumns = props.initialColumns;
  let clientId = props.selectedClient;
  
  const clientSubscription = Meteor.subscribe('currentClient').ready();
  const langSubscription = Meteor.subscribe('languages').ready();
  
  publications.map((publication) => {
    //subscriptions with parameters 
    if(Array.isArray(publication)){
      subscriptions.push(Meteor.subscribe(publication[0],publication[1] ).ready());   
    }
    //subscriptions without parameters 
    else{
      subscriptions.push(Meteor.subscribe(publication).ready());
   }
  }
  );

  
  // check subscriptions
  if(subscriptions.every( v => v === subscriptions[0] )){
    subscriptions.map((sub)=>{
      if(sub){
        dataSubs.set(true);
      }else{
        dataSubs.set(false);
      }
    });
  }

  // console.log(dataSubs.get(),clientSubscription,langSubscription,"subsssssssss");
  
  

  if(Meteor.user() !== undefined){
      let columnQuery = {};
      const user = Meteor.user();
      initialColumns.map((column) => {
          if(column == 'clientId'){
                columnQuery = {"clientId" : user.profile.clientId};
          }
          if(column == 'selectedClient'){
            columnQuery = {clientId}
          }
        });
        searchColumns = {'$and' :[ 
                          columnQuery,
                          searchColumns
                        ] }
        //set timezone
        if(clientSubscription) {
          const currentClient = Clients.find({}).fetch();
          // console.log(currentClient);
          if (user){
            if((typeof user.profile.timezone !== 'undefined') && (user.profile.timezone !== '')){
              timeZone.set(user.profile.timezone)
            }
            else if((typeof currentClient[0].defaultTimeZone !== 'undefined') && (currentClient[0].defaultTimeZone !== '')){
              timeZone.set(currentClient[0].defaultTimeZone);
            }
          }
        }
    }
 
return {
    user: Meteor.user(),
    collections:  collection.find(searchColumns, { limit : limit }).fetch(),
    totalCount: collection.find(searchColumns).count(),
    clientSubscription: clientSubscription,
    langSubscription: langSubscription
  };
})(GridView);