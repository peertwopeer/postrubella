import React, { Component }  from 'react';
import { Chart } from 'react-google-charts';
import '/imports/languages/en/en.report.i18n.yml';
import '/imports/languages/en-JM/en-JM.report.i18n.yml';

import { decode } from 'html-entities';

const options = {
  title: 'Parcels count',
  curveType: 'function',
  legend: {
    position: 'bottom',
    textStyle: {
      fontSize: 14,
    },
  },
  pointSize: 5,
  hAxis: {
    textStyle: {
      fontSize: 14,
    },
  },
  vAxis: { viewWindow: { min: 0 } },
};

export default class ReportsChart extends Component {
  render() {

    // console.log(this.props.data);

    return (
      <div className="App">
        <Chart
          chartType="LineChart"
          width="100%"
          height="160px"
          legendToggle
          loader={<div><b><span style={{color: "red"}}>{ decode(i18n.__('report.The chart is loading, Please do not send emails while complete load the chart') )}</span></b></div>}
          data={this.props.data}
          options={Object.assign({}, options, this.props.options)}
        />
      </div>
    );
  }
}
