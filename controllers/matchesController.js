const { StatusCodes } = require("http-status-codes");
const Match = require("../models/Match");
const Player = require("../models/Player");
const { BadRequestError, NotFoundError } = require("../errors/index");

const getSingleTournamentMatches = async (req, res) => {
  const { id, date } = req.params;

  if (!id || !date) {
    throw new BadRequestError("Provide tournament and date");
  }

  let matches = await Match.find({ tournamentId: id });

  const players = await Player.find({
    id: {
      $in: [
        ...matches.map((m) => {
          return m.homeId;
        }),
        ...matches.map((m) => {
          return m.awayId;
        }),
      ],
    },
  });

  matches = matches
    .filter((m) => {
      const matchDate = new Date(m.date).toLocaleDateString("en-CA");
      const parsedDate = new Date(date).toLocaleDateString("en-CA");
      return matchDate === parsedDate;
    })
    .map((m) => {
      return {
        id: m.id,
        homePlayer: players.find((p) => {
          return p.id === m.homeId;
        }),
        awayPlayer: players.find((p) => {
          return p.id === m.awayId;
        }),
        homeSets: m.homeSets,
        awaySets: m.awaySets,
        winnerId: m.winnerId,
      };
    })
    .filter((m) => Boolean(m.homePlayer) && Boolean(m.awayPlayer));

  res.status(StatusCodes.OK).json({ matches });
};

const getSingleMatch = async (req, res) => {
  const { id } = req.params;
  const match = await Match.findOne({ id });

  if (!match) {
    throw new NotFoundError(`No match found with id: ${id}`);
  }

  res.status(StatusCodes.OK).json({ match });
};

const createMatch = async (req, res) => {
  const { homeId, awayId, winnerId } = req.body;

  const homePlayer = await Player.findOne({ id: homeId });
  if (!homePlayer) {
    throw new BadRequestError("Player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: awayId });
  if (!awayPlayer) {
    throw new BadRequestError("Player does not exist!");
  }

  if (homeId === awayId) {
    throw new BadRequestError("You cannot select same players!");
  }

  if (winnerId !== homeId && winnerId !== awayId) {
    throw new BadRequestError("Winner should be from the selected players!");
  }

  const matches = await Match.find({}).sort("id");

  const match = await Match.create({
    ...req.body,
    id: matches[matches.length - 1].id + 1,
  });
  res.status(StatusCodes.CREATED).json({ match });
};

module.exports = {
  getSingleTournamentMatches,
  getSingleMatch,
  createMatch,
};
