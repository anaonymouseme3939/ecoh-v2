/**
 * e COH v2.0 Application Controller
 * Handles Auth, Carbon Calculator, Eco-Quiz, Crafticles Hub, Direct In-App Photo Submissions, Badges & Admin Portal
 */

let currentUser = null;
let currentCraftProof = { id: null, points: 0, title: '' };
let selectedProofImageData = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  try {
    const sessionUser = ecohDb.getSession();
    if (sessionUser) {
      currentUser = sessionUser;
      updateUserHeader();
      showView('view-dashboard');
    } else {
      showView('view-role');
    }

    setupAuthForm();
    setupAdminPortal();
    setupCarbonCalculator();
  } catch (e) {
    console.error("App Initialization Error:", e);
    showView('view-role');
  }
}

// Global View Switcher
function showView(viewId) {
  try {
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    // View-specific renders
    if (viewId === 'view-dashboard') {
      updateDashboard();
    } else if (viewId === 'view-crafticles') {
      renderCrafticles();
    } else if (viewId === 'view-quiz') {
      renderQuiz();
    } else if (viewId === 'view-achievements') {
      renderAchievements();
    } else if (viewId === 'view-admin') {
      renderAdminView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error("Error switching view:", e);
  }
}

// User Header Update
function updateUserHeader() {
  const ptsDisplays = document.querySelectorAll('.user-pts-display');
  const pts = currentUser ? (currentUser.treePoints || 0) : 0;
  ptsDisplays.forEach(el => el.textContent = `${pts} pts`);

  const nameDisplays = document.querySelectorAll('.user-name-display');
  const name = currentUser ? currentUser.fullName : 'Eco User';
  nameDisplays.forEach(el => el.textContent = name);
}

// User Authentication Form
function setupAuthForm() {
  const form = document.getElementById('auth-form');
  const errEl = document.getElementById('auth-error');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');

    const fullName = document.getElementById('auth-fullname').value.trim();
    const mobile = document.getElementById('auth-mobile').value.trim();
    const email = document.getElementById('auth-email').value.trim();

    // Input Validation
    if (!fullName) {
      showAuthError("Please enter your full name.");
      return;
    }

    // 10-digit mobile number check
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      showAuthError("Mobile Number must be exactly 10 numeric digits.");
      return;
    }

    // RFC 5322 standard email check
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!emailRegex.test(email)) {
      showAuthError("Please enter a valid email address.");
      return;
    }

    // Process user session
    const existingUsers = ecohDb.getUsers();
    let user = existingUsers.find(u => u.mobile === mobile || u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        uid: "usr-" + Date.now(),
        fullName: fullName,
        mobile: mobile,
        email: email,
        treePoints: 0,
        unlockedCertificates: []
      };
      ecohDb.saveUser(user);
    } else {
      user.fullName = fullName;
      ecohDb.saveUser(user);
    }

    currentUser = user;
    ecohDb.setSession(user);
    updateUserHeader();
    showView('view-dashboard');
  });
}

function showAuthError(msg) {
  const errEl = document.getElementById('auth-error');
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }
}

function logoutUser() {
  currentUser = null;
  ecohDb.clearSession();
  updateUserHeader();
  showView('view-role');
}

// Dashboard Update
function updateDashboard() {
  updateUserHeader();
}

