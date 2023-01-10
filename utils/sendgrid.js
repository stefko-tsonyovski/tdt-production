const sendgrid = require("@sendgrid/mail");

const SENDGRID_API_KEY =
  "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";

sendgrid.setApiKey(SENDGRID_API_KEY);

const sendByGrid = (msg) => {
  sendgrid
    .send(msg)
    .then((resp) => {
      console.log("Email sent\n", resp);
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = { sendByGrid };
