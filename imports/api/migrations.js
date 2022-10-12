import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import Carriers from '/imports/api/carriers';
import { Senders } from '/imports/api/senders';
import { Recipients } from '/imports/api/recipients';

console.log('npm_package_version', process.env.npm_package_version);
if (!Meteor.isServer) {
  return;
}

const migrations = new Mongo.Collection('migrations');

async function migrate({ name, up, saveOnFail = false }) {
  const isMigrationDone = await migrations.findOne({ name });

  if (isMigrationDone) {
    return;
  }

  let migrationOk = false;

  try {
    await up();
    console.log('migration', name, 'done');
    migrationOk = true;
  } catch (e) {
    console.error('migration', name, e);
  }
  if (migrationOk || saveOnFail) {
    migrations.insert({
      name,
      createdAt: new Date(),
      migrationOk,
    });
    console.log('migration', name, 'saved and will not repeat');
  }
}
(async () => {
  await migrate({
    name: 'newRecipientsCollection',
    saveOnFail: true,
    up: async () => {
      const Recipients2 = new Mongo.Collection('recipients2');
      const REGEX_FIX_SPACES = /[ ]{2,}/g;

      let documents = await Recipients.rawCollection().find().toArray();

      const recipientNamesLowCase = new Set();
      let normalizedNameLowCase;

      documents = documents.filter((item) => {
        if (!item.recipientName) return false;
        item.recipientName = item.recipientName.trim().replace(REGEX_FIX_SPACES, ' ');
        normalizedNameLowCase = item.recipientName.toLowerCase();

        if (recipientNamesLowCase.has(normalizedNameLowCase)) {
          return false;
        }
        recipientNamesLowCase.add(normalizedNameLowCase);

        return true;
      });

      const inserted = await Recipients2.rawCollection().insertMany(documents, { ordered: false });

      console.log('inserted', inserted.length);
    },
  });
  await migrate({
    name: 'newSendersCollection2',
    saveOnFail: true,
    up: async () => {
      const NewCollection = new Mongo.Collection('senders2');
      const REGEX_FIX_SPACES = /[ ]{2,}/g;

      let documents = await Senders.rawCollection().find().sort({ createdAt: 1 }).toArray();

      const namesLowCase = new Set();
      let nameLowCase;

      documents = documents.filter((item) => {
        if (!item.senderName) return false;

        // normalize name
        item.senderName = item.senderName.trim().replace(REGEX_FIX_SPACES, ' ');
        nameLowCase = item.senderName.toLowerCase();

        if (namesLowCase.has(nameLowCase)) {
          return false;
        }
        namesLowCase.add(nameLowCase);

        return true;
      });

      const inserted = await NewCollection.rawCollection().insertMany(documents, { ordered: false });

      console.log('inserted', inserted.length);
    },
  });
  //
  // drop duplicates and
  await migrate({
    name: 'newCarriersCollection',
    saveOnFail: true,
    up: async () => {
      const NewCollection = new Mongo.Collection('carriers2');
      const REGEX_FIX_SPACES = /[ ]{2,}/g;

      let documents = await Carriers.rawCollection().find().sort({ createdAt: 1 }).toArray();

      const namesLowCase = new Set();
      let nameLowCase;

      documents = documents.filter((item) => {
        if (!item.carrierName) return false;

        // normalize name
        item.carrierName = item.carrierName.trim().replace(REGEX_FIX_SPACES, ' ');
        nameLowCase = item.carrierName.toLowerCase();

        if (namesLowCase.has(nameLowCase)) {
          return false;
        }
        namesLowCase.add(nameLowCase);

        return true;
      });

      const inserted = await NewCollection.rawCollection().insertMany(documents, { ordered: false });

      console.log('inserted', inserted.length);
    },
  });
  //
  // drop duplicates and
  await migrate({
    name: 'normalizeCarriersIds',
    saveOnFail: true,
    up: async () => {
      const from = new Mongo.Collection('carriers_per_client');
      const to = new Mongo.Collection('carriers_pc_ids');

      const documents = await from.rawCollection().find().toArray();

      documents.forEach(item => { item._id = Random.id(); });

      const inserted = await to.rawCollection().insertMany(documents, { ordered: false });

      console.log('inserted', inserted);
    },
  });
})();
