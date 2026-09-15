'use strict';

const OPTION_MAX_LENGTH = 100;
const MAX_OPTIONS = 8;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'poll_options',
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
          text: {
            type: Sequelize.STRING(OPTION_MAX_LENGTH),
            allowNull: false,
          },
          position: {
            type: Sequelize.SMALLINT,
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

      await queryInterface.addConstraint('poll_options', {
        fields: ['position'],
        type: 'check',
        where: { position: { [Sequelize.Op.between]: [0, MAX_OPTIONS - 1] } },
        name: 'poll_options_position_check',
        transaction,
      });

      await queryInterface.addConstraint('poll_options', {
        fields: ['poll_id', 'position'],
        type: 'unique',
        name: 'poll_options_poll_id_position_key',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('poll_options');
  },
};
