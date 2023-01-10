const sendgrid = require("@sendgrid/mail");

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

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
