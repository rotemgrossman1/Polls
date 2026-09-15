'use strict';

const NICKNAME_MAX_LENGTH = 20;
// Lowercasing can turn one character into several, so the comparison key gets more room.
const NICKNAME_KEY_MAX_LENGTH = 80;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'participants',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          poll_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'polls', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          nickname: {
            type: Sequelize.STRING(NICKNAME_MAX_LENGTH),
            allowNull: false,
          },
          // The nickname as compared for uniqueness: invisible characters removed, lowercase, NFC.
          nickname_key: {
            type: Sequelize.STRING(NICKNAME_KEY_MAX_LENGTH),
            allowNull: false,
          },
          // Random key the joining device sends, so a repeated join returns the same participant.
          join_key: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('participants', {
        fields: ['nickname_key'],
        type: 'check',
        where: { nickname_key: { [Sequelize.Op.ne]: '' } },
        name: 'participants_nickname_key_check',
        transaction,
      });

      await queryInterface.addConstraint('participants', {
        fields: ['poll_id', 'nickname_key'],
        type: 'unique',
        name: 'participants_poll_id_nickname_key_key',
        transaction,
      });

      await queryInterface.addConstraint('participants', {
        fields: ['poll_id', 'join_key'],
        type: 'unique',
        name: 'participants_poll_id_join_key_key',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('participants');
  },
};
