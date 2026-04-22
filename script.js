let originalFileName = '';
let groups = [];

document.getElementById('vcfFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  originalFileName = file.name.replace('.vcf', '');

  // tampilkan input nama file
  document.getElementById('fileNameInput').value = originalFileName;
  document.getElementById('fileNameBox').classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = () => parseVCF(reader.result);
  reader.readAsText(file);
});

function parseVCF(text) {
  groups = [];
  const map = {};

  text.split('BEGIN:VCARD').forEach(b => {
    const name = b.match(/FN:(.+)/)?.[1]?.trim();
    const tel = b.match(/TEL[^:]*:(.+)/)?.[1]?.trim();
    if (!name || !tel) return;

    const base = name.replace(/\s\d+$/, '');
    if (!map[base]) map[base] = [];
    map[base].push({ tel });
  });

  const container = document.getElementById('groupsContainer');
  container.innerHTML = '';

  Object.keys(map).forEach(base => {
    groups.push({
      originalBase: base,
      newBase: base,
      contacts: map[base]
    });

    container.innerHTML += `
      <div class="group">
        <label>Nama Grup</label>
        <input type="text" value="${base}" data-base="${base}">
        <textarea placeholder="Tambahan nomor (1 baris 1 nomor)"></textarea>
      </div>
    `;
  });

  document.getElementById('panel').classList.remove('hidden');
}

// SUPPORT SEMUA NEGARA
function normalizeNumber(num) {
  num = num.trim();

  if (num.startsWith('+')) {
    const clean = num.replace(/\D/g, '');
    if (clean.length < 10) return null;
    return '+' + clean;
  }

  num = num.replace(/\D/g, '');
  if (num.length < 10) return null;

  if (num.startsWith('0')) {
    num = '62' + num.slice(1);
  }

  return '+' + num;
}

function downloadVCF() {
  const groupEls = document.querySelectorAll('.group');
  let output = [];

  groupEls.forEach((el, index) => {
    const nameInput = el.querySelector('input').value.trim();
    const textarea = el.querySelector('textarea').value.split('\n');

    // hitung total valid
    const tambahanValid = textarea.filter(x => normalizeNumber(x));
    let total = groups[index].contacts.length + tambahanValid.length;

    // tentukan digit (01 / 001)
    let digit = 1;
    if (total >= 10 && total < 100) digit = 2;
    if (total >= 100) digit = 3;

    let count = 0;

    // kontak asli
    groups[index].contacts.forEach((c) => {
      count++;
      let nomor = String(count).padStart(digit, '0');
      output.push(vcard(`${nameInput} ${nomor}`, c.tel));
    });

    // tambahan
    textarea.forEach(line => {
      const normalized = normalizeNumber(line.trim());
      if (!normalized) return;

      count++;
      let nomor = String(count).padStart(digit, '0');
      output.push(vcard(`${nameInput} ${nomor}`, normalized));
    });
  });

  // ambil nama file dari input
  let fileName = document.getElementById('fileNameInput').value.trim();
  if (!fileName) fileName = originalFileName;

  downloadFile(output.join('\n'), fileName + '.vcf');
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
