'use strict';

const INVITE_CODE_LENGTH = 10;
const INVITE_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
// Bytes at or above this value are skipped, so every alphabet character is equally likely.
const BYTE_LIMIT = 256 - (256 % INVITE_CODE_ALPHABET.length);
// UUID bytes 6 and 8 carry the version and variant bits, which are not random.
const UUID_FIXED_BYTES = [6, 8];
const UUID_LAST_BYTE = 15;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Random invite code made from gen_random_uuid() bytes, which come from pg_strong_random.
      await queryInterface.sequelize.query(
        `CREATE FUNCTION generate_invite_code() RETURNS varchar(${INVITE_CODE_LENGTH})
        LANGUAGE plpgsql VOLATILE AS $fn$
        DECLARE
          alphabet CONSTANT text := '${INVITE_CODE_ALPHABET}';
          code text := '';
          bytes bytea;
          byte_value integer;
        BEGIN
          WHILE length(code) < ${INVITE_CODE_LENGTH} LOOP
            bytes := uuid_send(gen_random_uuid());
            FOR i IN 0..${UUID_LAST_BYTE} LOOP
              CONTINUE WHEN i IN (${UUID_FIXED_BYTES.join(', ')});
              byte_value := get_byte(bytes, i);
              CONTINUE WHEN byte_value >= ${BYTE_LIMIT};
              code := code || substr(alphabet, byte_value % ${INVITE_CODE_ALPHABET.length} + 1, 1);
              EXIT WHEN length(code) = ${INVITE_CODE_LENGTH};
            END LOOP;
          END LOOP;
          RETURN code;
        END;
        $fn$`,
        { transaction },
      );

      await queryInterface.addColumn(
        'polls',
        'invite_code',
        { type: Sequelize.STRING(INVITE_CODE_LENGTH), allowNull: true },
        { transaction },
      );

      // Polls created before this feature get a link too.
      await queryInterface.sequelize.query('UPDATE polls SET invite_code = generate_invite_code()', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE polls
          ALTER COLUMN invite_code SET NOT NULL,
          ALTER COLUMN invite_code SET DEFAULT generate_invite_code(),
          ADD CONSTRAINT polls_invite_code_check CHECK (invite_code ~ '^[0-9A-Za-z]{${INVITE_CODE_LENGTH}}$')`,
        { transaction },
      );

      await queryInterface.addConstraint('polls', {
        fields: ['invite_code'],
        type: 'unique',
        name: 'polls_invite_code_key',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('polls', 'invite_code', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION generate_invite_code()', { transaction });
    });
  },
};
