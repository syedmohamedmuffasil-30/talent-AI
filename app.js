/* ─── app.js — TalentAI Frontend Logic ─── */

'use strict';

/* ══════════════════════════════════════
   STATE
══════════════════════════════════════ */
let currentStep = 1;
const totalSteps = 4;
let answerCount = 2;
let lastResult = null;

/* ══════════════════════════════════════
   NAVBAR SCROLL
══════════════════════════════════════ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* Mobile toggle */
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

/* ══════════════════════════════════════
   COUNTER ANIMATION (HERO STATS)
══════════════════════════════════════ */
function animateCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); heroObserver.disconnect(); } });
}, { threshold: 0.4 });
heroObserver.observe(document.getElementById('hero-stats'));

/* ══════════════════════════════════════
   REVEAL ON SCROLL
══════════════════════════════════════ */
function addReveal(selector) {
  document.querySelectorAll(selector).forEach(el => el.classList.add('reveal'));
}
addReveal('.step-card, .feat-card, .section-header, .threshold-card');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ══════════════════════════════════════
   HERO PIPELINE CARD ANIMATION
══════════════════════════════════════ */
const pipelineSteps = document.querySelectorAll('.pipeline-step');
let pipelineIndex = 0;
setInterval(() => {
  pipelineSteps.forEach(s => s.classList.remove('active'));
  pipelineIndex = (pipelineIndex + 1) % pipelineSteps.length;
  pipelineSteps[pipelineIndex].classList.add('active');
}, 2200);

/* ══════════════════════════════════════
   CHAR COUNTERS
══════════════════════════════════════ */
function bindCharCounter(textareaId, counterId, max) {
  const ta = document.getElementById(textareaId);
  const ct = document.getElementById(counterId);
  if (!ta || !ct) return;
  ta.addEventListener('input', () => {
    const len = ta.value.length;
    ct.textContent = `${len} / ${max}`;
    ct.style.color = len > max * 0.9 ? 'var(--warning)' : '';
  });
}
bindCharCounter('jobDescription', 'jd-count', 2000);