// Carbon Calculator
function setupCarbonCalculator() {
  const form = document.getElementById('calc-form');
  const resultsDiv = document.getElementById('calc-results');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const commuteKm = parseFloat(document.getElementById('calc-commute').value) || 0;
      const vehicleType = document.getElementById('calc-vehicle').value;
      const kwh = parseFloat(document.getElementById('calc-kwh').value) || 0;
      const diet = document.querySelector('input[name="calc-diet"]:checked')?.value || 'vegetarian';
      const trees = parseInt(document.getElementById('calc-trees').value) || 0;

      // Metric calculations
      let vehicleFactor = 0;
      switch (vehicleType) {
        case 'public': vehicleFactor = 0.05; break;
        case 'ev': vehicleFactor = 0.04; break;
        case 'hybrid': vehicleFactor = 0.09; break;
        case 'gas_small': vehicleFactor = 0.15; break;
        case 'gas_large': vehicleFactor = 0.25; break;
        default: vehicleFactor = 0; // bike/walk
      }

      const commuteEmission = commuteKm * vehicleFactor;
      const energyEmission = (kwh * 0.82) / 30; // daily kWh emission

      let dietFactor = 1.7;
      switch (diet) {
        case 'vegan': dietFactor = 1.0; break;
        case 'pescatarian': dietFactor = 1.5; break;
        case 'omnivore': dietFactor = 2.5; break;
        default: dietFactor = 1.7; // vegetarian
      }

      const treeOffset = trees * 0.06; // daily offset per tree
      let totalDaily = (commuteEmission + energyEmission + dietFactor) - treeOffset;
      if (totalDaily < 0) totalDaily = 0.2;

      document.getElementById('calc-result-text').textContent = `${totalDaily.toFixed(2)} kg CO2e / day`;
      document.getElementById('calc-result-sub').textContent = totalDaily < 3.5 
        ? "Excellent! Your daily carbon footprint is significantly below average."
        : "Moderate footprint. Complete Crafticles & Eco-Quizzes on e COH to offset your emissions!";

      resultsDiv.classList.remove('hidden');

      // Award 5 points for performing calculation
      awardTreePoints(5);
    } catch (err) {
      console.error("Calculator Error:", err);
    }
  });
}

// Eco-Quiz Hub
const QUIZ_QUESTIONS = [
  {
    q: "Which daily habit saves the highest volume of household water?",
    options: ["Rinsing dishes with tap running", "Installing low-flow aerators", "Washing car with hose", "Taking longer showers"],
    ans: 1
  },
  {
    q: "What is the primary objective of the Circular Economy?",
    options: ["Maximize landfill usage", "Eliminate waste & continuously reuse resources", "Increase plastic bottle production", "Burn municipal solid waste"],
    ans: 1
  },
  {
    q: "How many tons of CO2 does an average residential solar array offset annually?",
    options: ["0.5 Tons", "1.2 Tons", "4.0 Tons", "10.0 Tons"],
    ans: 2
  }
];

let currentQuizIdx = 0;

