const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors/index");

const Match = require("../models/Match");
const Player = require("../models/Player");
const Favorite = require("../models/Favorite");
const Tournament = require("../models/Tournament");
const Round = require("../models/Round");

const getMatchesByTournamentIdAndDate = async (req, res) => {
  const { tournamentId, date } = req.query;
  const userId = req.user.userId;

  if (!tournamentId || !date) {
    throw new BadRequestError("Provide tournament and date");
  }

  const tournament = await Tournament.find({ id: tournamentId });

  if (!tournament) {
    throw new NotFoundError(`No tournament with id ${tournamentId}`);
  }

  let matches = await Match.find({ tournamentId });
  const players = await Player.find({
    id: {
      $in: [
        ...matches.map((match) => {
          return match.homeId;
        }),
        ...matches.map((match) => {
          return match.awayId;
        }),
      ],
    },
  });

  const favorites = await Favorite.find({ userId });

  matches = matches
    .filter((match) => {
      const matchDate = new Date(match.date).toLocaleDateString("en-CA");
      const parsedDate = new Date(date).toLocaleDateString("en-CA");
      return matchDate === parsedDate;
    })
    .map((match) => {
      const homePlayer = players.find((p) => {
        return p.id === match.homeId;
      });
      const awayPlayer = players.find((p) => {
        return p.id === match.awayId;
      });
      const favoriteId = favorites.find(
        (favorite) =>
          favorite.matchId === match.id && favorite.userId === userId
      )?._id;

      if (!homePlayer || !awayPlayer) {
        return undefined;
      }

      return {
        ...match._doc,
        homePlayer: { ...homePlayer._doc },
        awayPlayer: { ...awayPlayer._doc },
        favoriteId,
      };
    })
    .filter((match) => Boolean(match));

  res.status(StatusCodes.OK).json({ matches });
};

