const { StatusCodes } = require("http-status-codes");
const Country = require("../models/Country");
const Tournament = require("../models/Tournament");
const Match = require("../models/Match");
const { BadRequestError } = require("../errors");

const getTournaments = async (req, res) => {
  let tournaments = await Tournament.find({}).sort({ city: "asc" });
  const countries = await Country.find({});
  tournaments = tournaments.map((t) => {
    const country = countries.find((c) => {
      return c.code.toLowerCase() === t.countryCode.toLowerCase();
    });

    if (country) {
      return {
        id: t._id,
        city: t.city,
        code: t.code,
        startDate: t.startDate,
        endDate: t.endDate,
        countryName: country.name,
        countryFlag: country.countryFlag,
      };
    }

    return t;
  });

  res.status(StatusCodes.OK).json({ tournaments });
};

const getTournamentsByDate = async (req, res) => {
  const { date } = req.params;
  let tournaments = await Tournament.find({}).sort({ city: "asc" });
  const countries = await Country.find({});
  const matches = await Match.find({});
  const options = { year: "numeric", month: "numeric", day: "numeric" };

  tournaments = tournaments
    .filter((t) => {
      const startDate = new Date(t.startDate);
      const endDate = new Date(t.endDate);
      const parsedDate = new Date(date);

      return parsedDate >= startDate && parsedDate <= endDate;
    })
    .map((t) => {
      const country = countries.find((c) => {
        return c.code.toLowerCase() === t.countryCode.toLowerCase();
      });
      const matchesCount = matches.filter((m) => {
        const parsedDate = new Date(date).toLocaleDateString("en-CA");
        const matchDate = new Date(m.date).toLocaleDateString("en-CA");

        return parsedDate === matchDate && t.id === m.tournamentId;
      }).length;

      if (country) {
        return {
          id: t.id,
          name: t.name,
          city: t.city,
          code: t.code,
          startDate: t.startDate,
          endDate: t.endDate,
          countryName: country.name,
          countryFlag: country.countryFlag,
          matchesCount: matchesCount,
        };
      }

      return t;
    });

  res.status(StatusCodes.OK).json({ tournaments });
};

const getTournamentsByWeek = async (req, res) => {
  const { weekId } = req.query;

  let tournaments = await Tournament.find({ weekId });

  const countries = await Country.find({});
  tournaments = tournaments.map((t) => {
    const country = countries.find((c) => {
      return c.code.toLowerCase() === t.countryCode.toLowerCase();
    });

    if (country) {
      return {
        id: t.id,
        name: t.name,
        city: t.city,
        code: t.code,
        startDate: t.startDate,
        endDate: t.endDate,
        countryName: country.name,
        countryFlag: country.countryFlag,
      };
    }

    return t;
  });

  res.status(StatusCodes.OK).json({ tournaments });
};

const getSingleTournament = async (req, res) => {
  const { id } = req.params;
  const tournament = await Tournament.findOne({ id });
  if (!tournament) {
    throw new BadRequestError("No tournament found");
  }

  const country = await Country.find({}).select("id name code");

  res.status(StatusCodes.OK).json({
    tournament: {
      ...tournament._doc,
      countryName: country.find(
        (c) => c.code?.toLowerCase() === tournament.countryCode.toLowerCase()
      ).name,
    },
  });
};

const createTournament = async (req, res) => {
  const tournaments = await Tournament.find({}).sort("id");
  const tournament = await Tournament.create({
    ...req.body,
    id: tournaments[tournaments.length - 1].id + 1,
  });
  res.status(StatusCodes.CREATED).json({ tournament });
};

module.exports = {
  getTournaments,
  getTournamentsByDate,
  getTournamentsByWeek,
  getSingleTournament,
  createTournament,
};
