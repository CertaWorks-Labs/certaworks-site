const dashboardRoot = document.querySelector('[data-dashboard]');

if (dashboardRoot) {
  initDashboard(dashboardRoot);
}

const sampleDashboardData = {
  generated_at: new Date().toISOString(),
  mode: 'fallback',
  counts: {
    total: 128,
    allow: 84,
    review: 31,
    block: 13,
    projects: 4
  },
  recent_checks: [
    {
      gate_id: 'chk-1042',
      created_at: '2026-05-17T09:42:00.000Z',
      action: 'Delete billing table after migration',
      context: 'Migration evidence is incomplete and rollback coverage has not been confirmed.',
      score: { score: 0.47 },
      threshold: 0.95,
      decision: 'review',
      policy: 'critical_risk_threshold',
      policy_version: 1,
      source: 'Codex',
      project: 'billing-migration',
      agent: 'builder',
      risk_level: 'critical',
      approval_status: 'pending',
      reasons: [
        'Action includes destructive production-impact language.',
        'Score 47% is below the 95% threshold.',
        'Risk level "critical" applied.'
      ],
      approval_history: [
        { actor: 'confidence-gate', status: 'pending', reason: 'Hold for human review.', timestamp: '2026-05-17T09:42:00.000Z' }
      ],
      enforcement_receipts: []
    },
    {
      gate_id: 'chk-1039',
      created_at: '2026-05-17T09:31:00.000Z',
      action: 'Update local README install section',
      context: 'The change is local, reversible, and backed by existing install commands.',
      score: { score: 0.88 },
      threshold: 0.75,
      decision: 'allow',
      policy: 'default_threshold',
      policy_version: 1,
      source: 'Claude',
      project: 'certaworks-docs',
      agent: 'docs',
      risk_level: 'low',
      approval_status: 'not_required',
      reasons: ['Score 88% meets the 75% threshold.'],
      approval_history: [
        { actor: 'confidence-gate', status: 'not_required', reason: 'No approval required.', timestamp: '2026-05-17T09:31:00.000Z' }
      ],
      enforcement_receipts: []
    },
    {
      gate_id: 'chk-1036',
      created_at: '2026-05-17T09:18:00.000Z',
      action: 'Deploy router change to production workers',
      context: 'Production routing can affect latency, cost, and output quality for active agent workers.',
      score: { score: 0.51 },
      threshold: 0.9,
      decision: 'block',
      policy: 'high_risk_threshold',
      policy_version: 1,
      source: 'CI agent',
      project: 'agent-router',
      agent: 'release',
      risk_level: 'high',
      approval_status: 'rejected',
      reasons: [
        'Action changes a production or customer-facing system.',
        'Score 51% is below the 90% threshold.'
      ],
      approval_history: [
        { actor: 'confidence-gate', status: 'rejected', reason: 'Blocked by policy.', timestamp: '2026-05-17T09:18:00.000Z' }
      ],
      enforcement_receipts: []
    },
    {
      gate_id: 'chk-1031',
      created_at: '2026-05-17T08:55:00.000Z',
      action: 'Send refund denial email',
      context: 'Customer-facing trust impact. Policy references and tone should be reviewed before sending.',
      score: { score: 0.72 },
      threshold: 0.75,
      decision: 'review',
      policy: 'customer_message_review',
      policy_version: 1,
      source: 'Support bot',
      project: 'enterprise-support',
      agent: 'customer',
      risk_level: 'high',
      approval_status: 'pending',
      reasons: [
        'Action touches money movement or billing workflow.',
        'Score 72% is below the 75% threshold.'
      ],
      approval_history: [
        { actor: 'confidence-gate', status: 'pending', reason: 'Hold for human review.', timestamp: '2026-05-17T08:55:00.000Z' }
      ],
      enforcement_receipts: []
    }
  ],
  config: {
    default_threshold: 0.75,
    domain_thresholds: { code_execution: 0.85 },
    risk_thresholds: { critical: 0.95 }
  }
};

