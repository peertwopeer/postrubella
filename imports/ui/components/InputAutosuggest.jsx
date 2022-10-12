import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import Autosuggest from 'react-autosuggest';

const MIN_LENGTH = 3;
const DEFAULT_LIMIT = 10;
const FETCH_DELAY_MS = 300;
const EMPTY_ARRAY = [];
const REGEX_FIX_SPACES = /[ ]{2,}/g;
const REGEX_ESCAPE_SEARCH = /[-/\\^$*+?.()|[\]{}]/g;

function escapeRegExp(s) {
  return s.replace(REGEX_ESCAPE_SEARCH, '\\$&');
}

function regex(input) {
  input = escapeRegExp(input);

  return new RegExp(input, 'i');
}

/**
* Polyfill of String.prototype.trimLeft method.
* @param {string} str The source string.
* @return {string} A trimmed copy of `str`.
*/
function trimLeft(str) {
  // include non-breaking-space (0xa0) for IE
  return str.replace(/^[\s\xa0]+/, '');
}

class InputAutosuggest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      suggestions: EMPTY_ARRAY,
    };
    this.suggestionsCache = EMPTY_ARRAY;
    this.limit = this.props.limit || DEFAULT_LIMIT;
  }

  componentDidMount() {
    if (typeof this.props.onRef === 'function') this.props.onRef(this);
  }

  onChange = (event, { newValue }) => {
    this.setState({ value: trimLeft(newValue).replace(REGEX_FIX_SPACES, ' ') });
    this.props.onChange();
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: EMPTY_ARRAY,
    });
  };

  /**
   * Updates suggestions
   *
   * Suggestions only available for values with more than 2 letters.
   * Suggestions can be cached if server will send more results than specified limit
   * Suggestions will be requested only after FETCH_DELAY_MS milliseconds after end of typing
   * @param value
   */
  onSuggestionsFetchRequested = ({ value }) => {
    value = value.trim().replace(REGEX_FIX_SPACES, ' ').toLowerCase();
    Meteor.clearTimeout(this.timer);

    if (value.length < MIN_LENGTH) {
      return this.setState({
        suggestions: EMPTY_ARRAY,
      });
    }

    const regValue = regex(value);

    if (this.useCache && value.includes(this.prevValue)) {
      this.setState({
        suggestions: this.suggestionsCache.filter(item => regValue.test(this.props.getValue(item))),
      });
    } else {
      this.updatePrevValue = value;
      this.timer = Meteor.setTimeout(this.updateSuggestions, FETCH_DELAY_MS);
    }
  };

  /**
   * Used to return value from component
   *
   * @returns {string}
   */
  getValue = () => this.state.value.trim();
  
  /**
   * Used to set value for component
   *
   */
  setValue = (value) => {
    this.setState({ value: trimLeft(value).replace(REGEX_FIX_SPACES, ' ') });
  }


  /**
   * Loads data from server
   *
   * Server can return data in count as specified by limit or more if not so much for cache
   */
  updateSuggestions = () => {
    // console.time('updateSuggestions');
    Meteor.call(this.props.url, this.updatePrevValue, this.limit, (error, result) => {
      // console.timeEnd('updateSuggestions');

      if (error) return console.error('Error: ', error);
      if (!result) return EMPTY_ARRAY;

      this.prevValue = this.updatePrevValue;

      let { suggestions } = result;
      const { cache } = result;

      this.useCache = cache;
      this.suggestionsCache = cache ? suggestions : EMPTY_ARRAY;

      if (suggestions.length > this.limit) {
        suggestions = suggestions.slice(0, this.limit);
      }

      suggestions = suggestions.sort((prev, curr) => {
        const val = regex(this.prevValue);

        curr = this.props.getValue(curr);
        prev = this.props.getValue(prev);

        return val.exec(prev).index - val.exec(curr).index;
      });
      this.setState({
        suggestions,
      });
    });
  };

  /**
   * used to clear select
   */
  clear() {
    this.setState({
      value: '',
      suggestions: EMPTY_ARRAY,
    });
  }

  render() {
    return (
      <Autosuggest
        suggestions={this.state.suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.props.getValue}
        renderSuggestion={this.props.getValue}
        inputProps={{
          placeholder: this.props.placeholder,
          onChange: this.onChange,
          value: this.state.value,
        }}
      />
    );
  }
}

export default InputAutosuggest;
