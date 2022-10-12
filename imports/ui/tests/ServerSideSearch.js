import React from 'react';
import Autosuggest from 'react-autosuggest';
import { Session } from 'meteor/session';

export default class ServerSideSearch extends React.Component {
  constructor() {
    super();
    this.state = {
      searchValue: '',
      suggestions: [],
    };
  }

  renderSuggestion(suggestion) {
    return suggestion.carrierName;
  }

  componentDidMount() {
    Session.set('autocompleteSearch', []);
  }

  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    if (inputLength <= 2) return [];
    Meteor.call(
      'autocomplete.carriers', inputValue,
      (error, result) => {
        if (result) {
          return Session.set('autocompleteSearch', result);
        }
        if (error) {
          console.log('Error: ', error);
        }
      },
    );

    return Session.get('autocompleteSearch');
  }

    onSuggestionChange = (event, { newValue }) => {
      this.setState({
        searchValue: newValue,
      });
    };
    onSuggestionsFetchRequested = ({ value }) => {
      this.setState({
        suggestions: this.getSuggestions(value),
      });
    };
    onSuggestionsClearRequested = () => {
      this.setState({
        suggestions: [],
      });
    };

    render() {
      const { searchValue, suggestions } = this.state;

      return (
        <div>
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={getSuggestionValue = suggestion => suggestion.carrierName}
            renderSuggestion={this.renderSuggestion}
            inputProps={{
                        placeholder: 'Type a carrier',
                        value: searchValue,
                        onChange: this.onSuggestionChange,
                    }}
          />
        </div>

      );
    }
}
