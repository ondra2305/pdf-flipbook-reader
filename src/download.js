// a second fetch of the URL can hit broken cached partial responses from range loading
export async function downloadPdf(pdf, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([await pdf.getData()], { type: 'application/pdf' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}
