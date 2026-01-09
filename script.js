let originalFileName = '';
let contacts = [];
let groups = {};

document.getElementById('vcfFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  originalFileName = file.name;

  const reader = new FileReader();
  reader.onload = () => parseVCF(reader.result);
  reader.readAsText(file);
});

function parseVCF(text) {
  contacts = [];
  groups = {};

  const blocks = text.split('BEGIN:VCARD');
  blocks.forEach(b => {
    if (!b.includes('FN:')) return;
    const name = b.match(/FN:(.+)/)?.[1].trim();
    const tel = b.match(/TEL[^:]*:(.+)/)?.[1].trim();
    if (!name || !tel) return;

    const base = name.replace(/\s\d+$/, '');
    if (!groups[base]) groups[base] = [];
    groups[base].push({ name, tel });
    contacts.push({ name, tel, base });
  });

  const bases = Object.keys(groups);
  if (bases.length < 2) {
    alert('Minimal harus ada 2 grup');
    return;
  }

  document.getElementById('group1Name').value = bases[0];
  document.getElementById('group2Name').value = bases[1];
  document.getElementById('panel').classList.remove('hidden');
}

function downloadVCF() {
  const g1 = document.getElementById('group1Name').value.trim();
  const g2 = document.getElementById('group2Name').value.trim();

  const add1 = getLines('group1Add');
  const add2 = getLines('group2Add');

  let output = [];
  let counters = {};

  [...contacts, ...addContacts(g1, add1), ...addContacts(g2, add2)].forEach(c => {
    counters[c.base] = (counters[c.base] || 0) + 1;
    output.push(vcard(`${c.base} ${counters[c.base]}`, c.tel));
  });

  downloadFile(output.join('\n'), originalFileName);
}

function addContacts(base, numbers) {
  return numbers.map(n => ({ base, tel: n }));
}

function getLines(id) {
  return document.getElementById(id).value
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean);
}

function vcard(name, tel) {
  return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${tel}
END:VCARD`;
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
