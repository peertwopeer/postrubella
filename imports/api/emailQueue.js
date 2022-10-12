import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Match }    from 'meteor/check';

const emailQueue = new Mongo.Collection('emailQueue');

const PRIORITY_HIGH = 1000;
const PRIORITY_MEDIUM = 900;
const PRIORITY_LOW = 500;
const PRIORITY_NORMAL = 100;

const STATUS_ERROR = 0;
const STATUS_QUEUED = 1;
const STATUS_PROCESSING = 2;
const STATUS_SUCCESS = 3;

if (Meteor.isServer) {
    Meteor.methods({
        // save emails for queue
        'emailQueue.insert': function insertemailQueue(payload,emailInfo) {
            check(payload, Object);
            check(emailInfo, Object);
            emailQueue.insert({
            parentId: 0,
            queue: '',
            payload: payload,//to,from,subject,html,attachments,replyTo
            priority: emailInfo.priority,
            createdAt: new Date(),
            processedAt: new Date(),
            status:emailInfo.status
            });
        },
        //Fetch Queued emails
        'emailQueue.fetch': function(){
            return emailQueue.find({ status: 1}).fetch()
        },
        //Update Queued emails status to success(STATUS_SUCCESS) or Fail(STATUS_ERROR)
        'emailQueue.updateStatus': function(id,currentStatus){
            check(id, String);
            check(currentStatus, Number);
            emailQueue.update({'_id':id},{$set: {status : currentStatus}})
        },
        // emailQueue wrapper fn
        'emailQueue': function(to,from,subject,html,attachments,replyTo){
            check([to, from, subject, html], [String]);
            check(replyTo, Match.OneOf(null, undefined, String));
            check(attachments, Match.OneOf(null, undefined, Object));
                Meteor.call('emailQueue.insert',
                    {to,from,subject,html,attachments,replyTo},
                    {status:STATUS_QUEUED,priority:PRIORITY_HIGH}
                );
        },
          //Trigger Queued emails
        'sendQueueEmails': async function(){
            const result =  await Meteor.call('emailQueue.fetch')
            result.map( emailQueue => {
                Meteor.call('sendEmail',emailQueue.payload.to,
                    emailQueue.payload.from,
                    emailQueue.payload.subject,
                    emailQueue.payload.html,
                    emailQueue.payload.attachments,
                    emailQueue.payload.replyTo,(err,result) => {
                    //update status
                    Meteor.call('emailQueue.updateStatus',emailQueue._id,result ? STATUS_SUCCESS : STATUS_ERROR)
                    }
                )
            })
        }
    });
}

export default emailQueue;