// Direct E2E database access for setup and data-integrity assertions only.
const { serverRequire, e2eDatabaseUrl, OTHER_USERNAME } = require('./env');

const { Client } = serverRequire('pg');

async function withClient(fn) {
  const client = new Client({ connectionString: e2eDatabaseUrl() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function countPollsByQuestion(question) {
  return withClient(async (client) => {
    const { rows } = await client.query('SELECT count(*)::int AS total FROM polls WHERE question = $1', [question]);
    return rows[0].total;
  });
}

// A poll owned by another user, for "not your poll" checks.
async function insertForeignPoll(question) {
  return withClient(async (client) => {
    const { rows: users } = await client.query('SELECT id FROM users WHERE username = $1', [OTHER_USERNAME]);
    const { rows: polls } = await client.query(
      "INSERT INTO polls (creator_id, question, answer_type, client_request_id) VALUES ($1, $2, 'single', gen_random_uuid()) RETURNING id",
      [users[0].id, question],
    );
    await client.query("INSERT INTO poll_options (poll_id, text, position) VALUES ($1, 'Yes', 0), ($1, 'No', 1)", [
      polls[0].id,
    ]);
    return polls[0].id;
  });
}

module.exports = { withClient, countPollsByQuestion, insertForeignPoll };