function renderQuiz() {
  const container = document.getElementById('quiz-card-container');
  if (!container) return;

  const q = QUIZ_QUESTIONS[currentQuizIdx];
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b border-white/20 pb-3">
        <span class="text-xs font-bold text-primary uppercase">Question ${currentQuizIdx + 1} of ${QUIZ_QUESTIONS.length}</span>
        <span class="text-xs font-semibold text-on-surface-variant">+10 Tree Pts</span>
      </div>
      <h3 class="font-bold text-primary text-base md:text-lg">${q.q}</h3>
      <div class="space-y-2">
        ${q.options.map((opt, i) => `
          <button onclick="handleQuizAnswer(${i})" class="w-full text-left glass-input rounded-xl p-3 text-xs md:text-sm font-semibold text-on-surface hover:bg-white/60 transition-colors flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function handleQuizAnswer(selectedIdx) {
  const q = QUIZ_QUESTIONS[currentQuizIdx];
  const config = ecohDb.getConfig();
  const reward = config.quizPoints || 10;

  if (selectedIdx === q.ans) {
    awardTreePoints(reward);
    alert(`Correct Answer! You earned +${reward} Tree Points on e COH.`);
  } else {
    alert("Incorrect option. Try the next question to learn more!");
  }

  currentQuizIdx = (currentQuizIdx + 1) % QUIZ_QUESTIONS.length;
  renderQuiz();
}

// Crafticles Hub
function renderCrafticles() {
  const grid = document.getElementById('crafticles-grid');
  if (!grid) return;

  const crafticles = ecohDb.getCrafticles();
  grid.innerHTML = crafticles.map(c => `
    <div class="glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="material-symbols-outlined text-primary text-3xl">${c.icon || 'eco'}</span>
          <span class="bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+${c.points} pts</span>
        </div>
        <h3 class="font-bold text-primary text-base">${c.title}</h3>
        <p class="text-xs text-on-surface-variant line-clamp-2">${c.description}</p>
      </div>

      <div class="space-y-2 pt-2 border-t border-white/20">
        <details class="text-xs text-on-surface-variant cursor-pointer">
          <summary class="font-semibold text-primary mb-1">View Step-by-Step DIY Procedure</summary>
          <p class="whitespace-pre-line text-[11px] leading-relaxed bg-white/40 p-2 rounded-xl border border-white/30 mt-1">${c.procedure}</p>
        </details>
        
        <button onclick="triggerProofModal('${c.id}', ${c.points}, '${escapeHtml(c.title)}')" class="glossy-btn w-full py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
          <span class="material-symbols-outlined text-sm">add_a_photo</span>
          <span>Mark as Completed</span>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Crafticle Proof Upload Modal Flow
function triggerProofModal(craftId, points, title) {
  if (!currentUser) {
    alert("Please log in to complete crafticles and earn Tree Points.");
    showView('view-auth');
    return;
  }

  currentCraftProof = { id: craftId, points: points, title: title };
  selectedProofImageData = null;

  // Set Modal Header & Auto-generated File Name
  document.getElementById('proof-craft-title').textContent = title;

  // File Name format: <User Full Name> - <Crafticle Title>
  const requiredFileName = `${currentUser.fullName} - ${title}`;
  document.getElementById('proof-file-name-preview').textContent = requiredFileName;

  // Reset inputs
  const fileInput = document.getElementById('proof-image-input');
  if (fileInput) fileInput.value = '';

  const previewBox = document.getElementById('proof-image-preview-box');
  if (previewBox) previewBox.classList.add('hidden');

  const errEl = document.getElementById('proof-modal-error');
  if (errEl) errEl.classList.add('hidden');

  // Display Modal with Smooth Scale Animation
  const modal = document.getElementById('prank-modal');
  const content = document.getElementById('prank-modal-content');
  if (modal && content) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 20);
  }
}

function handleProofImageSelected(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      selectedProofImageData = e.target.result;
      const previewBox = document.getElementById('proof-image-preview-box');
      const previewImg = document.getElementById('proof-image-preview-img');
      if (previewBox && previewImg) {
        previewImg.src = selectedProofImageData;
        previewBox.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
}

// Direct In-App Photo Proof Submission (Zero External Popup, 100% Private to Admin)
function submitCrafticleProofDirectInApp() {
  try {
    const errEl = document.getElementById('proof-modal-error');
    if (errEl) errEl.classList.add('hidden');

    if (!selectedProofImageData) {
      const fileInput = document.getElementById('proof-image-input');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        if (errEl) {
          errEl.textContent = "Please capture or select a photo of your completed project first.";
          errEl.classList.remove('hidden');
        }
        return;
      }
    }

    const formattedFileName = `${currentUser.fullName} - ${currentCraftProof.title}`;

    // Record submission proof with direct in-app photo repository
    ecohDb.recordSubmission({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      userContact: `${currentUser.mobile} • ${currentUser.email}`,
      craftId: currentCraftProof.id,
      craftTitle: currentCraftProof.title,
      fileName: formattedFileName,
      points: currentCraftProof.points,
      imageData: selectedProofImageData,
      mode: 'direct_in_app'
    });

    // Award Tree Points to user
    awardTreePoints(currentCraftProof.points);

    alert(`Success! Direct photo proof for "${formattedFileName}" has been submitted in-app and +${currentCraftProof.points} Tree Points awarded to your account.`);

    closeProofModal();
  } catch (err) {
    console.error("Error submitting direct in-app proof:", err);
    closeProofModal();
  }
}

function closeProofModal() {
  const modal = document.getElementById('prank-modal');
  const content = document.getElementById('prank-modal-content');
  if (modal && content) {
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }, 200);
  }
}