async function initDashboard(root) {
  const { data, fallback } = await loadDashboardData(root.dataset.dashboardEndpoint);
  const checks = data.recent_checks.map(normalizeGateResult);
  const checkMap = new Map(checks.map((check) => [check.gate_id, check]));
  const detail = root.querySelector('[data-check-detail]');
  let activeFilter = 'all';

  renderStatus(root, data, fallback);
  renderKpis(root, data.counts || countsFor(checks));
  renderRiskyActions(root, checks);
  renderRows(root, checks);
  renderApprovalQueue(root, checks, fallback);
  bindFilters(root);

  function bindRows() {
    root.querySelectorAll('[data-check-row]').forEach((row) => {
      row.addEventListener('click', () => setDetail(row.dataset.checkId));
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setDetail(row.dataset.checkId);
        }
      });
    });
  }

  function bindFilters() {
    root.querySelectorAll('[data-dashboard-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.dashboardFilter;
        applyFilter(root, activeFilter);
      });
    });
  }

  function setDetail(checkId) {
    const check = checkMap.get(checkId);
    if (!check || !detail) return;

    setText(detail, 'action', check.action);
    setText(detail, 'context', check.context);
    setText(detail, 'score', `${toPercent(check.score)} / ${toPercent(check.threshold)}`);
    setText(detail, 'policy', `${check.policy} v${check.policy_version}`);
    setText(detail, 'sourceProject', `${check.source} / ${check.project}`);
    setText(detail, 'decision', labelForDecision(check.decision));

    const decisionPill = detail.querySelector('[data-detail-field="decision"]');
    if (decisionPill) {
      decisionPill.className = `dashboard-pill ${classForDecision(check.decision)}`;
    }

    replaceList(detail, 'reasons', check.reasons);
    replaceList(detail, 'history', check.approval_history.map(formatApprovalEvent));

    const rawJson = detail.querySelector('[data-detail-field="rawJson"]');
    if (rawJson) rawJson.textContent = JSON.stringify(check.raw, null, 2);

    root.querySelectorAll('[data-check-row]').forEach((row) => {
      row.classList.toggle('is-selected', row.dataset.checkId === checkId);
    });
  }

  bindRows();
  applyFilter(root, activeFilter);
  setDetail(checks[0]?.gate_id);
}

