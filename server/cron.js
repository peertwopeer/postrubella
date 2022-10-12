/* eslint no-new: 0 */

import { CronJob } from 'cron';
import AWS from 'aws-sdk';
import _ from 'lodash';
import outboundEmailLogs from '/imports/api/outboundEmailLogs.js';
import s3UploadLogs from '/imports/api/s3UploadLogs.js';

const MEMORY_USAGE_CRON_TIME = '0 * * * * *';
const LOGS_CLEAR_CRON_TIME = '0 0 0 * * *';
const MEMORY_USAGE_LOG_INTERVAL = 1000 * 60 * 10;
const EMAILS_SEND_CRON_TIME = '0 * * * * *'
class Cron {
  static memoryUsageChecking() {
    // configure
    const usageLevelsThresholds = [
      0,
      175,
      350,
      700,
      1000,
    ];
    const usageLevelsHandlers = [
      usageStr => {
        console.info(0, usageStr);
      },
      usageStr => {
        console.log(1, usageStr);
      },
      usageStr => {
        console.warn(2, usageStr);
      },
      usageStr => {
        console.error(3, usageStr);
      },
      usageStr => {
        console.error(4, 'Emergency', usageStr);
        Meteor.call('sendToSlack', `@channel  _*\`Emergency\`*_ - ${usageStr}`);
      },
    ];

    let prevLogTime = 0;
    let prevUsageLevel = 0;
    let prevMaxVal = 0;

    function getUsageLevel(value) {
      let minPositiveDiff = 0;
      let diff = 0;

      usageLevelsThresholds.forEach((threshold, index) => {
        diff = value - threshold;
        if (index === 0 || (diff > 0 && minPositiveDiff > diff)) {
          minPositiveDiff = diff;
        }
      });

      return usageLevelsThresholds.indexOf(value - minPositiveDiff);
    }
    new CronJob(
      MEMORY_USAGE_CRON_TIME,
      Meteor.bindEnvironment(() => {
        const memoryUsage = process.memoryUsage();
        const currentTime = Date.now();
        let maxValMb = 0;
        let valMb = 0;

        const usageStr = Object.entries(memoryUsage).reduce((_usageStr, [key, val]) => {
          valMb = Math.ceil(val / 1024 / 1024);
          maxValMb = Math.max(valMb, maxValMb);

          return (`${_usageStr} ${key}: ${valMb} Mb, `);
        }, 'Memory usage: ');

        if (maxValMb === prevMaxVal) return;

        const usageLevel = getUsageLevel(maxValMb);

        // log if level changed or time to show signs of life
        if (usageLevel !== prevUsageLevel || currentTime - prevLogTime >= MEMORY_USAGE_LOG_INTERVAL) {
          usageLevelsHandlers[usageLevel](usageStr);
          prevUsageLevel = usageLevel;
          prevLogTime = currentTime;
        }
        prevMaxVal = maxValMb;
      }),
      null,
      true,
    );
  }

  static cleanOutboundEmailLogs() {
    
    new CronJob(
      LOGS_CLEAR_CRON_TIME,
      Meteor.bindEnvironment(() => {
        let today = new Date();
        let lastWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        let start = new Date(lastWeekStart.setHours(0,0,0,0));
        outboundEmailLogs.remove({createdAt:{ $lte : new Date(start) }});
        console.log("outbound email logs cleared, older than - "+start);
        }),
      null,
      true,
    );
  }

  static cleanS3UploadsAndLogs() {
    
    new CronJob(
      LOGS_CLEAR_CRON_TIME,
      Meteor.bindEnvironment(() => {
        // Configure client for use with Spaces
        const spacesEndpoint = new AWS.Endpoint('ams3.digitaloceanspaces.com');
        const s3 = new AWS.S3({
                    endpoint: spacesEndpoint,
                    accessKeyId: Meteor.settings.private.spaces.ACCESS_KEY,
                    secretAccessKey: Meteor.settings.private.spaces.SECRET_KEY,
                  });
        let today = new Date();
        let last60DaysStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60);
        let start = new Date(last60DaysStart.setHours(0,0,0,0));
        let projection = {createdAt:{ $lte : new Date(start) }};
        let logs = s3UploadLogs.find(projection);
            _.forEach(logs.fetch(), function(s3log) {
              s3.deleteObject({ Key: s3log.key, Bucket: s3log.bucket }, (err, data) => {
                if (err) console.log(err, err.stack); // an error occurred
                // else console.log('file deleted');
              });
            });
        s3UploadLogs.remove(projection);
        console.log("CSV reports cleared, older than - "+start);
        }),
      null,
      true,
    );
  }
  static sendEmailsInQueue() {
    new CronJob(
        EMAILS_SEND_CRON_TIME,
        Meteor.bindEnvironment(() => {  
          Meteor.call('sendQueueEmails');
        }),
        null,
        true,
      );
    }

  static init() {
    Cron.memoryUsageChecking();
    Cron.cleanOutboundEmailLogs();
    Cron.cleanS3UploadsAndLogs();
    Cron.sendEmailsInQueue();
  }
}
Meteor.startup(() => {
  Cron.init();
});