// Tree Points & Dynamic Rewards Engine
function awardTreePoints(pts) {
  if (!currentUser) return;
  currentUser.treePoints = (currentUser.treePoints || 0) + pts;
  ecohDb.saveUser(currentUser);
  ecohDb.setSession(currentUser);
  updateUserHeader();
}

// Achievements & Badges Hub
function renderAchievements() {
  if (!currentUser) {
    document.getElementById('achieve-user-name').textContent = "Guest User";
    document.getElementById('achieve-user-mobile').textContent = "No Mobile Logged";
    document.getElementById('achieve-user-email').textContent = "No Email Logged";
    document.getElementById('achieve-user-pts').textContent = "0";
    return;
  }

  document.getElementById('achieve-user-name').textContent = currentUser.fullName;
  document.getElementById('achieve-user-mobile').textContent = currentUser.mobile;
  document.getElementById('achieve-user-email').textContent = currentUser.email;
  document.getElementById('achieve-user-pts').textContent = currentUser.treePoints || 0;

  const config = ecohDb.getConfig();
  const pts = currentUser.treePoints || 0;

  // Level thresholds
  updateBadgeState('badge-bronze', pts >= (config.level1Req || 50));
  updateBadgeState('badge-silver', pts >= (config.level2Req || 150));
  updateBadgeState('badge-gold', pts >= (config.level3Req || 300));

  // Render Certificates
  renderCertificates();
}

function updateBadgeState(elementId, isUnlocked) {
  const badgeEl = document.getElementById(elementId);
  if (!badgeEl) return;

  const lockIcon = badgeEl.querySelector('.lock-icon');
  if (isUnlocked) {
    badgeEl.classList.remove('opacity-60', 'grayscale');
    if (lockIcon) lockIcon.style.display = 'none';
  } else {
    badgeEl.classList.add('opacity-60', 'grayscale');
    if (lockIcon) lockIcon.style.display = 'block';
  }
}

function renderCertificates() {
  const list = document.getElementById('certificates-list');
  if (!list) return;

  const certs = currentUser ? (currentUser.unlockedCertificates || []) : [];

  if (certs.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 space-y-2">
        <span class="material-symbols-outlined text-outline text-4xl">workspace_premium</span>
        <p class="text-xs font-semibold text-on-surface-variant">No certificates uploaded yet.</p>
        <p class="text-[11px] text-on-surface-variant/80">Earn points and level up to receive custom certificates from the Administrator.</p>
      </div>
    `;
  } else {
    list.innerHTML = certs.map(c => `
      <div class="glass-panel p-4 rounded-xl flex justify-between items-center">
        <div>
          <h4 class="font-bold text-primary text-sm">${c.title}</h4>
          <p class="text-[10px] text-on-surface-variant">Assigned on ${new Date(c.date).toLocaleDateString()}</p>
        </div>
        <a href="${c.url}" target="_blank" download class="glossy-btn px-3 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">download</span>
          <span>Download</span>
        </a>
      </div>
    `).join('');
  }
}

// Administrator Portal
function setupAdminPortal() {
  const loginForm = document.getElementById('admin-login-form');
  const errEl = document.getElementById('admin-error');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');

    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value.trim();

    // Admin Auth: ecoh / ecoh@2026
    if (u === 'ecoh' && p === 'ecoh@2026') {
      document.getElementById('admin-overlay').classList.add('hidden');
      document.getElementById('admin-content').classList.remove('hidden');
      renderAdminView();
    } else {
      errEl.textContent = "Invalid Administrator credentials.";
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('admin-overlay').classList.remove('hidden');
  });

  document.getElementById('admin-save-config-btn')?.addEventListener('click', saveAdminConfig);
  document.getElementById('admin-save-craft-btn')?.addEventListener('click', saveAdminCrafticle);
}

function renderAdminView() {
  renderAdminUsers();
  renderAdminSubmissions();
  renderAdminConfig();
  renderAdminCrafticleEditor();
}

function renderAdminUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  const users = ecohDb.getUsers();
  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-on-surface-variant">No user scores logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr class="border-b border-white/20 hover:bg-white/30">
      <td class="py-2 px-2 font-mono text-[10px]">${u.uid}</td>
      <td class="py-2 px-2 font-semibold text-primary">${u.fullName}</td>
      <td class="py-2 px-2 text-on-surface-variant">${u.mobile}<br/>${u.email}</td>
      <td class="py-2 px-2 font-bold text-primary">${u.treePoints || 0} pts</td>
      <td class="py-2 px-2 text-right">
        <button onclick="promptAssignCertificate('${u.uid}')" class="glossy-btn px-2 py-1 rounded-lg text-white text-[10px] font-semibold">
          Assign Cert
        </button>
      </td>
    </tr>
  `).join('');
}