async function loadDashboardData(endpoint) {
  if (!endpoint || window.location.protocol === 'file:') {
    return { data: sampleDashboardData, fallback: true };
  }

  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Dashboard endpoint returned ${response.status}`);
    return { data: await response.json(), fallback: false };
  } catch (error) {
    return { data: sampleDashboardData, fallback: true, error };
  }
}

function normalizeGateResult(check) {
  const nestedScore = check.score && typeof check.score === 'object' ? check.score.score : undefined;
  const score = typeof check.score === 'number' ? check.score : nestedScore ?? 0;
  return {
    raw: check,
    gate_id: check.gate_id,
    created_at: check.created_at,
    action: check.action || 'Unlabeled action',
    context: check.context || 'No context captured.',
    score,
    threshold: check.threshold ?? 0,
    decision: check.decision || 'review',
    policy: check.policy || 'default_threshold',
    policy_version: check.policy_version || 1,
    source: check.source || 'unknown',
    project: check.project || 'default',
    agent: check.agent || 'unknown',
    risk_level: check.risk_level || 'medium',
    approval_status: check.approval_status || 'pending',
    reasons: check.reasons || [],
    approval_history: check.approval_history || [],
    enforcement_receipts: check.enforcement_receipts || []
  };
}

function renderStatus(root, data, fallback) {
  setText(root, 'dashboard-mode', fallback ? 'Local fallback' : 'Live MCP export');
  const updated = root.querySelector('[data-dashboard-updated]');
  if (updated) {
    updated.textContent = fallback
      ? 'Showing static sample data. Export MCP dashboard data to connect this view.'
      : `Updated ${formatTime(data.generated_at)}`;
  }

  const error = root.querySelector('[data-dashboard-error]');
  if (error) error.hidden = !fallback;
}

function renderKpis(root, counts) {
  setKpi(root, 'total', counts.total);
  setKpi(root, 'allow', counts.allow);
  setKpi(root, 'review', counts.review);
  setKpi(root, 'block', counts.block);
  setKpi(root, 'projects', counts.projects);
}

function renderRiskyActions(root, checks) {
  const list = root.querySelector('[data-risky-actions]');
  if (!list) return;
  const risky = checks.filter((check) => check.decision !== 'allow').slice(0, 3);
  list.replaceChildren(
    ...risky.map((check) => {
      const item = document.createElement('li');
      const risk = document.createElement('span');
      const action = document.createElement('strong');
      risk.textContent = labelForRisk(check.risk_level);
      action.textContent = check.action;
      item.append(risk, action);
      return item;
    })
  );
}

function renderRows(root, checks) {
  const body = root.querySelector('[data-check-table-body]');
  if (!body) return;
  body.replaceChildren(
    ...checks.map((check) => {
      const row = document.createElement('tr');
      row.dataset.checkRow = '';
      row.dataset.checkId = check.gate_id;
      row.dataset.decision = check.decision;
      row.tabIndex = 0;
      row.innerHTML = `
        <td>${escapeHtml(formatTime(check.created_at))}</td>
        <td>${escapeHtml(check.source)}</td>
        <td>${escapeHtml(check.agent)}</td>
        <td>${escapeHtml(check.action)}</td>
        <td><span class="dashboard-pill ${classForRisk(check.risk_level)}">${escapeHtml(labelForRisk(check.risk_level))}</span></td>
        <td>${escapeHtml(toPercent(check.score))}</td>
        <td><span class="dashboard-pill ${classForDecision(check.decision)}">${escapeHtml(labelForDecision(check.decision))}</span></td>
        <td>${escapeHtml(labelForApproval(check.approval_status))}</td>
      `;
      return row;
    })
  );
}

function renderApprovalQueue(root, checks, fallback) {
  const queue = root.querySelector('[data-approval-queue]');
  if (!queue) return;
  const pending = checks.filter((check) => check.approval_status === 'pending');
  if (!pending.length) {
    queue.replaceChildren(emptyQueueMessage());
    return;
  }

  queue.replaceChildren(
    ...pending.map((check) => {
      const card = document.createElement('article');
      card.className = 'dashboard-queue-card';
      card.dataset.approvalCard = '';
      card.dataset.gateId = check.gate_id;
      card.innerHTML = `
        <span class="dashboard-pill ${classForRisk(check.risk_level)}">${escapeHtml(labelForRisk(check.risk_level))}</span>
        <h3>${escapeHtml(check.action)}</h3>
        <p>${escapeHtml(check.context)}</p>
        <textarea aria-label="Approval note" placeholder="Add a review note"></textarea>
        <div class="dashboard-queue-actions">
          <button type="button" data-approval-action="approve">${fallback ? 'Mark approved locally' : 'Approve'}</button>
          <button type="button" data-approval-action="reject">${fallback ? 'Mark rejected locally' : 'Reject'}</button>
        </div>
        <small data-approval-status>Waiting approval</small>
      `;
      bindApprovalCard(card, fallback);
      return card;
    })
  );
}

function bindApprovalCard(card, fallback) {
  const status = card.querySelector('[data-approval-status]');
  card.querySelectorAll('[data-approval-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const verb = button.dataset.approvalAction === 'approve' ? 'Approved' : 'Rejected';
      if (status) {
        status.textContent = fallback
          ? `${verb} locally. Use resolve_approval to persist.`
          : `${verb}. Waiting for API confirmation.`;
      }
      card.dataset.status = 'resolved';
    });
  });
}

function applyFilter(root, decision) {
  root.querySelectorAll('[data-dashboard-filter]').forEach((button) => {
    const active = button.dataset.dashboardFilter === decision;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  root.querySelectorAll('[data-check-row]').forEach((row) => {
    row.hidden = decision !== 'all' && row.dataset.decision !== decision;
  });
}

function countsFor(checks) {
  return checks.reduce((counts, check) => {
    counts.total += 1;
    counts[check.decision] += 1;
    counts.projects = new Set(checks.map((item) => item.project)).size;
    return counts;
  }, { total: 0, allow: 0, review: 0, block: 0, projects: 0 });
}

function emptyQueueMessage() {
  const empty = document.createElement('article');
  empty.className = 'dashboard-panel';
  empty.textContent = 'No checks are waiting for approval.';
  return empty;
}

function setKpi(root, field, value) {
  root.querySelectorAll(`[data-kpi-field="${field}"]`).forEach((node) => {
    node.textContent = String(value ?? 0);
  });
}

function setText(root, field, value) {
  const selector = field === 'dashboard-mode'
    ? '[data-dashboard-mode]'
    : `[data-detail-field="${field}"]`;
  const node = root.querySelector(selector);
  if (node) node.textContent = value ?? '';
}

function replaceList(root, field, values) {
  const node = root.querySelector(`[data-detail-field="${field}"]`);
  if (!node) return;
  node.replaceChildren(
    ...values.map((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      return item;
    })
  );
}

function formatApprovalEvent(event) {
  if (typeof event === 'string') return event;
  return `${event.actor || 'unknown'}: ${event.status} - ${event.reason || 'No note'} at ${formatTime(event.timestamp)}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toPercent(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function labelForDecision(decision) {
  if (decision === 'allow') return 'Allow';
  if (decision === 'review') return 'Review';
  return 'Block';
}

function classForDecision(decision) {
  if (decision === 'allow') return 'good';
  if (decision === 'review') return 'warn';
  return 'danger';
}

function labelForRisk(risk) {
  if (!risk) return 'Medium';
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

function classForRisk(risk) {
  if (risk === 'critical' || risk === 'high') return 'danger';
  if (risk === 'medium') return 'warn';
  return 'good';
}

function labelForApproval(status) {
  if (status === 'not_required') return 'Not required';
  if (status === 'pending') return 'Waiting approval';
  return labelForRisk(status);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
