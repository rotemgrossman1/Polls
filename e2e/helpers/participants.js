// Direct E2E database access for Share and join poll setup and data-integrity assertions only.
const { withClient } = require('./db');

// Saved nicknames of a poll's participants, sorted.
async function participantNicknames(pollId) {
  return withClient(async (client) => {
    const { rows } = await client.query('SELECT nickname FROM participants WHERE poll_id = $1 ORDER BY nickname', [
      pollId,
    ]);
    return rows.map((row) => row.nickname);
  });
}

// Deletes a poll (its options and participants go with it), as if it were removed later.
async function deletePoll(pollId) {
  await withClient((client) => client.query('DELETE FROM polls WHERE id = $1', [pollId]));
}

module.exports = { participantNicknames, deletePoll };
