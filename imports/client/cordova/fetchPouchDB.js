import { getParcelsDb, getCoreDb } from '../../lib/PouchDB';
import _ from 'lodash';
import { ReactiveDict } from 'meteor/reactive-dict';

function getCollection(collectionPouch) {
  let collectionArray = [];

  if (collectionPouch) {
    collectionArray = collectionPouch.doc.collection;
  }

  return collectionArray;
}

function getCoreData(docsRows) {
const carriersPouch            = _.find(docsRows, { key: "carriers" });
const locationsPouch           = _.find(docsRows, { key: "locations" });
const sendersPouch             = _.find(docsRows, { key: "senders" });
const sendersWithEmailPouch    = _.find(docsRows, { key: "sendersWithEmail" });
const destinationsPouch        = _.find(docsRows, { key: "destinations" });
const deliveryTypesPouch       = _.find(docsRows, { key: "deliveryTypes" });
const recipientsPouch          = _.find(docsRows, { key: "recipients" });
const usersPouch               = _.find(docsRows, { key: "users" });
const clientsPouch             = _.find(docsRows, { key: "clients" });
const currentUserPouch         = _.find(docsRows, { key: "currentUser" });
const lastSyncedPouch          = _.find(docsRows, { key: "lastSynced" });

  // reformat
  const carriers               = getCollection(carriersPouch);
  const senders                = getCollection(sendersPouch);
  const sendersWithEmail       = getCollection(sendersWithEmailPouch);
  const recipients             = getCollection(recipientsPouch);
  const deliveryTypes          = getCollection(deliveryTypesPouch);
  const locations              = getCollection(locationsPouch);
  const destinations           = getCollection(destinationsPouch);
  const users                  = getCollection(usersPouch);
  const clients                = getCollection(clientsPouch);
  const lastSynced             = getCollection(lastSyncedPouch);
  let currentUser              = getCollection(currentUserPouch);
  // migration for old data
  if (Array.isArray(currentUser)) {
    [currentUser] = currentUser;
  }

  return {
    carriers,
    senders,
    sendersWithEmail,
    locations,
    deliveryTypes,
    users,
    recipients,
    destinations,
    clients,
    currentUser,
    lastSynced,
    syncStatus: true,
    syncCoreStatus: true,
  };
}

function getParcelsData(parcelsRows) {
  // format
  const parcels = parcelsRows.map(parcelPouch => parcelPouch.doc).sort(parcel => -parcel.offline || 1);

  return {
    parcels,
    syncParcelsStatus: true,
  };
}

const resultDefault = {
  carriers: [],
  senders: [],
  locations: [],
  deliveryTypes: [],
  users: [],
  recipients: [],
  clients: [],
  currentUser: [],
  parcels: [],
  lastSynced: false,
  syncStatus: false,
  syncCoreStatus: false,
  syncParcelsStatus: false,
};

const pouchDict = new ReactiveDict('pouchDict');

const setDictValue = ([key, value]) => {
  pouchDict.set(key, value);
};

function loadToDict(dataObject) {
  Object.entries(dataObject).forEach(setDictValue);
}

const fetchPouchDB = async () => {
  let resultCore = {};
  let resultParcels = {};

  function resolve() {
    const result = {
      ...resultDefault,
      ...resultCore,
      ...resultParcels,
    };

    // loadToDict(result);

    return result;
  }
  try {
    const options = {
      include_docs: true,
      // limit: 3000,
    };

    const [
      coreDb,
      parcelsDb,
    ] = await Promise.all([
      getCoreDb(),
      getParcelsDb(),
    ]);

    const [
      coreDocs,
      parcelsDocs,
    ] = await Promise.all([
      coreDb.allDocs(options),
      parcelsDb.allDocs(options),
    ]);

    const coreCollectionCount    = coreDocs.total_rows;
    const parcelsCollectionCount = parcelsDocs.total_rows;

    const coreRows               = coreDocs.rows;
    const parcelsRows            = parcelsDocs.rows;

    if (coreCollectionCount) {
      resultCore = getCoreData(coreRows);
    }
    if (parcelsCollectionCount) {
      resultParcels = getParcelsData(parcelsRows);
    }

    return resolve();
  } catch (err) {
    console.log('fetchPouchDB Error: ', err);
    Meteor.call('sendToSlack', `fetchPouchDB Error: ${err.message || err}. \n${getAppInfo()}`);

    return resolve();
  }
};

console.log('fetchPouchDB');
// loadToDict(resultDefault);

export default fetchPouchDB;
