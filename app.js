/* ══════════════════════════════════════════════════
   CertaWorks — shared site JS
   ══════════════════════════════════════════════════ */

// ── Nav: frosted glass on scroll ─────────────────
const siteNav = document.getElementById('site-nav');
if (siteNav) {
  const onScroll = () => siteNav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Scroll-reveal ────────────────────────────────
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}


// ── Hero parallax + fade ─────────────────────────
const heroInner = document.querySelector('.hero-inner');
const scrollCue = document.querySelector('.scroll-cue');
if (heroInner) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroInner.style.transform = `translateY(${y * 0.28}px)`;
    heroInner.style.opacity   = String(Math.max(0, 1 - y / 520));
    if (scrollCue) scrollCue.classList.toggle('is-hidden', y > 60);
  }, { passive: true });
}

// ── Magnetic buttons ─────────────────────────────
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.3;
    const y = (e.clientY - r.top  - r.height / 2) * 0.3;
    el.style.transition = 'transform 80ms linear';
    el.style.transform  = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform 500ms cubic-bezier(0.23, 1, 0.32, 1)';
    el.style.transform  = '';
  });
});

// ── 3D card tilt ─────────────────────────────────
document.querySelectorAll('[data-tilt]').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transition = 'transform 60ms linear, box-shadow 300ms, border-color 300ms';
    card.style.transform  = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 600ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 300ms, border-color 300ms';
    card.style.transform  = '';
  });
});

// ── Animated counters ────────────────────────────
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function animateCounter(el) {
  const target   = parseInt(el.dataset.countTo, 10);
  const suffix   = el.dataset.countSuffix || '';
  const duration = target > 100 ? 1800 : 900;
  const start    = performance.now();

  (function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value    = Math.round(easeOutQuart(progress) * target);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  })(performance.now());
}

if ('IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('[data-count-to]').forEach((el) => countObserver.observe(el));
}

// ── Timeline stagger entrance ────────────────────
if ('IntersectionObserver' in window) {
  const tlObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.tlIndex * 140;
          setTimeout(() => entry.target.classList.add('tl-visible'), delay);
          tlObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('.timeline-item').forEach((el, i) => {
    el.dataset.tlIndex = i;
    tlObserver.observe(el);
  });
}

// ── Canvas particle network (From Source section) ─
const canvas = document.getElementById('sourceCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  const PARTICLE_COUNT = 52;
  const MAX_DIST       = 140;
  const SPEED          = 0.28;
  const REPEL_RADIUS   = 110;
  const REPEL_FORCE    = 0.35;

  let mouseX = -9999, mouseY = -9999;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  1 + Math.random() * 1.5,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      // Gentle mouse repulsion
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dm = Math.hypot(dx, dy);
      if (dm < REPEL_RADIUS && dm > 0) {
        const f = (1 - dm / REPEL_RADIUS) * REPEL_FORCE;
        p.x += (dx / dm) * f;
        p.y += (dy / dm) * f;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16,185,129,0.55)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q    = particles[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(16,185,129,${alpha})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => { resize(); createParticles(); }, { passive: true });
}

