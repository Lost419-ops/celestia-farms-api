function info(...args) {
  console.log('[celestia]', ...args);
}

function error(...args) {
  console.error('[celestia]', ...args);
}

module.exports = { info, error };