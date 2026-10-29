export function money(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) return 'Price on request';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function orderStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `RKS-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function orderStatusMeta(status) {
  const label = String(status || 'Pending');
  const key = label.toLowerCase().replace(/\s+/g, '-');
  return { key, label };
}
