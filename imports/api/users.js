import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { hotp, authenticator } from "otplib";

if (Meteor.isServer) {
  // super-admin
  Meteor.publish("adminAllUsers", () => {
    const user = Meteor.user();

    if (!user) return console.error("no user in adminAllUsers sub");
    if (!Roles.userIsInRole(user._id, ["super-admin"]))
      return console.error("not super-admin");

    return Meteor.users.find({}, { sort: [["username", "asc"]] });
  });
  // client-manager / location-manager
  Meteor.publish("allUsers", () => {
    const user = Meteor.user();
    if (!user) return console.error("no user in allUsers sub");
    currentUser = Meteor.userId();

    if (Roles.userIsInRole(currentUser, ["super-admin"])) {
      return Meteor.users.find(
        { "profile.clientId": user.profile.clientId },
        { sort: [["username", "asc"]], fields: { updatedAt: 0, owner: 0 } }
      );
    }
    if (Roles.userIsInRole(currentUser, ["client-manager"])) {
      return Meteor.users.find(
        {
          "profile.clientId": user.profile.clientId,
          roles: { $in: ["normal-user", "client-manager"] },
        },
        { sort: [["username", "asc"]], fields: { updatedAt: 0, owner: 0 } }
      );
    }
    if (
      Roles.userIsInRole(currentUser, [
        "location-manager",
        "normal-user",
        "group-admin",
      ])
    ) {
      return Meteor.users.find(
        { "profile.clientId": user.profile.clientId, roles: "normal-user" },
        { sort: [["username", "asc"]], fields: { updatedAt: 0, owner: 0 } }
      );
    }
  });

  //users subscriptions for dropdowns
  Meteor.publish("users.list.dropdowns", (limit, findQuery) => {
    check([limit], [Number]);
    check([findQuery], [Object]);
    //authentication
    const user = Meteor.user();
    if (!user) throw new Meteor.Error("not authorized");
    currentUser = Meteor.userId();
    var Query = findQuery.username;
    if (Roles.userIsInRole(currentUser, ["super-admin"])) {
      return Meteor.users.find(
        { "profile.clientId": user.profile.clientId, username: Query },
        { sort: [["username", "asc"]], limit: limit, fields: { username: 1 } }
      );
    }
    if (Roles.userIsInRole(currentUser, ["client-manager"])) {
      return Meteor.users.find(
        {
          "profile.clientId": user.profile.clientId,
          username: Query,
          roles: { $in: ["normal-user", "client-manager"] },
        },
        { sort: [["username", "asc"]], limit: limit, fields: { username: 1 } }
      );
    }
    if (
      Roles.userIsInRole(currentUser, [
        "location-manager",
        "normal-user",
        "group-admin",
      ])
    ) {
      return Meteor.users.find(
        {
          "profile.clientId": user.profile.clientId,
          username: Query,
          roles: "normal-user",
        },
        { sort: [["username", "asc"]], limit: limit, fields: { username: 1 } }
      );
    }
  });
  Meteor.users.allow({
    insert() {
      return false;
    },
    update() {
      return true;
    },
    remove() {
      return true;
    },
  });
  Accounts.onCreateUser((options, user) => {
    check([options, user], [Object]);

    if (options.profile) {
      user.profile = options.profile;
    }
    if (options.roles) {
      user.roles = options.roles;
    }

    // Enable two-factor auth
    user.twoFactorEnabled = true;

    return user;
  });
  Meteor.methods({
    // create user
    createNewUser(options, emailDetails) {
      check([options, emailDetails], [Object]);
      Accounts.createUser(options);

      const { email } = Meteor.settings.private.smtp;
      let appUrl = Meteor.absoluteUrl();
      const text =
        `${
          "<div>" +
          "<div>" +
          '<div style="margin-bottom:20px"><img width="300" height="80" alt="logo" src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"/></div>' +
          '<div style="margin-bottom:20px">Hi '
        }${
          emailDetails.firstname
        },<br/><br/>Your login credentials for the postrubella. Visit <a href=${appUrl}>${appUrl}</a> to login.</div>` +
        `<div style="clear:both;"><b style="width:110px; display:block; float:left;">Username: </b>${emailDetails.username}</div>` +
        `<div style="clear:both;"><b style="width:110px; display:block; float:left;">Password: </b>${emailDetails.password}</div>` +
        '<div style="margin-top:20px">Yours sincerely,' +
        '<div style="margin-bottom:20px">The postrubella team.' +
        "</div>" +
        "</div>";

      this.unblock();
      //send email
      Meteor.call(
        "emailQueue",
        emailDetails.email,
        `org_placeholder postrubella ${email}`,
        "Welcome to the postrubella.",
        text,
        null,
        `org_placeholder postrubella ${email}`
      );
    },

    //Change Password
    setUserPassword(userId, newPassword) {
      check([userId, newPassword], [String]);
      Accounts.setPassword(userId, newPassword);
    },

    //update user profile
    updateUserProfile(userId, Params) {
      check(userId, String);
      check(Params, Object);

      let user = Meteor.users.find({ _id: userId }).fetch()[0];
      if (user) {
        let firstName = Params.firstName
          ? Params.firstName
          : user.profile.firstname;
        let lastName = Params.lastName
          ? Params.lastName
          : user.profile.lastname;
        let userEmail = Params.userEmail
          ? Params.userEmail
          : user.emails[0].address;
        let role = Params.role ? Params.role : user.roles;
        let language = Params.language
          ? Params.language
          : user.profile.language;
        let timezone = Params.timezone
          ? Params.timezone
          : user.profile.timezone;
        let termsAccepted =
          typeof Params.termsAccepted !== "undefined"
            ? Params.termsAccepted
            : user.profile.termsAccepted;
        let twoFactorEnabled =
          typeof Params.twoFactorEnabled !== "undefined"
            ? Params.twoFactorEnabled
            : user.twoFactorEnabled;

        // update record
        Meteor.users.update(userId, {
          $set: {
            "profile.firstname": firstName,
            "profile.lastname": lastName,
            "emails.0.address": userEmail,
            roles: role,
            "profile.language": language,
            "profile.timezone": timezone,
            "profile.termsAccepted": termsAccepted,
            twoFactorEnabled: twoFactorEnabled,
            updatedAt: new Date(),
          },
        });
      }
    },

    //Two step authentication first step
    twoFactorAuthStepOne(userId, password) {
      check([userId, password], [String]);
      const { email } = Meteor.settings.private.smtp;
      let user = Meteor.users
        .find({ $or: [{ username: userId }, { "emails.0.address": userId }] })
        .fetch()[0];
      if (user) {
        // Check user is disabled
        if (user.disabled == true) throw new Meteor.Error("User disabled");

        let toEmail = user.emails[0].address;
        let auth = Accounts._checkPassword(user, password);
        if (auth.error) {
          throw new Meteor.Error(auth.error.reason);
        } else {
          // Update twoFactorSecret on user record
          const secret = authenticator.generateSecret();
          const token = hotp.generate(secret, 1);
          if (user.twoFactorEnabled) {
            //update user
            Meteor.users.update(auth.userId, {
              $set: { "services.twoFactorSecret": secret },
            });
            //send email
            const text =
              `${
                "<div>" +
                "<div>" +
                '<div style="margin-bottom:20px"><img width="300" height="80" alt="logo" src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"/></div>' +
                '<div style="margin-bottom:20px">Hi '
              }${
                user.profile.firstname
              },<br/><br/>Please use the following OTP to complete the login action.</div>` +
              `<div style="clear:both;">
                <span><b>OTP: </b> ${token}</span> 
                </div>` +
              '<div style="margin-top:20px">Yours sincerely,' +
              '<div style="margin-bottom:20px">The postrubella team.' +
              "</div>" +
              "</div>";
            Meteor.call(
              "emailQueue",
              toEmail,
              `org_placeholder postrubella ${email}`,
              "Login to the postrubella.",
              text,
              null,
              `org_placeholder postrubella ${email}`
            );
          }
          return {
            userId: auth.userId,
            secret: secret,
            twoFactorEnabled: user.twoFactorEnabled,
          };
        }
      } else {
        throw new Meteor.Error("User not found");
      }
    },
  });
}
