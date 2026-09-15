const { DataTypes, Model } = require('sequelize');
const { POLL_LIMITS, ANSWER_TYPES, POLL_STATUS } = require('../utils/pollRules');

const ENUM_MAX_LENGTH = 10;

module.exports = (sequelize) => {
  class Poll extends Model {
    static associate(models) {
      Poll.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
      Poll.hasMany(models.PollOption, { as: 'options', foreignKey: 'pollId', onDelete: 'CASCADE' });
    }
  }

  Poll.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creatorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      question: {
        type: DataTypes.STRING(POLL_LIMITS.QUESTION_MAX_LENGTH),
        allowNull: false,
      },
      details: {
        type: DataTypes.STRING(POLL_LIMITS.DETAILS_MAX_LENGTH),
        allowNull: true,
      },
      answerType: {
        type: DataTypes.STRING(ENUM_MAX_LENGTH),
        allowNull: false,
        validate: { isIn: [ANSWER_TYPES] },
      },
      status: {
        type: DataTypes.STRING(ENUM_MAX_LENGTH),
        allowNull: false,
        defaultValue: POLL_STATUS.OPEN,
        validate: { isIn: [Object.values(POLL_STATUS)] },
      },
      clientRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Poll',
      tableName: 'polls',
      underscored: true,
    },
  );

  return Poll;
};
