const DAY = 86400000;
function labelNames(labels) {
  return (labels || []).map(label => typeof label === 'string' ? label : label.name);
}

function stalePullRequests(input) {
  const now = Date.parse(input.now);
  const actions = [];
  let closures = 0, warnings = 0;
  const warning = "This PR has been automatically marked as stale because it has no activity for 30 days. It will be closed if no further activity occurs within another 7 days of this comment. If it is closed, you may reopen it anytime when you're ready again.";
  const closing = 'This pull request has been automatically closed because it has been open for more than 180 days with no recent activity.\n\nIf you believe this work is still relevant, please feel free to reopen or create a new pull request. Thank you for your contribution!';
  for (const pr of input.pull_requests) {
    if (pr.state !== 'open' || labelNames(pr.labels).some(label => label.toLowerCase() === 'no-stale') || ['dotnet-maestro[bot]', 'dotnet-maestro'].includes(pr.author)) continue;
    const created = Date.parse(pr.created_at);
    if (!Number.isFinite(created)) throw new Error('Invalid PR creation timestamp');
    if (now - created <= 180 * DAY) continue;
    const activity = [...pr.comments, ...pr.reviews].filter(event => !event.author.endsWith('[bot]')).map(event => Date.parse(event.created_at));
    const latest = activity.length ? Math.max(...activity) : created;
    if (!Number.isFinite(latest)) throw new Error('Invalid activity timestamp');
    if (now - latest > 37 * DAY) {
      if (closures < 25) { actions.push({ kind: 'close_pull_request', pull_request_number: pr.number, body: closing }); closures++; }
      continue;
    }
    const alreadyWarned = pr.comments.some(comment => comment.author === input.actor_login && comment.body === warning);
    if (now - latest > 30 * DAY && !alreadyWarned && warnings < 30) {
      actions.push({ kind: 'add_comment', item_number: pr.number, body: warning }); warnings++;
    }
  }
  return { actions };
}


module.exports = { stalePullRequests };
