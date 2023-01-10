const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "beb579838b3ee3",
    pass: "6b00eb5ca4a9d3",
  },
});

const sendEmail = (message) => {
  transporter.sendMail(message, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

module.exports = { sendEmail };
