function xml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value, type) {
  if (type === 'Number' && value !== '' && value != null && !Number.isNaN(Number(value))) {
    return `<Cell><Data ss:Type="Number">${Number(value)}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`;
}

export function downloadOrdersExcel(orders) {
  const header = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Note', 'Items', 'Subtotal', 'Status'];
  const rows = orders.map((order) => {
    const items = (order.items || [])
      .map((item) => `${item.name} x ${item.qty}`.trim())
      .join('; ');
    return [
      order.id || order.order_number,
      order.date ? new Date(order.date).toLocaleString('en-IN') : '',
      order.name || order.customer_name,
      order.phone || order.mobile,
      order.address,
      order.note || '',
      items,
      order.total ?? order.total_amount ?? '',
      order.status || order.order_status || 'Pending',
    ];
  });

  const table = [header, ...rows].map((row) => `<Row>${row.map((value, i) => cell(value, i === 7 ? 'Number' : 'String')).join('')}</Row>`).join('');
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Orders"><Table>${table}</Table></Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rakesh-cloth-stores-orders-${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(a.href);
}
