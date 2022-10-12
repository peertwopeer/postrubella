import { check } from 'meteor/check';

/**
 * MongoDB API: Getting collections
 */
import {
  Carriers,
  Recipients,
  Senders,
} from '/imports/api/';

/**
 * Defaults
 */
const LIMIT = 10;
const CACHE_MAX_COUNT = 100;
const MIN_LENGTH = 3;

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function regex(input) {
  input = escapeRegExp(input);

  return new RegExp(input, 'i');
}

function searchForAutocomplete(collection, field, value, limit) {
  value = regex(value);

  const query = {
    clientId: Meteor.user().profile.clientId,
    [field]: value,
  };
  const options = {
    fields: {
      [field]: 1,
      _id: 0,
    },
    sort: {
      [field]: 1,
    },
    limit,
  };

  let cursor = collection.find(query, options);
  const count = cursor.count();
  let cache = true;

  if (count > CACHE_MAX_COUNT) {
    cache = false;
    options.limit = limit;
    cursor = collection.find(query, options);
  }

  const suggestions = cursor.fetch();

  return {
    suggestions,
    cache,
  };
}
/**
 * Methods
 */
Meteor.methods({
  'autocomplete.carriers': (value, limit = LIMIT) => {
    check(value, String);
    check(limit, Number);
    if (value.length < MIN_LENGTH) return;

    return searchForAutocomplete(Carriers, 'carrierName', value, limit);
  },

  'autocomplete.recipients': (value, limit = LIMIT) => {
    check(value, String);
    check(limit, Number);
    if (value.length < MIN_LENGTH) return;

    return searchForAutocomplete(Recipients, 'recipientName', value, limit);
  },

  'autocomplete.senders': (value, limit = LIMIT) => {
    check(value, String);
    check(limit, Number);
    if (value.length < MIN_LENGTH) return;

    return searchForAutocomplete(Senders, 'senderName', value, limit);
  },
});
