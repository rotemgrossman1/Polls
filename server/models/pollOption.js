const { DataTypes, Model } = require('sequelize');
const { POLL_LIMITS } = require('../utils/pollRules');

module.exports = (sequelize) => {
  class PollOption extends Model {
    static associate(models) {
      PollOption.belongsTo(models.Poll, { as: 'poll', foreignKey: 'pollId' });
    }
  }

  PollOption.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pollId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      text: {
        type: DataTypes.STRING(POLL_LIMITS.OPTION_MAX_LENGTH),
        allowNull: false,
      },
      position: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 0, max: POLL_LIMITS.MAX_OPTIONS - 1 },
      },
    },
    {
      sequelize,
      modelName: 'PollOption',
      tableName: 'poll_options',
      underscored: true,
    },
  );

  return PollOption;
};
