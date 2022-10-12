import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Match } from "meteor/check";

if (Meteor.isServer) {
  Meteor.methods({
    sendEmail: function (to, from, subject, html, attachments, replyTo) {
      check([to, from, subject, html], [String]);
      check(replyTo, Match.OneOf(null, undefined, String));
      check(attachments, Match.OneOf(null, undefined, Object));

      let serverUrl = Meteor.absoluteUrl();
      let liveServers = [
        "https://postrubella.org_placeholder.io/",
        "https://pr.org_placeholder.io/",
      ];
      let isLive = liveServers.includes(serverUrl);

      let emailArray = to.replace(/\s/g, "").split(",");

      if (!isLive || process.env.NODE_ENV == "staging") {
        emailArray = to
          .replace(/\s/g, "")
          .split(",")
          .map((email) =>
            email.split("@")[1] !== "org_placeholder.io" &&
            email.split("@")[1] !== "loremine.com"
              ? email.split("@")[0] + "@org_placeholder.io"
              : email
          );
      }

      try {
        //send email
        Email.send({
          to: emailArray,
          from,
          subject,
          html,
          attachments,
          replyTo,
        });
        //update log
        Meteor.call("outboundEmailLogs.insert", to, subject, html);
        return true;
      } catch (error) {
        console.error(error);
        return error;
      }
    },
  });
}
