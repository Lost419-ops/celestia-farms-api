const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { AppError } = require('./utils/errors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'celestia-farms-auth' });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'No such endpoint.' });
});

/* eslint-disable-next-line no-unused-vars */
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'BAD_JSON', message: 'Request body is not valid JSON.' });
  }
  console.error('[celestia] Unhandled error', err);
  return res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong. Try again.' });
});

module.exports = app;