/* ══════════════════════════════════════
   RESUME FILE UPLOAD ZONE
══════════════════════════════════════ */
(function initUploadZone() {
  const zone      = document.getElementById('upload-zone');
  const input     = document.getElementById('resumeFile');
  const idleEl    = document.getElementById('upload-idle');
  const previewEl = document.getElementById('upload-preview');
  const nameEl    = document.getElementById('preview-name');
  const sizeEl    = document.getElementById('preview-size');
  const iconEl    = document.getElementById('preview-icon');
  const removeBtn = document.getElementById('preview-remove');
  if (!zone) return;

  const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg'];
  const MAX_MB  = 10;

  function fileIcon(type) {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    return '📁';
  }

  function formatSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(1)} MB`;
  }

  function showFile(file) {
    if (!ALLOWED.includes(file.type)) {
      showUploadError('Only PDF, PNG, or JPEG files are accepted.');
      clearFile();
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showUploadError(`File must be under ${MAX_MB} MB.`);
      clearFile();
      return;
    }
    nameEl.textContent = file.name;
    sizeEl.textContent = formatSize(file.size);
    iconEl.textContent = fileIcon(file.type);
    idleEl.hidden    = true;
    previewEl.hidden = false;
    zone.classList.add('has-file');
    zone.classList.remove('error-zone');
    // Remove stale error
    const errEl = zone.parentElement.querySelector('.field-error');
    if (errEl) errEl.remove();
  }

  function clearFile() {
    input.value       = '';
    idleEl.hidden     = false;
    previewEl.hidden  = true;
    zone.classList.remove('has-file');
  }

  function showUploadError(msg) {
    let errEl = zone.parentElement.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error';
      zone.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
    zone.classList.add('error-zone');
  }

  // File input change
  input.addEventListener('change', () => {
    if (input.files[0]) showFile(input.files[0]);
  });

  // Remove button — must stop propagation so it doesn't re-open file dialog
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    clearFile();
  });

  // Drag events
  ['dragenter','dragover'].forEach(evt =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    })
  );
  ['dragleave','dragend'].forEach(evt =>
    zone.addEventListener(evt, () => zone.classList.remove('drag-over'))
  );
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      // Sync to the input element
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      showFile(file);
    }
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
})();

/* ══════════════════════════════════════
   MULTI-STEP FORM
══════════════════════════════════════ */
function goToStep(step) {
  if (!validateStep(currentStep)) return;

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  document.querySelectorAll('.progress-step').forEach((ps, i) => {
    ps.classList.remove('active', 'done');
    if (i + 1 < step) ps.classList.add('done');
    if (i + 1 === step) ps.classList.add('active');
  });

  document.querySelectorAll('.progress-line').forEach((pl, i) => {
    pl.classList.toggle('done', i + 1 < step);
  });

  if (step === 4) buildReviewSummary();
  currentStep = step;

  // Scroll to form top smoothly
  document.getElementById('evaluate').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.goToStep = goToStep;

function validateStep(step) {
  let valid = true;
  const required = {
    1: ['jobTitle', 'jobDescription'],
    2: ['candidateName', 'candidateEmail'],
    3: [],
    4: []
  };
  (required[step] || []).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add('error');
      el.addEventListener('input', () => el.classList.remove('error'), { once: true });
      valid = false;
    }
  });
  // Email validation
  if (step === 2) {
    const emailEl = document.getElementById('candidateEmail');
    if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      emailEl.classList.add('error');
      valid = false;
    }
    // Resume file validation
    const fileInput = document.getElementById('resumeFile');
    const zone = document.getElementById('upload-zone');
    if (fileInput && !fileInput.files[0]) {
      zone && zone.classList.add('error-zone');
      let errEl = zone && zone.parentElement.querySelector('.field-error');
      if (!errEl && zone) {
        errEl = document.createElement('span');
        errEl.className = 'field-error';
        zone.parentElement.appendChild(errEl);
      }
      if (errEl) errEl.textContent = 'Please upload a resume (PDF, PNG, or JPEG).';
      valid = false;
    }
  }
  return valid;
}

/* ══════════════════════════════════════
   ANSWER FIELDS
══════════════════════════════════════ */
function initAnswers() {
  const container = document.getElementById('answers-container');
  container.innerHTML = '';
  answerCount = 0;
  addAnswerField('ok');
  addAnswerField('not sure');
}

function addAnswerField(defaultVal = '') {
  answerCount++;
  const container = document.getElementById('answers-container');
  const div = document.createElement('div');
  div.className = 'answer-field';
  div.id = `answer-field-${answerCount}`;
  div.innerHTML = `
    <div class="answer-header">
      <span class="answer-label">Answer ${answerCount}</span>
      <button type="button" class="remove-answer" onclick="removeAnswer(${answerCount})" title="Remove">✕</button>
    </div>
    <textarea id="answer${answerCount}" name="answer${answerCount}" class="field-textarea"
      placeholder="Candidate's answer to question ${answerCount}…" rows="3">${defaultVal}</textarea>
  `;
  container.appendChild(div);

  // Update max questions input
  document.getElementById('maxQuestions').value = answerCount;
}
window.addAnswerField = addAnswerField;

function removeAnswer(n) {
  const el = document.getElementById(`answer-field-${n}`);
  if (el) el.remove();
}
window.removeAnswer = removeAnswer;

// Also update maxQuestions when answer fields change
document.getElementById('maxQuestions').addEventListener('change', (e) => {
  const desired = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
  e.target.value = desired;
});

initAnswers();

/* ══════════════════════════════════════
   SLIDERS
══════════════════════════════════════ */
function bindSlider(sliderId, valId, numId) {
  const slider = document.getElementById(sliderId);
  const valEl  = document.getElementById(valId);
  const numEl  = document.getElementById(numId);
  if (!slider) return;
  function update() {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--val', `${pct}%`);
    valEl.textContent = slider.value;
    numEl.value = slider.value;
    // Color
    valEl.style.color = slider.value >= 70 ? 'var(--success)' : slider.value >= 40 ? '#a78bfa' : 'var(--danger)';
  }
  slider.addEventListener('input', update);
  update();
}
bindSlider('minRank', 'rank-val', 'minRankNum');
bindSlider('minApproval', 'approval-val', 'minApprovalNum');

/* ══════════════════════════════════════
   REVIEW SUMMARY
══════════════════════════════════════ */
function buildReviewSummary() {
  const answers = [];
  document.querySelectorAll('[id^="answer"]').forEach(el => {
    if (el.tagName === 'TEXTAREA' && el.value.trim()) answers.push(el.value.trim());
  });

  const data = {
    'Job Title': val('jobTitle') || '—',
    'Candidate': val('candidateName') || '—',
    'Email': val('candidateEmail') || '—',
    'Candidate ID': val('candidateId') || 'Auto',
    'Answers': `${answers.length} provided`,
    'Max Questions': val('maxQuestions') || '2',
    'Min Rank': val('minRankNum') || '50',
    'Min Approval': val('minApprovalNum') || '60',
  };

  const grid = document.getElementById('review-grid');
  grid.innerHTML = Object.entries(data).map(([k, v]) => `
    <div class="review-item">
      <div class="review-key">${k}</div>
      <div class="review-val" title="${v}">${v}</div>
    </div>
  `).join('');
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* ══════════════════════════════════════
   FORM SUBMIT — AI EVALUATION SIMULATION
══════════════════════════════════════ */
document.getElementById('eval-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(4)) return;
  openModal();
  await runEvaluation();
});

function openModal() {
  const modal = document.getElementById('result-modal');
  modal.removeAttribute('hidden');
  document.getElementById('modal-loading').style.display = 'block';
  document.getElementById('modal-result').hidden = true;
  document.body.style.overflow = 'hidden';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('result-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function closeModal() {
  document.getElementById('result-modal').setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════
   EVALUATION LOGIC (Simulated AI)
══════════════════════════════════════ */
async function runEvaluation() {
  const stages = [
    { label: 'Analysing resume…', pct: 15 },
    { label: 'Matching skills to job description…', pct: 35 },
    { label: 'Scoring interview answers…', pct: 55 },
    { label: 'Calculating approval rating…', pct: 75 },
    { label: 'Generating shortlist recommendation…', pct: 90 },
    { label: 'Finalising report…', pct: 100 },
  ];
  const stagesEl = document.getElementById('loading-stages');
  const barEl    = document.getElementById('loading-bar');

  for (const s of stages) {
    stagesEl.textContent = s.label;
    barEl.style.width = `${s.pct}%`;
    await sleep(600 + Math.random() * 400);
  }

  await sleep(400);
  const result = computeResult();
  lastResult = result;
  showResult(result);
}

function computeResult() {
  const jd        = val('jobDescription').toLowerCase();
  const resume    = val('resumeText').toLowerCase();
  const minRank   = parseInt(val('minRankNum')) || 50;
  const minApproval = parseInt(val('minApprovalNum')) || 60;

  // Collect answers
  const answers = [];
  document.querySelectorAll('[id^="answer"]').forEach(el => {
    if (el.tagName === 'TEXTAREA') answers.push(el.value.trim().toLowerCase());
  });

  // Keyword extraction from JD
  const jdWords = jd.match(/\b[a-z]{3,}\b/g) || [];
  const keywords = [...new Set(jdWords)].filter(w =>
    !['and','the','for','with','our','are','you','that','this','have','from'].includes(w)
  ).slice(0, 20);

  // Resume match score
  let resumeMatches = keywords.filter(kw => resume.includes(kw)).length;
  let resumeScore = Math.min(100, Math.round((resumeMatches / Math.max(keywords.length, 1)) * 100 * 1.3));

  // Answer quality score (simple heuristic)
  const answerText = answers.join(' ');
  const answerWords = (answerText.match(/\b[a-z]{4,}\b/g) || []).length;
  const jdInAnswers = keywords.filter(kw => answerText.includes(kw)).length;
  let answerScore = Math.min(100, Math.round(
    (answerWords * 2 + jdInAnswers * 8) / Math.max(keywords.length, 1) * 10
  ));
  if (answerWords < 5) answerScore = Math.min(answerScore, 35);

  // Overall approval
  const approvalScore = Math.round((resumeScore * 0.6 + answerScore * 0.4));

  // Recommendation
  const passed = resumeScore >= minRank && approvalScore >= minApproval;

  // Simulated rank out of pool
  const rankPool = 10;
  const rankPos  = passed ? Math.ceil(Math.random() * 3) : Math.ceil(Math.random() * 5) + 5;

  return {
    candidateName: val('candidateName') || 'Unknown',
    candidateId:   val('candidateId') || `cand_${Date.now()}`,
    jobTitle:      val('jobTitle') || 'Role',
    resumeScore,
    answerScore,
    approvalScore,
    minRank,
    minApproval,
    passed,
    rankPos,
    rankPool,
    timestamp: new Date().toLocaleString(),
  };
}

function showResult(r) {
  document.getElementById('modal-loading').style.display = 'none';
  const resultEl = document.getElementById('modal-result');
  resultEl.hidden = false;

  // Header
  document.getElementById('result-header').innerHTML = `
    <div class="result-verdict ${r.passed ? 'pass' : 'fail'}">
      ${r.passed ? '✅ Shortlisted' : '❌ Not Shortlisted'}
    </div>
    <div class="result-name">${r.candidateName}</div>
    <div class="result-role">${r.jobTitle} · ID: ${r.candidateId}</div>
  `;

  // Scores
  const scoreColor = (n, min) => n >= min ? 'var(--success)' : n >= min * 0.75 ? 'var(--warning)' : 'var(--danger)';
  document.getElementById('result-scores').innerHTML = `
    <div class="score-card">
      <div class="score-num" style="color:${scoreColor(r.resumeScore,r.minRank)}">${r.resumeScore}</div>
      <div class="score-label">Resume Score</div>
    </div>
    <div class="score-card">
      <div class="score-num" style="color:${scoreColor(r.answerScore,40)}">${r.answerScore}</div>
      <div class="score-label">Interview Score</div>
    </div>
    <div class="score-card">
      <div class="score-num" style="color:${scoreColor(r.approvalScore,r.minApproval)}">${r.approvalScore}</div>
      <div class="score-label">Approval Score</div>
    </div>
  `;

  // Details
  document.getElementById('result-details').innerHTML = `
    <div class="detail-row">
      <span class="detail-key">Pool Rank</span>
      <span class="detail-val">#${r.rankPos} of ${r.rankPool} candidates</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Resume vs Min Rank (${r.minRank})</span>
      <span class="detail-val" style="color:${r.resumeScore >= r.minRank ? 'var(--success)' : 'var(--danger)'}">
        ${r.resumeScore} — ${r.resumeScore >= r.minRank ? 'PASS ✓' : 'FAIL ✗'}
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Approval vs Min (${r.minApproval})</span>
      <span class="detail-val" style="color:${r.approvalScore >= r.minApproval ? 'var(--success)' : 'var(--danger)'}">
        ${r.approvalScore} — ${r.approvalScore >= r.minApproval ? 'PASS ✓' : 'FAIL ✗'}
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Evaluated At</span>
      <span class="detail-val">${r.timestamp}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Next Step</span>
      <span class="detail-val">${r.passed ? '👥 Escalated to human reviewer' : '📧 Auto rejection email queued'}</span>
    </div>
  `;
}

/* ══════════════════════════════════════
   DOWNLOAD REPORT
══════════════════════════════════════ */
function downloadReport() {
  if (!lastResult) return;
  const r = lastResult;
  const content = `
TalentAI — Candidate Evaluation Report
========================================
Generated: ${r.timestamp}

CANDIDATE
  Name:         ${r.candidateName}
  ID:           ${r.candidateId}
  Job Title:    ${r.jobTitle}

SCORES
  Resume Score:    ${r.resumeScore} / 100  (Min: ${r.minRank})
  Interview Score: ${r.answerScore} / 100
  Approval Score:  ${r.approvalScore} / 100  (Min: ${r.minApproval})

RESULT
  Pool Rank:      #${r.rankPos} of ${r.rankPool}
  Decision:       ${r.passed ? 'SHORTLISTED ✅' : 'NOT SHORTLISTED ❌'}
  Next Step:      ${r.passed ? 'Escalated to human reviewer' : 'Auto rejection email queued'}

========================================
Powered by TalentAI — Autonomous Recruitment Agent
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `TalentAI_${r.candidateId}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
window.downloadReport = downloadReport;

/* ══════════════════════════════════════
   RESET FORM
══════════════════════════════════════ */
function resetForm() {
  closeModal();
  document.getElementById('eval-form').reset();
  // Reset upload zone
  const fileInput = document.getElementById('resumeFile');
  const zone      = document.getElementById('upload-zone');
  const idleEl    = document.getElementById('upload-idle');
  const previewEl = document.getElementById('upload-preview');
  if (fileInput) fileInput.value = '';
  if (idleEl)    idleEl.hidden = false;
  if (previewEl) previewEl.hidden = true;
  if (zone) {
    zone.classList.remove('has-file', 'error-zone');
    const errEl = zone.parentElement && zone.parentElement.querySelector('.field-error');
    if (errEl) errEl.remove();
  }
  initAnswers();
  bindSlider('minRank', 'rank-val', 'minRankNum');
  bindSlider('minApproval', 'approval-val', 'minApprovalNum');
  goToStep(1);
}
window.resetForm = resetForm;

/* ══════════════════════════════════════
   PIPELINE DEMO
══════════════════════════════════════ */
const demoCandidates = [
  { name: 'Priya Sharma', role: 'Data Eng', score: 88 },
  { name: 'Alex Chen',    role: 'Data Eng', score: 72 },
  { name: 'Maria Lopez',  role: 'Data Eng', score: 91 },
  { name: 'Sam Patel',    role: 'Data Eng', score: 45 },
  { name: 'Lin Wei',      role: 'Data Eng', score: 67 },
  { name: 'Jo Kim',       role: 'Data Eng', score: 55 },
];

function scoreClass(s) {
  return s >= 75 ? 'score-high' : s >= 55 ? 'score-mid' : 'score-low';
}

function makePCard(c, stage) {
  const div = document.createElement('div');
  div.className = 'pcol-card';
  const sub = { sourcing: 'Profile found', screening: 'Resume analysed', interview: 'AI interview done', shortlist: '🏆 Shortlisted' };
  div.innerHTML = `
    <div class="pcol-card-name">${c.name}</div>
    <div class="pcol-card-sub">${sub[stage]}</div>
    <div class="pcol-card-score ${scoreClass(c.score)}">${c.score}</div>
  `;
  return div;
}

function resetPipeline() {
  ['sourcing','screening','interview','shortlist'].forEach(col => {
    document.getElementById(`pcol-${col}-cards`).innerHTML = '';
    document.getElementById(`pcol-${col}-count`).textContent = '0';
  });
}
window.resetPipeline = resetPipeline;

async function runPipelineDemo() {
  resetPipeline();
  const btn = document.getElementById('demo-btn');
  btn.disabled = true; btn.textContent = '⏳ Running…';

  const stages = ['sourcing','screening','interview','shortlist'];

  for (const c of demoCandidates) {
    for (const stage of stages) {
      await sleep(650);
      // Remove from previous stage
      const prevIdx = stages.indexOf(stage) - 1;
      if (prevIdx >= 0) {
        const prevCards = document.getElementById(`pcol-${stages[prevIdx]}-cards`);
        const prevCard = [...prevCards.children].find(ch => ch.querySelector('.pcol-card-name')?.textContent === c.name);
        if (prevCard) prevCard.remove();
        updateCount(stages[prevIdx]);
      }

      // Skip low-score at shortlist stage
      if (stage === 'shortlist' && c.score < 60) continue;

      const col = document.getElementById(`pcol-${stage}-cards`);
      col.appendChild(makePCard(c, stage));
      updateCount(stage);
    }
    await sleep(300);
  }

  btn.disabled = false; btn.textContent = '▶ Run Demo Pipeline';
}
window.runPipelineDemo = runPipelineDemo;

function updateCount(stage) {
  const count = document.getElementById(`pcol-${stage}-cards`).children.length;
  document.getElementById(`pcol-${stage}-count`).textContent = count;
}

/* ══════════════════════════════════════
   UTILS
══════════════════════════════════════ */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
// Run demo pipeline automatically after a short delay
setTimeout(() => runPipelineDemo(), 2000);
