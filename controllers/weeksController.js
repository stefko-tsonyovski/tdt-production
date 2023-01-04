const Week = require("../models/Week");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllWeeks = async (req, res) => {
  const weeks = await Week.find({});
  res.status(StatusCodes.OK).json({ weeks });
};

const createWeek = async (req, res) => {
  const { name, from, to } = req.body;

  const weekAlreadyExists = await Week.findOne({ name });
  if (weekAlreadyExists) {
    throw new BadRequestError("Week already exists!");
  }

  const week = await Week.create({
    name,
    from,
    to,
  });

  res.status(StatusCodes.CREATED).json({ week });
};

const getWeek = async (req, res) => {
  const { id } = req.params;

  const week = await Week.findOne({ _id: id });
  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).json({ week });
};

const updateWeek = async (req, res) => {
  const { name, from, to } = req.body;
  const { id } = req.params;

  const week = await Week.findOneAndUpdate(
    { _id: id },
    {
      name,
      from,
      to,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).json({ week });
};

const deleteWeek = async (req, res) => {
  const { id } = req.params;

  const week = await Week.findOneAndRemove({ _id: id });

  if (!week) {
    throw new NotFoundError("Week does not exist!");
  }

  res.status(StatusCodes.OK).send();
};

module.exports = {
  getAllWeeks,
  createWeek,
  getWeek,
  updateWeek,
  deleteWeek,
};
