'use strict';

const QUESTION_MAX_LENGTH = 200;
const DETAILS_MAX_LENGTH = 1000;
const ENUM_MAX_LENGTH = 10;
const ANSWER_TYPES = ['single', 'multiple'];
const STATUSES = ['open', 'closed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'polls',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          creator_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          question: {
            type: Sequelize.STRING(QUESTION_MAX_LENGTH),
            allowNull: false,
          },
          details: {
            type: Sequelize.STRING(DETAILS_MAX_LENGTH),
            allowNull: true,
          },
          answer_type: {
            type: Sequelize.STRING(ENUM_MAX_LENGTH),
            allowNull: false,
          },
          status: {
            type: Sequelize.STRING(ENUM_MAX_LENGTH),
            allowNull: false,
            defaultValue: 'open',
          },
          client_request_id: {
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

      await queryInterface.addConstraint('polls', {
        fields: ['answer_type'],
        type: 'check',
        where: { answer_type: ANSWER_TYPES },
        name: 'polls_answer_type_check',
        transaction,
      });

      await queryInterface.addConstraint('polls', {
        fields: ['status'],
        type: 'check',
        where: { status: STATUSES },
        name: 'polls_status_check',
        transaction,
      });

      await queryInterface.addConstraint('polls', {
        fields: ['creator_id', 'client_request_id'],
        type: 'unique',
        name: 'polls_creator_id_client_request_id_key',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('polls');
  },
};
