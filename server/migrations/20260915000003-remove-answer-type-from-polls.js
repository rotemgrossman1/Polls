'use strict';

// Every poll is single choice: people pick one option (captain, 2026-09-15).
const ENUM_MAX_LENGTH = 10;
const ANSWER_TYPES = ['single', 'multiple'];
const SINGLE = 'single';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Dropping the column also drops polls_answer_type_check.
      await queryInterface.removeColumn('polls', 'answer_type', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'polls',
        'answer_type',
        { type: Sequelize.STRING(ENUM_MAX_LENGTH), allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query('UPDATE polls SET answer_type = :single', {
        replacements: { single: SINGLE },
        transaction,
      });

      await queryInterface.changeColumn(
        'polls',
        'answer_type',
        { type: Sequelize.STRING(ENUM_MAX_LENGTH), allowNull: false },
        { transaction },
      );

      await queryInterface.addConstraint('polls', {
        fields: ['answer_type'],
        type: 'check',
        where: { answer_type: ANSWER_TYPES },
        name: 'polls_answer_type_check',
        transaction,
      });
    });
  },
};
