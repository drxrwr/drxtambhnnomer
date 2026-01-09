let originalFileName = '';
let groups = [];

document.getElementById('vcfFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  originalFileName = file.name;
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

function normalizeNumber(num) {
  num = num.replace(/\D/g, '');

  if (num.length < 10) return null;

  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) return null;

  return '+' + num;
}

function downloadVCF() {
  const groupEls = document.querySelectorAll('.group');
  let output = [];

  groupEls.forEach((el, index) => {
    const nameInput = el.querySelector('input').value.trim();
    const textarea = el.querySelector('textarea').value.split('\n');

    let count = groups[index].contacts.length;

    // kontak asli
    groups[index].contacts.forEach((c, i) => {
      output.push(vcard(`${nameInput} ${i + 1}`, c.tel));
    });

    // tambahan
    textarea.forEach(line => {
      const normalized = normalizeNumber(line.trim());
      if (!normalized) return;

      count++;
      output.push(vcard(`${nameInput} ${count}`, normalized));
    });
  });

  downloadFile(output.join('\n'), originalFileName);
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
