const { DataTypes, Model } = require('sequelize');

const USERNAME_MAX_LENGTH = 50;

module.exports = (sequelize) => {
  class User extends Model {}

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(USERNAME_MAX_LENGTH),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
    },
  );

  return User;
};
