import PouchDB from "pouchdb-browser";

// plugins
PouchDB.plugin(require("pouchdb-adapter-idb"));
PouchDB.plugin(require("pouchdb-adapter-websql"));

const ADAPTER_IDB = "idb";
const ADAPTER_WEBSQL = "websql";
const CORE_DB_NAME = "postrubella-core";
const PARCELS_DB_NAME = "postrubella-parcels";

const idbOptions = {
  adapter: ADAPTER_IDB,
  revs_limit: 1,
  auto_compaction: true,
};
const webSqlOptions = {
  adapter: ADAPTER_WEBSQL,
  revs_limit: 1,
  auto_compaction: true,
};
const defaultOptions = {
  revs_limit: 1,
  auto_compaction: true,
};

const adapterVariants = [idbOptions, webSqlOptions, defaultOptions];

/**
 * Opens pouchDb with first sucessfull options variant. Order listed in adapterVariants.
 * @param dbName
 * @returns {Promise<PouchDB>}
 */
const pouchDbFactory = async (dbName) => {
  let openedDb;
  const errors = [];

  for (let i = 0; i < adapterVariants.length; i += 1) {
    try {
      /* eslint-disable no-await-in-loop */
      openedDb = await new PouchDB(dbName, adapterVariants[i]);
      break;
    } catch (err) {
      const msg = `failed to init ${adapterVariants[i].adapter || "PouchDB"}:`;

      errors.push([msg, err]);
      console.error(msg, err);
    }
  }

  let info;

  try {
    info = await openedDb.info();
  } catch (err) {
    console.error("Failed to get db info", err, openedDb);
  }
  if (errors.length === adapterVariants.length - 1) {
    Meteor.call(
      "sendToSlack",
      `PouchDB unusual adapter ${info ? "info" : ""}: ${
        JSON.stringify(info || openedDb, null, 2) + getAppInfo()
      }`
    );
  } else if (errors.length === adapterVariants.length) {
    Meteor.call(
      "sendToSlack",
      `Can't open PouchDB: ${JSON.stringify(errors, null, 2) + getAppInfo()}`
    );
    throw errors[errors.length - 1];
  }

  return openedDb;
};

let _coreDb = pouchDbFactory(CORE_DB_NAME);
let _parcelsDb = pouchDbFactory(PARCELS_DB_NAME);

const getCoreDb = () => _coreDb;
const getParcelsDb = () => _parcelsDb;

// reset core
const dbCoreReset = async () => {
  const coreDb = await getCoreDb();

  await coreDb.destroy();
  _coreDb = pouchDbFactory(CORE_DB_NAME);
};

// reset parcels
const dbParcelsReset = async () => {
  const parcelsDb = await getParcelsDb();

  await parcelsDb.destroy();
  _parcelsDb = pouchDbFactory(PARCELS_DB_NAME);
};
console.log("pouchDB");

export { getCoreDb, getParcelsDb, dbCoreReset, dbParcelsReset };
