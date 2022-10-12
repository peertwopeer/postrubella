![org_placeholder](https://postrubella.ams3.digitaloceanspaces.com/public/img/logo.png)

## **postrubella** - Meteor Online + Temporary Offline Concept

---

##Apps

DEV App: https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella-dev.apk

LIVE App: https://postrubella.ams3.digitaloceanspaces.com/public/app/postrubella.apk

- Printer.org_placeholder.io [138.68.170.61]

## Settings

Saved the file as JSON on the source code directory, you can find this at `/.deploy/` folder

#### Example setting file

```
{
  "galaxy.meteor.com": {
    "env": {
      "TZ": "UTC",
      "MONGO_URL": "mongodb+srv://[username]:[password]@[url]",
      "ROOT_URL": "https://postrubella.org_placeholder.io",
      "NODE_ENV": "dev",
      "GALAXY_NODE_OPTIONS": "--max-old-space-size=900"
    }
  },
  "public": {
    "cdn": "[s3-url]",
    "api_service": {
      "url": "[report-app-url]"
    }
  },
  "private": {
    "smtp": {
     "username": "[username]",
     "password": "[password]",
     "server": "[server]",
     "email": "[email-id]"
   },
   "spaces": {
     "ACCESS_KEY": "[key]",
     "SECRET_KEY": "[secrete]"
   },
   "slack": {
     "webhookUrl": "https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxxxxx",
     "username": "[username]",
     "channel": "[channel]"
   }
  }
}
```

## Quick Start

- 1. Startup app
  - Run `yarn env:local`command to set local environment.
  - Install maildev package and run the command `maildev --incoming-user 'devuser' --incoming-pass 'password'`
  - Configure the local smtp user and host in the `settings-local.json` file.
  - Use `yarn start:l`command to run the app locally.

See `package.json` for more useful scripts.

---

## Commands in Detail

- 1 . lint

  - This script will scan all the files with the extension .js and .jsx and validate the code. - Run `yarn lint`

- 2 . lintfix
  - Uses –fix to apply automatic fixes to code.
  - Run `yarn lintfix`
- 3 . linthelp

  - This option outputs the help menu, displaying all of the available options. All other options are ignored when this is present.

  - Run `yarn linthelp`

- 4 . pretest

  -It is useful to have one script run before or after another you can use pre- and post- hooks on all npm scripts, just prepend pre or post to the name of your script.

  - Run by the npm run command.
  - Run `yarn pretest`

- 5 . Set environments

  - `yarn env:local`- to set local environment.
  - `yarn env:dev`- to set dev environment.
  - `yarn env:live`- to set live environment.

---

## Configuration

- Meteor 1.8.x required
- Digital Ocean: MongoDB 3.4.7+
- Digital Ocean: Spaces
- Digital Ocean: Ubuntu 16.04.3 x64+
- Meteor Up

## Recommended Stack

Application: Meteor Galaxy Hosting ( This also provides performance and query monitoring. )
Database: mLab, Compose.io or MongoDB Atlas.

Alternatively:
Application: Digital Ocean Docker with MUP.
Monitoring: NodeChef Meteor APM
Database mLab, Compose.iom, MongoDB Atlas or Digital Ocean MongoDB

## Local server setup inscrutctions

```
$ Install maildev package and run the command  `maildev --incoming-user 'devuser' --incoming-pass 'password'`
$ Configure the local smtp user and host in the `settings-local.json` file.
$ git clone git@bitbucket.org:org_placeholderio/postrubella.git
$ cd postrubella
$ git checkout master-new
$ yarn install
$ yarn start:l

```

This should start postrubella on http://localhost:3000

## Mobile

- To build the mobile package you will need the latest versions of Xcode and Android SDK installed, follow the instructions listed below:

  - iOS: https://guide.meteor.com/mobile.html#installing-prerequisites-ios
  - Android: https://guide.meteor.com/mobile.html#installing-prerequisites-android

- Build:
  1. Update `mobile-config.js` to be able to have the LIVE and DEV app installed on the same device at the same time:
     - DEV:
       - `id: 'com.app.org_placeholder.postrubella.staging'`,
       - `name: 'postrubella Dev'`
     - LIVE:
       - `id: 'com.app.org_placeholder.postrubella.live'`,
       - `name: 'postrubella'`
  2. Build the apk for android and xcode project for iOS (About next steps for iOS see https://guide.meteor.com/mobile.html#submitting-ios):
     - DEV: `meteor build ../postrubella-build --directory --server=https://dev.postrubella.org_placeholder.io --mobile-settings=.deploy/settings-dev.json`
     - LIVE: `meteor build ../postrubella-build --directory --server=https://postrubella.org_placeholder.io --mobile-settings=.deploy/settings-live.json`
  3. Sign the apk:
     1. `cd /postrubella-build/android`
     2. `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 release-unsigned.apk -signedjar release-signed.apk postrubella -keystore ../../postrubella/org_placeholder.keystore`
     3. enter keysore password
  4. Zipalign on it to optimize the APK: `zipalign -f -v 4 release-signed.apk postrubella-dev.apk`
  5. Upload and replace in to the following directory `https://postrubella.ams3.digitaloceanspaces.com/public/app/` with name:
     - DEV: `postrubella-dev.apk`
     - LIVE: `postrubella.apk`

An alternative way to test the mobile application from local code is by using the emulator.

---

## Galaxy Hosting

- 1.  Login

  - meteor login will prompt you for a username and password to log you in, given the correct credentials.
    - `"meteor:login": "meteor login"`

- 2.  Logout

  - meteor logout will log you out as the current user.
    - `"meteor:logout": "meteor logout"`

- 3.  Whoami

  - meteor whoami will tell you which user you are logged in as.
    - `"meteor:user": "meteor whoami"`

- 4.  List sites

  - meteor list-sites lists all the apps you have access to, across all your organizations.
    - `"meteor:list-sites": "meteor list-sites"`

- 5.  Version
      - `"meteor:version": "meteor --version"`

- 6.  Update

  - meteor update allows you to update your Meteor version. You can use the --release flag to specify a version.
    - `"meteor:update": "meteor update"`

- 7.  Deploy (Make sure that the user is logged in)

  - meteor deploy can be used for creating new apps and updating existing ones.
  - run the following scripts to depoly the app into different environments.

    - LIVE: `meteor:deploy-live`
    - DEV: `meteor:deploy-dev`
    - PR : `meteor:deploy-pr`

- 8 . Build

  - To take Mobile Build (To take mobile build first you need to deploy the app, run "meteor:deploy"). Then run the following scripts to take mobile build for each environment.

    - LIVE: `build:package-live`
    - DEV: `build:package-dev`
    - PR : `build:package-pr`

- 9.  Start,Stop and Delete

  - start and stop the app via glaxy admin panel.
  - Stopping an app shuts down all of its containers.
  - Deleting an app shuts down all containers and removes the app from your Galaxy account.

- 10. Logs

  - The logs should be your first stop when troubleshooting any Galaxy issue.
  - You can reach the logs dashboard by clicking on your app, then clicking the “Logs” tab.
  - Breakdown by tab will be especially useful if you have multiple containers running, and are regularly deploying.
  - There are several logging tabs you can click, below the “Logs” tab itself. These are:

    - All: for the combined view.
      - Every message and error will be shown here.
    - App: for application-specific messages and errors.
      - Any messages or errors thrown by your app will be shown here.
      - Check this to see what your app is doing during normal operations.
    - Service: for messages generated during the build process, and messages saying that a container is starting or stopping.
      - If your app isn’t successfully deploying, this is the tab you’ll want to check.
      - The image builder tries to build your app into a container; if it fails, the failure will be noted here.
    - Errors: exclusively for errors, which are flagged in red in other tab views.
      - Errors will be shown in this tab. Check to see if there are any outstanding errors if your app is malfunctioning.

## Known issues

- Build version must be changed in `mobile-config.js` + `getAppInfo.js` + `config.js`. May be best to remove this as Meteor has live push confusing the actual version number.
- Build app size grows sometime after build (+0.7Mb. Normal size is ~1.5 Mb). To fix it:
  - `rm -rf .meteor/local`
- SignaturePad: signature disappears on window resize
- Hot code push not work on some devices
- Deploy go with downtime for few minutes

---

## Gotcha

- If you are struggling to find the correct component, go to the `clients/main.js` file and this will help you.
- Seeing a 504 issue is most likely caused by the docker not being able to connect to a MongoDB instance.
- Meteor is not good at serving static images. Ensure all images are being pulled from a CDN.
- All files for local development and dev.postrubella.org_placeholder.io are saved into a tmp folder on DO. It is advised to clear this out every now then.
- We are using the indexes in MongoDB to have unique case insensitive data in collections `carriers`, `recipients`, `senders`, `locations` created by command:

```
#!JavaScript
#
db.getCollection('carriers').createIndex({ carrierName: 1}, {
    collation: { locale: 'en', strength: 2 },
    unique: true
});
```

---

## PDF Support

Run docker-compose up on your machine (server) to have PDF features: `docker-compose up`

Printer ip address: `138.68.170.61`

If `params.Body` returns an error, this may be due to the fact that your docker instant may not be running.

- SSH into the droplet and cd into /printer and run `docker-compose up -d`

## API

All modals, schema information, subscriptions and publications can be found in `imports/api`. These must be imported in `server/main.js` in order for this to run.

## S3 Docs

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

## App info

https://github.com/danmichaelo/cordova-plugin-appinfo

## Offline / PouchDB

All PouchDB settings can be found in `imports/lib/PouchDB`.
Visit `imports/ui/containers/*`. All offline containers have the suffix of `Offline`.

## Email Templates

Visit `imports/email-templates`. All templates are using ejs: http://ejs.co.

## SSH Agent

Ensure this is added to deploy.
ssh-add ~/.ssh/id_rsa

## Browser Policy

https://themeteorchef.com/tutorials/using-the-browser-policy-package
Content-Security-Policy
X-Frame-Options
X-XSS-Protection
X-Content-Type-Options
Referrer-Policy

See `App.accessRule('*');` in `mobile-config.js` to restrict access.

## Mongo DB Docker: Allow IP

sudo ufw allow from <IP ADDRESS>

## Client export from MongoDB

We exclude the `postrubellaBarcode` and `recipientSignature` as they are large base64 strings.
Example Client: Nova `db.parcels.find({'clientId': 'vdkXXPPXvPfS82YjB'}, { 'postrubellaBarcode': 0, 'recipientSignature': 0,})`

---

## Todo

- Migrate material-ui from v0 to v1
- Migrate MongoDB to 3.6 (Live is on 3.4)
- Migrate meteor from v1.6 to v1.7
- Refactor arch of imports and components

---

## Author

org_placeholder

"start": "MONGO_URL=mongodb+srv://postrubella-dev-user:fomzah-febwec-3Gyxno@cluster0-ypu44.mongodb.net/postrubella?retryWrites=true meteor run --settings=.deploy/settings-dev.json",

---

​

​  
​

​