// Render Admin Submissions Gallery
function renderAdminSubmissions() {
  const container = document.getElementById('admin-submissions-list');
  const countBadge = document.getElementById('admin-submissions-count');
  if (!container) return;

  const subs = ecohDb.getSubmissions();
  if (countBadge) countBadge.textContent = `${subs.length} Submissions`;

  if (subs.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-xs text-on-surface-variant">
        No project proof photos submitted yet.
      </div>
    `;
    return;
  }

  container.innerHTML = subs.map(s => `
    <div class="glass-panel p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div class="flex items-center gap-3">
        ${s.imageData ? `
          <img src="${s.imageData}" alt="Proof" class="w-14 h-14 rounded-lg object-cover border border-white/60 shadow-sm cursor-pointer" onclick="viewFullImage('${s.id}')"/>
        ` : `
          <div class="w-14 h-14 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
            <span class="material-symbols-outlined">description</span>
          </div>
        `}
        <div>
          <h4 class="font-bold text-primary text-xs">${s.fileName}</h4>
          <p class="text-[10px] text-on-surface-variant">User: <strong>${s.userName}</strong> (${s.userContact || 'Contact Logged'})</p>
          <p class="text-[10px] text-on-surface-variant">Submitted: ${new Date(s.timestamp).toLocaleString()} • Mode: <span class="font-bold uppercase text-primary">${s.mode || 'direct_in_app'}</span> (+${s.points} pts)</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${s.imageData ? `
          <a href="${s.imageData}" download="${s.fileName}.png" class="glossy-btn px-2.5 py-1 rounded-lg text-white text-[10px] font-semibold flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">download</span> Download
          </a>
        ` : ''}
        <button onclick="deleteSubmissionRecord('${s.id}')" class="text-error hover:bg-error/10 p-1 rounded-lg" title="Delete Record">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

function viewFullImage(subId) {
  const subs = ecohDb.getSubmissions();
  const sub = subs.find(s => s.id === subId);
  if (sub && sub.imageData) {
    const w = window.open("");
    w.document.write(`<title>${sub.fileName}</title><img src="${sub.imageData}" style="max-width:100%; height:auto;"/>`);
  }
}

function deleteSubmissionRecord(subId) {
  if (confirm("Are you sure you want to remove this submission record?")) {
    ecohDb.deleteSubmission(subId);
    renderAdminSubmissions();
  }
}

function promptAssignCertificate(uid) {
  const certUrl = prompt("Enter Certificate Drive / Download Link URL:");
  if (certUrl && certUrl.trim()) {
    const certTitle = prompt("Enter Certificate Title:", "Sustainability Excellence Award") || "Sustainability Excellence Award";
    const user = ecohDb.getUser(uid);
    if (user) {
      if (!user.unlockedCertificates) user.unlockedCertificates = [];
      user.unlockedCertificates.push({
        title: certTitle,
        url: certUrl.trim(),
        date: new Date().toISOString()
      });
      ecohDb.saveUser(user);
      alert(`Certificate assigned to ${user.fullName}.`);
      renderAdminUsers();
    }
  }
}

function renderAdminConfig() {
  const config = ecohDb.getConfig();
  document.getElementById('admin-config-quiz').value = config.quizPoints || 10;
  document.getElementById('admin-config-craft').value = config.crafticlePoints || 20;
  const driveUrlInput = document.getElementById('admin-config-drive-url');
  if (driveUrlInput) driveUrlInput.value = config.driveFolderUrl || 'https://drive.google.com';
  document.getElementById('admin-config-l1').value = config.level1Req || 50;
  document.getElementById('admin-config-l2').value = config.level2Req || 150;
  document.getElementById('admin-config-l3').value = config.level3Req || 300;
}

function saveAdminConfig() {
  const quiz = parseInt(document.getElementById('admin-config-quiz').value) || 10;
  const craft = parseInt(document.getElementById('admin-config-craft').value) || 20;
  const driveUrlInput = document.getElementById('admin-config-drive-url');
  const driveUrl = driveUrlInput ? (driveUrlInput.value.trim() || 'https://drive.google.com') : 'https://drive.google.com';
  const l1 = parseInt(document.getElementById('admin-config-l1').value) || 50;
  const l2 = parseInt(document.getElementById('admin-config-l2').value) || 150;
  const l3 = parseInt(document.getElementById('admin-config-l3').value) || 300;

  ecohDb.saveConfig({
    quizPoints: quiz,
    crafticlePoints: craft,
    driveFolderUrl: driveUrl,
    level1Req: l1,
    level2Req: l2,
    level3Req: l3
  });

  alert("Global configuration updated successfully.");
}

function renderAdminCrafticleEditor() {
  const select = document.getElementById('admin-crafticle-select');
  if (!select) return;

  const crafticles = ecohDb.getCrafticles();
  select.innerHTML = crafticles.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

  select.onchange = () => {
    const item = crafticles.find(c => c.id === select.value);
    if (item) {
      document.getElementById('admin-craft-title').value = item.title;
      document.getElementById('admin-craft-desc').value = item.description;
      document.getElementById('admin-craft-proc').value = item.procedure;
      document.getElementById('admin-craft-pts').value = item.points;
    }
  };

  if (crafticles.length > 0) {
    select.onchange();
  }
}

function saveAdminCrafticle() {
  const select = document.getElementById('admin-crafticle-select');
  const errEl = document.getElementById('admin-craft-error');
  errEl.classList.add('hidden');

  const title = document.getElementById('admin-craft-title').value.trim();
  const desc = document.getElementById('admin-craft-desc').value.trim();
  const proc = document.getElementById('admin-craft-proc').value.trim();
  const pts = parseInt(document.getElementById('admin-craft-pts').value) || 20;

  // Strict word count enforcement
  const descWords = desc.split(/\s+/).filter(Boolean).length;
  if (descWords > 200) {
    errEl.textContent = `Description exceeds max 200 words (Current: ${descWords} words).`;
    errEl.classList.remove('hidden');
    return;
  }

  const procWords = proc.split(/\s+/).filter(Boolean).length;
  if (procWords > 1000) {
    errEl.textContent = `Procedure exceeds max 1000 words (Current: ${procWords} words).`;
    errEl.classList.remove('hidden');
    return;
  }

  ecohDb.saveCrafticle({
    id: select.value,
    title: title,
    description: desc,
    procedure: proc,
    points: pts
  });

  alert("Crafticle item updated successfully.");
  renderAdminCrafticleEditor();
}
