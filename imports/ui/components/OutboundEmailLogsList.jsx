import React, { Component }             from 'react';
import { withTracker }                  from 'meteor/react-meteor-data';
import outboundEmailLogs                from '/imports/api/outboundEmailLogs.js';
import GridView                         from '/imports/ui/components/GridView.jsx';

const publicDir = `${Meteor.settings.public.cdn}/public`;
// component
class OutboundEmailLogsList extends Component {

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
      '$or' : [
          { "to" : { "$regex": searchValue.trim()+'.*', "$options":'i'} },
      ]
    };
    this.setState({searchColumns: column_search});
  });


  // render collections
  

  render() {
    const { status } = this.props;
    if(status.connected){
      return (
        <div className="width-narrow">
          <GridView 
          limit={this.state.limit} 
          LimitIncFunction={this.limitIncFunction}
          searchFunction={this.searchcFunction}
          searchColumns={this.state.searchColumns}
          initialColumns={[]}
          publications={['outboundEmailLogs.admin']} 
          collection={outboundEmailLogs} 
          renderComponent={'EmailLogs'}
          />
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
    return {
      status: Meteor.status(),
  };
})(OutboundEmailLogsList);
  