// ── Workbench demo ───────────────────────────────
// Only runs when the workbench is present (products page).
const workbench = document.querySelector('.workbench-wrapper');
if (workbench) {
  const scenarios = {
    code: {
      label:    'Code change review',
      action:   'Rewrite authentication middleware after failing tests.',
      context:  'The agent has test output, touched files, and rollback notes, but the change affects login behavior.',
      score:    78,
      decision: 'Review required',
      policy:   'high_risk_review',
      type:     'Code change',
      reasons: [
        'Touches authentication flow.',
        'Test evidence is present but incomplete.',
        'Rollback path should be confirmed.',
      ],
    },
    customer: {
      label:    'Customer message review',
      action:   'Send a refund denial email to an upset enterprise customer.',
      context:  'The agent drafted a message with policy references, but tone, revenue impact, and customer history need review.',
      score:    82,
      decision: 'Review required',
      policy:   'customer_message_review',
      type:     'Customer email',
      reasons: [
        'Customer-facing message with relationship impact.',
        'Policy references should be checked.',
        'Low technical risk but high trust sensitivity.',
      ],
    },
    database: {
      label:    'Database action review',
      action:   'Delete legacy billing table after migration.',
      context:  'The agent believes migration completed, but destructive data changes need stronger evidence before execution.',
      score:    64,
      decision: 'Review required',
      policy:   'critical_action_review',
      type:     'Database change',
      reasons: [
        'Destructive database action.',
        'Migration evidence is incomplete.',
        'Human approval should confirm rollback coverage.',
      ],
    },
    deploy: {
      label:    'Production deploy review',
      action:   'Deploy a model-routing change to production agent workers.',
      context:  'The agent can reduce cost, but production routing changes can affect quality, latency, and user-visible outcomes.',
      score:    69,
      decision: 'Review required',
      policy:   'production_change_review',
      type:     'Production deploy',
      reasons: [
        'Production behavior changes for agent workloads.',
        'Cost and quality impact should be reviewed.',
        'Rollback signal should be visible before release.',
      ],
    },
  };

  const frames = [
    { key: 'proposed', progress: '18%',  verb: 'Proposed' },
    { key: 'scored',   progress: '48%',  verb: 'Scored'   },
    { key: 'routed',   progress: '76%',  verb: 'Routed'   },
    { key: 'logged',   progress: '100%', verb: 'Logged'   },
  ];

  const state = { scenario: 'code', frame: 0, timer: null };

  const sceneLabel   = document.getElementById('sceneLabel');
  const actionTitle  = document.getElementById('actionTitle');
  const actionCtx    = document.getElementById('actionContext');
  const scoreValue   = document.getElementById('scoreValue');
  const decisionVal  = document.getElementById('decisionValue');
  const auditPreview = document.getElementById('auditPreview');
  const reasonList   = document.getElementById('reasonList');
  const progressFill = document.getElementById('progressFill');
  const motionStage  = document.querySelector('.motion-stage');
  const stageSteps   = document.querySelectorAll('.stage-steps li');
  const replayBtn    = document.getElementById('replayButton');

  function timestamp() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function render() {
    const s = scenarios[state.scenario];
    const f = frames[state.frame];

    if (sceneLabel)   sceneLabel.textContent  = s.label;
    if (actionTitle)  actionTitle.textContent  = s.action;
    if (actionCtx)    actionCtx.textContent    = s.context;
    if (scoreValue)   scoreValue.textContent   = `${s.score}%`;
    if (decisionVal)  decisionVal.textContent  = s.decision;
    if (auditPreview) auditPreview.textContent =
      `${timestamp()} · ${s.type} · ${f.verb} · ${s.score}% · policy: ${s.policy}`;
    if (progressFill) progressFill.style.width = f.progress;
    if (motionStage)  motionStage.dataset.frame = f.key;

    stageSteps.forEach((li) =>
      li.classList.toggle('active', li.dataset.step === f.key)
    );

    if (reasonList) {
      reasonList.replaceChildren(
        ...s.reasons.map((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          return li;
        })
      );
    }
  }

  function stopTimer() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  function replay() {
    stopTimer();
    state.frame = 0;
    render();
    state.timer = setInterval(() => {
      state.frame += 1;
      if (state.frame >= frames.length) {
        state.frame = frames.length - 1;
        render();
        stopTimer();
        return;
      }
      render();
    }, 920);
  }

  document.querySelectorAll('.wb-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.scenario = tab.dataset.scenario;
      document.querySelectorAll('.wb-tab').forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      replay();
    });
  });

  if (replayBtn) replayBtn.addEventListener('click', replay);

  render();
  setTimeout(replay, 600);
}

// ── Copy buttons ──────────────────────────────────
document.querySelectorAll('.copy-button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const targetId = btn.dataset.copyTarget;
    const target   = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const pre  = target.querySelector('pre');
    const text = (pre || target).textContent.trim();
    const statusEl = document.getElementById('copyStatus');

    const succeed = () => {
      if (statusEl) statusEl.textContent = 'Copied to clipboard.';
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
        btn.textContent = orig;
      }, 2200);
    };

    const fail = () => {
      if (statusEl) statusEl.textContent = 'Copy failed — select the block manually.';
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        succeed();
      } else {
        const ta = Object.assign(document.createElement('textarea'), {
          value: text, readOnly: true,
        });
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.append(ta);
        ta.select();
        document.execCommand('copy') ? succeed() : fail();
        ta.remove();
      }
    } catch {
      fail();
    }
  });
});

// ── Beta form ─────────────────────────────────────
const betaForm = document.getElementById('betaForm');
if (betaForm) {
  betaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    betaForm.reset();
    const status = document.getElementById('formStatus');
    if (status) {
      status.textContent =
        'You are on the prototype list. Hosted beta access is not live yet.';
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   ✦ PREMIUM POLISH ENGINE — Linear-precise
   Scroll progress · cursor glow · spotlight cards · stagger reveals.
   All effects respect prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll progress bar ──────────────────────────
  (function scrollProgress() {
    if (reduce) return;
    let bar = document.querySelector('.scroll-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'scroll-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = `scaleX(${p})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  // ── data-reveal observer (directional + blur variants) ──
  (function dataReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => obs.observe(el));
  })();

  // ── Auto-stagger: set --i on children of [data-stagger] ──
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });

  if (reduce) return; // pointer-driven effects below are motion; skip them

  // ── Cursor-reactive ambient glow ─────────────────
  document.querySelectorAll('[data-cursor-glow]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
      el.classList.add('glow-on');
    });
    el.addEventListener('pointerleave', () => el.classList.remove('glow-on'));
  });

  // ── Spotlight cards: track pointer for .spotlight border glow ──
  document.querySelectorAll('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
})();
