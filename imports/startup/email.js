Meteor.startup(() => {
  if (Meteor.isServer) {
    const { username, password, server, port } = Meteor.settings.private.smtp;

    process.env.MAIL_URL = `smtp://${encodeURIComponent(
      username
    )}:${encodeURIComponent(password)}@${encodeURIComponent(server)}`;
    if (port) {
      process.env.MAIL_URL += `:${encodeURIComponent(port)}`;
    }
    if (Meteor.isDevelopment) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    }
  }
});

const { email } = Meteor.settings.private.smtp;

Accounts.emailTemplates.siteName = "org_placeholder: postrubella";
Accounts.emailTemplates.from = email;
Accounts.emailTemplates.resetPassword = {
  subject(user) {
    return "Reset your password for postrubella";
  },
  html(user, url) {
    url = url.replace("/#/", "/");
    return `<div>
      <div style="margin-bottom:20px"><img width="300" height="80" alt="logo" src="https://postrubella.ams3.digitaloceanspaces.com/public/img/logo_large.png"/></div>
      <div style="margin-bottom:20px">Click the link below to reset your password for the postrubella.</div>
      <div style="clear:both;"><a href=${url}>${url}</a></div>
      <div style="margin-top:20px">Yours sincerely,</div>
      <div style="margin-bottom:20px">The postrubella team.</div>
    </div>`;
  },
};
