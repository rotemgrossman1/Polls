const { DataTypes, Model } = require('sequelize');
const { NICKNAME_MAX_LENGTH, NICKNAME_KEY_MAX_LENGTH } = require('../utils/participantRules');

module.exports = (sequelize) => {
  class Participant extends Model {
    static associate(models) {
      Participant.belongsTo(models.Poll, { as: 'poll', foreignKey: 'pollId' });
    }
  }

  Participant.init(
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
      // Trimmed, as the participant entered it.
      nickname: {
        type: DataTypes.STRING(NICKNAME_MAX_LENGTH),
        allowNull: false,
      },
      // Unique per poll: the nickname with invisible characters removed, lowercase, NFC.
      nicknameKey: {
        type: DataTypes.STRING(NICKNAME_KEY_MAX_LENGTH),
        allowNull: false,
      },
      // Sent by the joining device; unique per poll, so a repeated join finds this participant.
      joinKey: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Participant',
      tableName: 'participants',
      underscored: true,
    },
  );

  return Participant;
};
