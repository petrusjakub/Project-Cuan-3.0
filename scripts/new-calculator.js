// === CALCULATOR STATE ===
var mdlaState = { plan: 'A', gender: 'Pria', term: '20', mpp: '5' };

// UP index to label mapping
var UP_LABELS = ['1M', '1.5M', '2M', '2.5M', '3M', '3.5M', '4M', '5M', '7.5M', '10M', '50M'];

// Available terms per plan
var PLAN_TERMS = {
  'A': ['20', '30'],
  'B': ['20', '30', '40', '50', '60'],
  'C': ['20', '30', '40', '50', '60', '70', '80', '90']
};

function selectMdla(groupId, value, el) {
  if (groupId === 'mdlaPlan') {
    mdlaState.plan = value;
    updateTermOptions();
  } else if (groupId === 'mdlaGender') {
    mdlaState.gender = value;
  } else if (groupId === 'mdlaTerm') {
    mdlaState.term = value;
  } else if (groupId === 'mdlaMpp') {
    mdlaState.mpp = value;
  }

  // Update UI active states
  var group = document.getElementById(groupId);
  var options = group.querySelectorAll('.calc-option');
  options.forEach(function(opt) { opt.classList.remove('active'); });
  el.classList.add('active');

  calcMdla();
}

function updateTermOptions() {
  var termGroup = document.getElementById('mdlaTerm');
  var plan = mdlaState.plan;
  var terms = PLAN_TERMS[plan] || ['20', '30'];

  var html = '';
  terms.forEach(function(t) {
    var active = (t === mdlaState.term) ? ' active' : '';
    html += '<div class="calc-option' + active + '" onclick="selectMdla(\'mdlaTerm\',\'' + t + '\',this)">' + t + ' Tahun</div>';
  });
  termGroup.innerHTML = html;

  // If current term is not available for this plan, reset to 20
  if (terms.indexOf(mdlaState.term) === -1) {
    mdlaState.term = '20';
    var opts = termGroup.querySelectorAll('.calc-option');
    if (opts.length > 0) opts[0].classList.add('active');
  }
}

function formatRp(num) {
  return 'Rp\u00A0' + num.toLocaleString('id-ID');
}

function calcMdla() {
  var gender = mdlaState.gender;
  var age = document.getElementById('mdlaAge').value;
  var plan = mdlaState.plan;
  var term = mdlaState.term;
  var mpp = mdlaState.mpp;
  var upIdx = parseInt(document.getElementById('mdlaUp').value);
  var upLabel = UP_LABELS[upIdx];

  var result = null;
  try {
    var key = gender + '|' + age + '|' + plan + '|' + term + '|' + mpp;
    var entry = MDLA_PREMI_DATA[key];
    if (entry && upLabel) {
      result = entry[upLabel];
    }
  } catch(e) {
    result = null;
  }

  var annualEl = document.getElementById('mdlaAnnual');
  var semesterEl = document.getElementById('mdlaSemester');
  var quarterEl = document.getElementById('mdlaQuarter');
  var monthlyEl = document.getElementById('mdlaMonthly');

  if (!result || result === '-') {
    annualEl.textContent = 'Kombinasi tidak tersedia';
    annualEl.style.color = 'var(--txt-muted)';
    semesterEl.textContent = '-';
    quarterEl.textContent = '-';
    monthlyEl.textContent = '-';
    var noteEl = document.getElementById('mdlaNote');
    if (noteEl) noteEl.textContent = 'Usia + Masa Pertanggungan melebihi batas yang tersedia untuk kombinasi ini.';
  } else {
    var annual = parseFloat(result.replace(/,/g, '')) * 1000000;
    annualEl.textContent = formatRp(annual);
    annualEl.style.color = '';
    semesterEl.textContent = formatRp(Math.round(annual * 0.525));
    quarterEl.textContent = formatRp(Math.round(annual * 0.275));
    monthlyEl.textContent = formatRp(Math.round(annual * 0.095));
    var noteEl = document.getElementById('mdlaNote');
    if (noteEl) noteEl.textContent = '';
  }
}

// Initialize
updateTermOptions();
calcMdla();
