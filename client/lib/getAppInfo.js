import { detect } from 'detect-browser';
import { Meteor } from 'meteor/meteor';

// global scope
// version will updated by hotCodePush
/* eslint-disable-next-line  no-undef */
codeVersion = '23.15';
/* eslint-disable-next-line  no-undef */
getAppInfo = () => {
  const browser = detect();
  const user = Meteor.user();
  let info = '';

  if (browser) {
    info += `Browser: *${browser.name}* version: *${browser.version}*. `;
  }
  if (navigator && navigator.userAgent) {
    info += `(_${navigator.userAgent}_) `;
  }
  if (window.cordova) {
    info += `App version: *${cordova.appInfoSync.version}*. `;
  }
  /* eslint-disable-next-line  no-undef */
  info += `Code version: *${codeVersion}*. `;
  info += `User: *${user ? user.username : 'unauthorized'}*`;

  return info;
};
