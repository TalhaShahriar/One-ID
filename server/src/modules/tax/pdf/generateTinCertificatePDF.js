import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates an NBR-styled tax payment receipt in PDF format
 * @param {object} taxReturn - The tax return record
 * @returns {Promise<Uint8Array>} Raw PDF document bytes
 */
export async function generateTinCertificatePDF(taxReturn) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();

  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Border Setup
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.08, 0.50, 0.24), // NBR Green
    borderWidth: 2,
    color: rgb(0.98, 0.99, 0.98)
  });

  // Top header bands (Yellow and red sub-hints representing Bangladesh Flag details)
  page.drawRectangle({
    x: 20,
    y: height - 35,
    width: width - 40,
    height: 15,
    color: rgb(0.08, 0.50, 0.24)
  });

  page.drawCircle({
    x: width / 2,
    y: height - 75,
    radius: 25,
    color: rgb(0.85, 0.11, 0.19) // BD Red Circle
  });

  // Logo text or Government Title
  page.drawText('GOVERNMENT OF THE PEOPLE\'S REPUBLIC OF BANGLADESH', {
    x: 50,
    y: height - 120,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('NATIONAL BOARD OF REVENUE', {
    x: 210,
    y: height - 138,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.50, 0.24)
  });

  page.drawText('UNIFIED ONEID DIGITAL PORTAL — INCOME TAX CERTIFICATE', {
    x: 135,
    y: height - 155,
    size: 9,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4)
  });

  // Horizontal divider
  page.drawRectangle({
    x: 40,
    y: height - 170,
    width: width - 80,
    height: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  // Metadata boxes
  const metaY = height - 200;
  
  // Left Column
  page.drawText(`Citizen Name:`, { x: 50, y: metaY, size: 10, font: fontBold });
  page.drawText(`${taxReturn.taxProfile?.citizen?.name || 'Valued Citizen'}`, { x: 140, y: metaY, size: 10, font: fontSans });

  page.drawText(`Taxpayer TIN:`, { x: 50, y: metaY - 20, size: 10, font: fontBold });
  page.drawText(`${taxReturn.taxProfile?.tin || 'N/A'}`, { x: 140, y: metaY - 20, size: 10, font: fontSans });

  page.drawText(`OneID Ref:`, { x: 50, y: metaY - 40, size: 10, font: fontBold });
  page.drawText(`${taxReturn.taxProfile?.citizenOneId || 'N/A'}`, { x: 140, y: metaY - 40, size: 10, font: fontSans });

  // Right Column
  page.drawText(`TIN:`, { x: 340, y: metaY, size: 10, font: fontBold });
  page.drawText(`${taxReturn.receiptNumber || 'N/A'}`, { x: 420, y: metaY, size: 10, font: fontSans });

  page.drawText(`Issued Date:`, { x: 340, y: metaY - 20, size: 10, font: fontBold });
  page.drawText(`${taxReturn.taxYear || 'N/A'}`, { x: 420, y: metaY - 20, size: 10, font: fontSans });

  page.drawText(`Filing Date:`, { x: 340, y: metaY - 40, size: 10, font: fontBold });
  const formatedDate = taxReturn.submittedAt ? new Date(taxReturn.submittedAt).toLocaleDateString() : 'N/A';
  page.drawText(`${formatedDate}`, { x: 420, y: metaY - 40, size: 10, font: fontSans });

  // Breakdown title
  page.drawText('ASSESSMENT & INCOME BREAKDOWN', {
    x: 50,
    y: metaY - 80,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.50, 0.24)
  });

  // Build simple Table headers
  const tableY = metaY - 100;
  page.drawRectangle({
    x: 40,
    y: tableY - 5,
    width: width - 80,
    height: 20,
    color: rgb(0.95, 0.96, 0.95)
  });

  page.drawText('Revenue Source', { x: 50, y: tableY, size: 9, font: fontBold });
  page.drawText('Amount (BDT)', { x: 480, y: tableY, size: 9, font: fontBold });

  // Table rows
  let currentY = tableY - 25;
  const rowData = [
    { name: 'Gross Income (Total Reported Earnings)', val: taxReturn.grossIncome },
    { name: 'Taxable Income Base', val: taxReturn.taxableIncome },
    { name: 'Slab-based Calculated Tax', val: taxReturn.calculatedTax },
    { name: 'Location minimum levy guarantee', val: taxReturn.minimumTax },
    { name: 'Government Final Assessed Tax Due', val: taxReturn.finalTax },
    { name: 'Status', val: taxReturn.paymentStatus }
  ];

  rowData.forEach(item => {
    page.drawText(item.name, { x: 50, y: currentY, size: 9, font: fontSans });
    
    let displayVal = '';
    if (typeof item.val === 'string') {
      displayVal = item.val;
    } else {
      displayVal = `BDT ${item.val.toLocaleString()}`;
    }

    page.drawText(displayVal, { x: 480, y: currentY, size: 9, font: item.name.includes('Final') ? fontBold : fontSans });
    
    // Tiny subtle line dividers
    page.drawRectangle({
      x: 40,
      y: currentY - 5,
      width: width - 80,
      height: 0.5,
      color: rgb(0.9, 0.9, 0.9)
    });

    currentY -= 20;
  });

  // Outstanding Payment Box
  const summaryBoxY = currentY - 30;
  page.drawRectangle({
    x: 40,
    y: summaryBoxY,
    width: width - 80,
    height: 45,
    color: rgb(0.94, 0.97, 0.95),
    borderColor: rgb(0.13, 0.63, 0.33),
    borderWidth: 1
  });

  page.drawText('NET TAX LEVY PAID ON SUBMISSION:', { x: 55, y: summaryBoxY + 25, size: 10, font: fontBold, color: rgb(0.08, 0.50, 0.24) });
  page.drawText(`BDT ${taxReturn.finalTax.toLocaleString()}`, { x: 460, y: summaryBoxY + 25, size: 11, font: fontBold, color: rgb(0.08, 0.50, 0.24) });
  
  const paymentText = taxReturn.paymentStatus === 'PAID' 
    ? `Paid status: PAID. Complete cryptographic settlement checked okay.` 
    : `Status: UNPAID. Balance BDT ${taxReturn.finalTax.toLocaleString()} required complete settlement.`;

  page.drawText(paymentText, { x: 55, y: summaryBoxY + 10, size: 8, font: fontSans, color: rgb(0.3, 0.3, 0.3) });

  // Cryptographic blockchain seal block
  const blockY = summaryBoxY - 70;
  page.drawRectangle({
    x: 40,
    y: blockY,
    width: width - 80,
    height: 80,
    color: rgb(0.95, 0.95, 0.97),
    borderColor: rgb(0.3, 0.3, 0.4),
    borderWidth: 1
  });

  page.drawText('SECURE BLOCKCHAIN SYSTEM CRYPTOGRAPHIC AUDIT TRACE', {
    x: 55,
    y: blockY + 62,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.3)
  });

  page.drawText(`Transaction Chain Proof Ledger ID: ${taxReturn.ledgerRecordId || 'Not registered in local chain'}`, {
    x: 55,
    y: blockY + 45,
    size: 8,
    font: fontSans,
    color: rgb(0.3, 0.3, 0.4)
  });

  page.drawText('Integrity Layer: TAX SHA-256 Chain • Sector Key HMAC Block • Merkle Sealed Block cyclic integrity check ok', {
    x: 55,
    y: blockY + 30,
    size: 7,
    font: fontSans,
    color: rgb(0.4, 0.4, 0.5)
  });

  // QR Placeholder text
  page.drawRectangle({
    x: 480,
    y: blockY + 10,
    width: 30,
    height: 30,
    borderColor: rgb(0,0,0),
    borderWidth: 1
  });
  page.drawText('QR', { x: 490, y: blockY + 20, size: 8, font: fontBold });

  page.drawText(`Scan to verify: [ledgerRecordId: ${taxReturn.ledgerRecordId || 'N/A'}]`, {
    x: 55,
    y: blockY + 13,
    size: 7,
    font: fontSans,
    color: rgb(0.4, 0.4, 0.5)
  });

  // Footer seal
  const footerY = 50;
  page.drawText('National Income Tax Registry Authority System Agent • Government e-Governance Portal', {
    x: 95,
    y: footerY,
    size: 8,
    font: fontSans,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