const getSingleMatch = async (req, res) => {
  const { id } = req.params;
  const match = await Match.findOne({ id: Number(id) });

  if (!match) {
    throw new NotFoundError(`No match found with id: ${id}`);
  }

  const homePlayer = await Player.findOne({ id: match.homeId });

  if (!homePlayer) {
    throw new NotFoundError("Home player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: match.awayId });

  if (!awayPlayer) {
    throw new NotFoundError("Away player does not exist!");
  }

  const winnerPlayer = await Player.findOne({ id: match.winnerId });

  const round = await Round.findOne({ _id: match.roundId });

  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const tournament = await Tournament.findOne({ id: match.tournamentId });

  res.status(StatusCodes.OK).json({
    match,
  });
};

const getSingleMatchManual = async (req, res) => {
  const { id } = req.params;
  const match = await Match.findOne({ id: Number(id) });

  if (!match) {
    throw new NotFoundError(`No match found with id: ${id}`);
  }

  const homePlayer = await Player.findOne({ id: match.homeId });

  if (!homePlayer) {
    throw new NotFoundError("Home player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: match.awayId });

  if (!awayPlayer) {
    throw new NotFoundError("Away player does not exist!");
  }

  const winnerPlayer = await Player.findOne({ id: match.winnerId });

  const round = await Round.findOne({ _id: match.roundId });

  if (!round) {
    throw new NotFoundError("Round does not exist!");
  }

  const tournament = await Tournament.findOne({ id: match.tournamentId });

  res.status(StatusCodes.OK).json({
    ...match._doc,
    homePlayer,
    awayPlayer,
    winnerPlayer,
    round,
    tournament,
  });
};

const getMatchesByTournamentIdAndRoundId = async (req, res) => {
  const { tournamentId, roundId } = req.query;

  const players = await Player.find({});
  let matches = await Match.find({ tournamentId, roundId });
  matches = matches.map((match) => {
    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);

    return {
      ...match._doc,
      homePlayer: { ...homePlayer._doc },
      awayPlayer: { ...awayPlayer._doc },
    };
  });
  res.status(StatusCodes.OK).json({ matches });
};

const getMatchesByTournamentIdGroupedByRoundId = async (req, res) => {
  const { tournamentId } = req.query;

  let matches = await Match.find({ tournamentId });
  let rounds = await Round.find({});
  let players = await Player.find({});

  matches = matches.map((match) => {
    const round = rounds.find((round) => round.id === match.roundId);

    const homePlayer = players.find((player) => player.id === match.homeId);
    const awayPlayer = players.find((player) => player.id === match.awayId);

    return {
      ...match._doc,
      homePlayer: { ...homePlayer._doc },
      awayPlayer: { ...awayPlayer._doc },
    };
  });

  // let tournament = await Tournament.findOne({ tournamentId });

  const matchesByRound = matches.reduce((acc, value) => {
    if (!acc[value.roundId]) {
      acc[value.roundId] = [];
    }

    acc[value.roundId].push(value);
    return acc;
  }, {});

  matches = Object.keys(matchesByRound).map((key) => {
    return {
      round: rounds.find((round) => round.id === key),
      matches: matchesByRound[key],
    };
  });

  res.status(StatusCodes.OK).json({ groupedMatches: matches });
};

const getMatchesByPlayerGroupedByTournamentId = async (req, res) => {
  const { playerId } = req.query;

  const players = await Player.find({});
  const tournaments = await Tournament.find({});

  let matches = await Match.find({
    $or: [
      { homeId: { $eq: playerId } },
      {
        awayId: { $eq: playerId },
      },
    ],
  });

  let result = matches
    .map((match) => {
      const homePlayer = players.find((player) => player.id === match.homeId);
      const awayPlayer = players.find((player) => player.id === match.awayId);

      if (!homePlayer || !awayPlayer) return undefined;

      return {
        ...match._doc,
        homePlayer: { ...homePlayer._doc },
        awayPlayer: { ...awayPlayer._doc },
      };
    })
    .filter((match) => match);

  const groupedMatches = result.reduce((acc, value) => {
    if (!acc[value.tournamentId]) {
      acc[value.tournamentId] = [];
    }

    acc[value.tournamentId].push(value);

    return acc;
  }, {});

  result = Object.keys(groupedMatches).map((key) => {
    const tournament = tournaments.find(
      (tournament) => tournament.id === Number(key)
    );

    return {
      tournament,
      matches: groupedMatches[key],
    };
  });

  res.status(StatusCodes.OK).json({ groupedMatches: result });
};

const createMatch = async (req, res) => {
  const { homeId, awayId, winnerId } = req.body;
  console.log(homeId);
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

  if (winnerId && winnerId !== homeId && winnerId !== awayId) {
    throw new BadRequestError("Winner should be from the selected players!");
  }

  const matches = await Match.find({}).sort("id");

  const match = await Match.create({
    ...req.body,
    id: matches[matches.length - 1].id + 1,
    round: "n/a",
  });
  res.status(StatusCodes.CREATED).json({ match });
};

const updateMatch = async (req, res) => {
  const { id } = req.params;
  const { homeId, awayId, winnerId } = req.body;

  console.log(homeId, awayId);

  const match = await Match.findOne({ id: Number(id) });
  if (!match) {
    throw new NotFoundError("Match does not exist!");
  }

  const homePlayer = await Player.findOne({ id: homeId });
  if (!homePlayer) {
    throw new NotFoundError("Player does not exist!");
  }

  const awayPlayer = await Player.findOne({ id: awayId });
  if (!awayPlayer) {
    throw new NotFoundError("Player does not exist!");
  }

  if (homeId === awayId) {
    throw new BadRequestError("You cannot select same players!");
  }

  if (winnerId) {
    if (winnerId !== homeId && winnerId !== awayId) {
      throw new BadRequestError("Winner should be from the selected players!");
    }
  }

  const newMatch = await Match.findOneAndUpdate(
    { id: Number(id) },
    { ...req.body },
    { runValidators: true, new: true }
  );

  res.status(StatusCodes.OK).json({ match: newMatch });
};

module.exports = {
  getMatchesByTournamentIdAndDate,
  getSingleMatch,
  getSingleMatchManual,
  getMatchesByTournamentIdAndRoundId,
  getMatchesByTournamentIdGroupedByRoundId,
  getMatchesByPlayerGroupedByTournamentId,
  createMatch,
  updateMatch,
};
