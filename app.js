require("dotenv").config();
require("express-async-errors");
const path = require('path');

// REMOVE PROXY IN REACT APP BEFORE DEPLOY!!!!!!!!

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const express = require("express");
const app = express();

const connectDB = require("./db/connect");
const {
  authenticateUser,
  authorizePermissions,
} = require("./middleware/authentication");

// routers
const authRouter = require("./routes/authRoute");
const countriesRoute = require("./routes/countriesRoute");
const weeksRoute = require("./routes/weeksRoute");
const playersRoute = require("./routes/playersRoute");
const tournamentsRoute = require("./routes/tournamentsRoute");
const userWeeksRoute = require("./routes/userWeeksRoute");
const matchesRoute = require("./routes/matchesRoute");
const bracketsRoute = require("./routes/bracketsRoute");
const roundsRoute = require("./routes/roundsRoute");
const picksRoute = require("./routes/picksRoute");
const favoritesRoute = require("./routes/favoriteRoute");
const invitationsRoute = require("./routes/invitationsRoute");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.set("trust proxy", 1);
app.use(express.static(path.resolve(__dirname, './client/build')));
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//   })
// );
app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(helmet());
app.use(cors());
app.use(xss());

// routes
app.use("/api/v1/auth", authRouter);
app.use(
  "/api/v1/countries",
  authenticateUser,
  authorizePermissions("admin", "owner"),
  countriesRoute
);
app.use("/api/v1/weeks", weeksRoute);
app.use("/api/v1/players", playersRoute);
app.use("/api/v1/tournaments", tournamentsRoute);
app.use("/api/v1/userWeeks", userWeeksRoute);
app.use("/api/v1/matches", matchesRoute);
app.use("/api/v1/brackets", bracketsRoute);
app.use("/api/v1/rounds", roundsRoute);
app.use("/api/v1/picks", picksRoute);
app.use("/api/v1/favorites", favoritesRoute);
app.use("/api/v1/invitations", invitationsRoute);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log("CONNECTED TO THE DB...");
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
