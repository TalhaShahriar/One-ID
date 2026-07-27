import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { verifyChain } from '../utils/blockchain.js';

/**
 * Formats a number with comma separators.
 */
function formatNum(num) {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

/**
 * Formats a date into a human readable string.
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Safely generates the election result report as an A4 PDF document.
 */
export async function generateElectionResultPDF(electionId, prisma) {
  // Fetch general election particulars
  const election = await prisma.election.findUnique({
    where: { id: electionId }
  });

  if (!election) {
    throw new Error(`Election with ID ${electionId} not found.`);
  }

  // Fetch all approved candidates
  const candidates = await prisma.candidate.findMany({
    where: { election_id: electionId, status: 'APPROVED' },
    include: {
      user: { select: { name: true, email: true } },
      party: { select: { name: true, abbreviation: true, symbol_url: true } }
    }
  });

  // Calculate votes cast per candidate group
  const voteGroups = await prisma.vote.groupBy({
    by: ['candidate_id'],
    where: { election_id: electionId },
    _count: { _all: true }
  });

  const countsMap = {};
  voteGroups.forEach((group) => {
    countsMap[group.candidate_id] = group._count._all;
  });

  // Combine candidates and their vote tallies
  const candidatesWithVotes = candidates.map((cand) => {
    const votes = countsMap[cand.id] || 0;
    return {
      id: cand.id,
      name: cand.user.name,
      partyName: cand.party.name,
      partyAbbr: cand.party.abbreviation,
      constituency: cand.constituency,
      votesCount: votes
    };
  });

  // Sort overall candidates by descending tally
  candidatesWithVotes.sort((a, b) => b.votesCount - a.votesCount);

  // Calculate registered voter metrics
  let totalRegisteredVoters = 0;
  if (election.constituency_scope === 'ALL' || election.constituency_scope === 'NATIONAL') {
    totalRegisteredVoters = await prisma.user.count({
      where: { role: 'VOTER' }
    });
  } else {
    totalRegisteredVoters = await prisma.user.count({
      where: {
        role: 'VOTER',
        constituency: {
          contains: election.constituency_scope,
          mode: 'insensitive'
        }
      }
    });
  }
  // Ensure a reasonable fallback to prevent division errors
  if (totalRegisteredVoters === 0) totalRegisteredVoters = 1;

  const totalVotesCast = await prisma.vote.count({
    where: { election_id: electionId }
  });
  const turnoutPct = (totalVotesCast / totalRegisteredVoters) * 100;

  // Retrieve complete vote ledger block-sequence to compute blockchain health indices
  const ledgerVotes = await prisma.vote.findMany({
    where: { election_id: electionId },
    orderBy: { cast_at: 'asc' }
  });

  const chainAudit = verifyChain(ledgerVotes);

  // Group FPTP winners per constituency
  const constituencyGroups = {};
  candidatesWithVotes.forEach((cand) => {
    if (!constituencyGroups[cand.constituency]) {
      constituencyGroups[cand.constituency] = [];
    }
    constituencyGroups[cand.constituency].push(cand);
  });

  const constituencyWinners = {}; // Maps constituency string -> candidateId of winner
  const fptpWinners = [];
  const partyDirectSeats = {};

  Object.keys(constituencyGroups).forEach((constituencyName) => {
    const contenders = constituencyGroups[constituencyName];
    contenders.sort((x, y) => y.votesCount - x.votesCount);
    const winner = contenders[0];

    if (winner && winner.votesCount > 0) {
      constituencyWinners[constituencyName] = winner.id;
      fptpWinners.push(winner);
      
      const pAbbr = winner.partyAbbr;
      partyDirectSeats[pAbbr] = (partyDirectSeats[pAbbr] || 0) + 1;
    }
  });

  // Reserved women space calculation if NATIONAL category
  const reservedSeats = {};
  if (election.election_type === 'NATIONAL') {
    Object.keys(partyDirectSeats).forEach((pAbbr) => {
      const direct = partyDirectSeats[pAbbr] || 0;
      reservedSeats[pAbbr] = Math.floor((direct / 300) * 50);
    });
  }

  // Create native PDF kit
  const pdfDoc = await PDFDocument.create();
  
  // Embed primary standard fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // A4 details helper setup
  const pageWidth = 595.275;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin; // 495.275 pt

  // Colors
  const navyColor = rgb(15/255, 34/255, 64/255);
  const greenBD = rgb(0/255, 106/255, 78/255);
  const charcoalColor = rgb(45/255, 55/255, 72/255);
  const grayLight = rgb(240/255, 244/255, 248/255);
  const hoverHighlight = rgb(230/255, 245/255, 238/255); // mint green row highlight
  const dividerGray = rgb(222/255, 226/255, 230/255);

  let totalPageCount = election.election_type === 'NATIONAL' ? 5 : 4;

  // Header & Footer auxiliary function
  const drawPageFooter = (page, pageNum) => {
    // Footer line separator
    page.drawLine({
      start: { x: margin, y: 55 },
      end: { x: pageWidth - margin, y: 55 },
      thickness: 0.5,
      color: dividerGray
    });

    // Left description text
    page.drawText('Generated by OneID Bangladesh | Unified E-Governance Node', {
      x: margin,
      y: 40,
      size: 8,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Page numerical index right-aligned
    const paginationText = `Page ${pageNum} of ${totalPageCount}`;
    page.drawText(paginationText, {
      x: pageWidth - margin - fontRegular.widthOfTextAtSize(paginationText, 8),
      y: 40,
      size: 8,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });
  };

  const drawPageHeader = (page, titleText) => {
    // Elegant tiny top strip of BD green
    page.drawRectangle({
      x: 0,
      y: pageHeight - 12,
      width: pageWidth,
      height: 12,
      color: greenBD
    });

    page.drawText(titleText.toUpperCase(), {
      x: margin,
      y: pageHeight - 45,
      size: 10,
      font: fontBold,
      color: navyColor
    });

    // Horizontal underline guide
    page.drawLine({
      start: { x: margin, y: pageHeight - 52 },
      end: { x: pageWidth - margin, y: pageHeight - 52 },
      thickness: 1,
      color: dividerGray
    });
  };

  // ================= PAGE 1 =================
  // COVER PAGE
  {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Top large banner strip (Navy)
    page.drawRectangle({
      x: 0,
      y: pageHeight - 180,
      width: pageWidth,
      height: 180,
      color: navyColor
    });

    // Tiny accent bar of green
    page.drawRectangle({
      x: 0,
      y: pageHeight - 188,
      width: pageWidth,
      height: 8,
      color: greenBD
    });

    // Text in Banner
    page.drawText('ONEID BANGLADESH', {
      x: margin,
      y: pageHeight - 90,
      size: 32,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('Unified Citizen Platform & Secure Ledger Systems', {
      x: margin,
      y: pageHeight - 125,
      size: 14,
      font: fontRegular,
      color: rgb(215/255, 230/255, 255/255)
    });

    // Left accent block
    page.drawRectangle({
      x: margin,
      y: 350,
      width: 5,
      height: 180,
      color: greenBD
    });

    // Centered Report Main Name
    page.drawText('OFFICIAL ELECTION REPORT', {
      x: margin + 20,
      y: 495,
      size: 24,
      font: fontBold,
      color: navyColor
    });

    page.drawText('TABULATED VOTING TALLIES & SECURITY VERDICT', {
      x: margin + 20,
      y: 470,
      size: 10,
      font: fontBold,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Information Grid
    let textY = 410;
    const drawMetaLine = (label, val) => {
      page.drawText(label, { x: margin + 20, y: textY, size: 10, font: fontBold, color: charcoalColor });
      page.drawText(val, { x: margin + 170, y: textY, size: 10, font: fontRegular, color: charcoalColor });
      textY -= 20;
    };

    drawMetaLine('Election ID:', `#${election.id}`);
    drawMetaLine('Election Designation:', election.title);
    drawMetaLine('Category Genre:', election.election_type);
    drawMetaLine('Electoral Unit:', election.administrative_unit || 'Universal');
    drawMetaLine('Constituency Domain:', election.constituency_scope || 'Sovereign Scope');
    drawMetaLine('Official Period:', `${new Date(election.start_at).toLocaleDateString()} - ${new Date(election.end_at).toLocaleDateString()}`);

    // Verification Seal Box
    page.drawRectangle({
      x: margin,
      y: 130,
      width: contentWidth,
      height: 110,
      color: grayLight,
      borderColor: dividerGray,
      borderWidth: 1
    });

    page.drawText('SHA-256 SYSTEM INTEGRITY CERTIFICATE', {
      x: margin + 20,
      y: 215,
      size: 11,
      font: fontBold,
      color: greenBD
    });

    page.drawText('This dossier compiles authorized tallies generated dynamically by OneID Bangladesh.', {
      x: margin + 20,
      y: 195,
      size: 9,
      font: fontRegular,
      color: charcoalColor
    });

    const chainIndicator = chainAudit.valid ? 'INTACT & VALID ✓' : 'CHAIN TAMPER DETECTED ✗';
    const chainColor = chainAudit.valid ? greenBD : rgb(1, 0, 0);

    page.drawText('Blockchain Chain Status:', { x: margin + 20, y: 175, size: 9, font: fontBold, color: charcoalColor });
    page.drawText(chainIndicator, { x: margin + 170, y: 175, size: 9, font: fontBold, color: chainColor });

    page.drawText('Generated On:', { x: margin + 20, y: 155, size: 9, font: fontBold, color: charcoalColor });
    page.drawText(formatDate(new Date()), { x: margin + 170, y: 155, size: 9, font: fontRegular, color: charcoalColor });

    drawPageFooter(page, 1);
  }

  // ================= PAGE 2 =================
  // GENERAL STATISTICS & METRICS
  {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(page, 'Election Executive Summary');

    page.drawText('Sovereign Electoral Demographics & Standing Stats', {
      x: margin,
      y: pageHeight - 80,
      size: 15,
      font: fontBold,
      color: navyColor
    });

    page.drawText('Review of turnout ratios, total voter density, and overall scheduled operations:', {
      x: margin,
      y: pageHeight - 98,
      size: 9,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });

    // 2x2 grid layout of panels
    const drawMetricCard = (x, y, w, h, title, value, detailLabel) => {
      // Background base
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: grayLight,
        borderColor: dividerGray,
        borderWidth: 0.5
      });

      // Top small flag
      page.drawRectangle({
        x,
        y: y + h - 4,
        width: w,
        height: 4,
        color: navyColor
      });

      page.drawText(title.toUpperCase(), {
        x: x + 15,
        y: y + h - 22,
        size: 9,
        font: fontBold,
        color: rgb(113/255, 128/255, 150/255)
      });

      page.drawText(value, {
        x: x + 15,
        y: y + h - 52,
        size: 22,
        font: fontBold,
        color: navyColor
      });

      page.drawText(detailLabel, {
        x: x + 15,
        y: y + h - 70,
        size: 8,
        font: fontRegular,
        color: charcoalColor
      });
    };

    const cardW = (contentWidth - 20) / 2;
    const cardH = 90;

    // Row 1 Cards
    drawMetricCard(margin, pageHeight - 210, cardW, cardH, 'Registered Voters', formatNum(totalRegisteredVoters), 'Eligible voter list size');
    drawMetricCard(margin + cardW + 20, pageHeight - 210, cardW, cardH, 'Total Votes Logged', formatNum(totalVotesCast), 'Physically registered ballot blocks');

    // Row 2 Cards
    drawMetricCard(margin, pageHeight - 325, cardW, cardH, 'Voter Turnout Rate', `${turnoutPct.toFixed(2)} %`, 'Attendance ratio on polling period');
    drawMetricCard(margin + cardW + 20, pageHeight - 325, cardW, cardH, 'Electoral Status', election.status, 'Current phase of voting system');

    // Chronology timeline box
    page.drawRectangle({
      x: margin,
      y: pageHeight - 510,
      width: contentWidth,
      height: 155,
      color: rgb(1,1,1),
      borderColor: dividerGray,
      borderWidth: 1
    });

    page.drawRectangle({
      x: margin,
      y: pageHeight - 380,
      width: contentWidth,
      height: 25,
      color: navyColor
    });

    page.drawText('CHRONOLOGICAL AUDIT DATA RECORD', {
      x: margin + 15,
      y: pageHeight - 373,
      size: 9,
      font: fontBold,
      color: rgb(1,1,1)
    });

    let timelineY = pageHeight - 405;
    const drawTimelineRow = (lbl, timeVal) => {
      page.drawText(lbl, { x: margin + 15, y: timelineY, size: 9, font: fontBold, color: charcoalColor });
      page.drawText(formatDate(timeVal), { x: margin + 180, y: timelineY, size: 9, font: fontRegular, color: charcoalColor });
      page.drawLine({
        start: { x: margin + 15, y: timelineY - 6 },
        end: { x: margin + contentWidth - 15, y: timelineY - 6 },
        thickness: 0.5,
        color: dividerGray
      });
      timelineY -= 22;
    };

    drawTimelineRow('Candidate Submission Pool Locked:', election.created_at);
    drawTimelineRow('Polling Place Commenced at:', election.start_at);
    drawTimelineRow('System Closing & Block Seal:', election.end_at);
    drawTimelineRow('Report Compiled and Finalized:', new Date());

    // Additional legal text block at the bottom
    page.drawText('LEGAL & COMPLIANCE NOTES', {
      x: margin,
      y: 200,
      size: 11,
      font: fontBold,
      color: greenBD
    });

    page.drawText('This report serves as the authorized electronic record of the named election. All vote counts are compiled\nrecursively through direct query against the central database system, with integrity corroborated\nby SHA-256 cryptochaining. All recounts are verified manually in accordance with BD Election Rules.', {
      x: margin,
      y: 150,
      size: 9,
      font: fontRegular,
      color: charcoalColor,
      lineHeight: 14
    });

    drawPageFooter(page, 2);
  }

  // ================= PAGE 3 =================
  // DETAILED CONSTITUENCY RESULTS
  {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(page, 'General Election Standing & Tally');

    page.drawText('Candidate Performance Matrix', {
      x: margin,
      y: pageHeight - 80,
      size: 15,
      font: fontBold,
      color: navyColor
    });

    page.drawText('List of all approved participating candidates in descending order of votes received per constituency:', {
      x: margin,
      y: pageHeight - 98,
      size: 9,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Draw Table Headers
    const tableHeaderY = pageHeight - 130;
    const rowH = 26;

    page.drawRectangle({
      x: margin,
      y: tableHeaderY - rowH,
      width: contentWidth,
      height: rowH,
      color: navyColor
    });

    const drawHeaderCell = (text, xOffset) => {
      page.drawText(text, {
        x: margin + xOffset,
        y: tableHeaderY - 17,
        size: 9,
        font: fontBold,
        color: rgb(1,1,1)
      });
    };

    drawHeaderCell('Rank', 10);
    drawHeaderCell('Candidate Name', 45);
    drawHeaderCell('Political Party', 170);
    drawHeaderCell('Constituency', 270);
    drawHeaderCell('Votes Tally', 370);
    drawHeaderCell('Share (%)', 440);

    let rowY = tableHeaderY - rowH;
    let rank = 1;

    // List out first 20 candidates (should fit well on A4, if more, they fit on page but we clip or keep clean)
    const listLimit = Math.min(candidatesWithVotes.length, 20);

    for (let i = 0; i < listLimit; i++) {
      const cand = candidatesWithVotes[i];
      const share = totalVotesCast > 0 ? (cand.votesCount / totalVotesCast) * 100 : 0;
      const isWinner = constituencyWinners[cand.constituency] === cand.id;

      rowY -= rowH;

      // Alternating list background colors, or mint highlight if constituency winner
      page.drawRectangle({
        x: margin,
        y: rowY,
        width: contentWidth,
        height: rowH,
        color: isWinner ? hoverHighlight : (i % 2 === 0 ? grayLight : rgb(1,1,1))
      });

      // Bottom outline line
      page.drawLine({
        start: { x: margin, y: rowY },
        end: { x: margin + contentWidth, y: rowY },
        thickness: 0.5,
        color: dividerGray
      });

      // Write candidate columns
      page.drawText(`${rank}`, { x: margin + 10, y: rowY + 9, size: 9, font: fontBold, color: charcoalColor });
      
      const winnerMarker = isWinner ? ' ★ WINNER' : '';
      page.drawText(`${cand.name}${winnerMarker}`, { 
        x: margin + 45, 
        y: rowY + 9, 
        size: 9, 
        font: isWinner ? fontBold : fontRegular, 
        color: isWinner ? greenBD : navyColor 
      });

      page.drawText(`${cand.partyName} (${cand.partyAbbr})`, { x: margin + 170, y: rowY + 9, size: 8, font: fontRegular, color: charcoalColor });
      page.drawText(`${cand.constituency}`, { x: margin + 270, y: rowY + 9, size: 8, font: fontRegular, color: charcoalColor });
      page.drawText(`${formatNum(cand.votesCount)}`, { x: margin + 370, y: rowY + 9, size: 9, font: fontBold, color: charcoalColor });
      page.drawText(`${share.toFixed(2)}%`, { x: margin + 440, y: rowY + 9, size: 9, font: fontBold, color: charcoalColor });

      rank++;
    }

    if (candidatesWithVotes.length === 0) {
      page.drawText('No authorized candidates have registered yet for this cycle.', {
        x: margin + 45,
        y: tableHeaderY - 60,
        size: 11,
        font: fontRegular,
        color: rgb(150/255, 150/255, 150/255)
      });
    }

    drawPageFooter(page, 3);
  }

  // ================= PAGE 4 (NATIONAL ONLY OR MAP TO BLOCKCHAIN DIRECTLY) =================
  let pageCounter = 4;
  if (election.election_type === 'NATIONAL') {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(page, 'Reserved Seats Allocation');

    page.drawText('Reserved Women seats proportional matrix', {
      x: margin,
      y: pageHeight - 80,
      size: 15,
      font: fontBold,
      color: navyColor
    });

    page.drawText('Calculated relative to direct constituency seats won using proportional constitutional thresholds', {
      x: margin,
      y: pageHeight - 98,
      size: 9,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Formula definition banner
    page.drawRectangle({
      x: margin,
      y: pageHeight - 190,
      width: contentWidth,
      height: 70,
      color: grayLight,
      borderColor: dividerGray,
      borderWidth: 0.5
    });

    page.drawText('CONSTITUTIONAL SEATING PROPORTION EQUATION', {
      x: margin + 15,
      y: pageHeight - 142,
      size: 10,
      font: fontBold,
      color: navyColor
    });

    page.drawText('Reserved Seating Allocation = floor( (Direct Seats Won / Total Standard Constituencies) x 50 )', {
      x: margin + 15,
      y: pageHeight - 164,
      size: 10,
      font: fontMono,
      color: greenBD
    });

    page.drawText('Where: Total Standard Constituencies = 300 seats', {
      x: margin + 15,
      y: pageHeight - 180,
      size: 8,
      font: fontRegular,
      color: charcoalColor
    });

    // Seat metrics table header
    const tableY = pageHeight - 230;
    const colH = 26;

    page.drawRectangle({
      x: margin,
      y: tableY - colH,
      width: contentWidth,
      height: colH,
      color: navyColor
    });

    page.drawText('Political Party', { x: margin + 20, y: tableY - 17, size: 9, font: fontBold, color: rgb(1,1,1) });
    page.drawText('Direct Constituency Seats Won', { x: margin + 180, y: tableY - 17, size: 9, font: fontBold, color: rgb(1,1,1) });
    page.drawText('Proportional Reserved Seats Assigned', { x: margin + 355, y: tableY - 17, size: 9, font: fontBold, color: rgb(1,1,1) });

    let tRowY = tableY - colH;
    const parties = Object.keys(partyDirectSeats);
    
    parties.forEach((partyKey, index) => {
      const direct = partyDirectSeats[partyKey] || 0;
      const resSeat = reservedSeats[partyKey] || 0;
      tRowY -= colH;

      page.drawRectangle({
        x: margin,
        y: tRowY,
        width: contentWidth,
        height: colH,
        color: index % 2 === 0 ? grayLight : rgb(1,1,1)
      });

      page.drawLine({
        start: { x: margin, y: tRowY },
        end: { x: margin + contentWidth, y: tRowY },
        thickness: 0.5,
        color: dividerGray
      });

      page.drawText(partyKey, { x: margin + 20, y: tRowY + 9, size: 9, font: fontBold, color: charcoalColor });
      page.drawText(`${direct} seats`, { x: margin + 180, y: tRowY + 9, size: 9, font: fontRegular, color: charcoalColor });
      page.drawText(`${resSeat} allocated`, { x: margin + 355, y: tRowY + 9, size: 9, font: fontBold, color: greenBD });
    });

    if (parties.length === 0) {
      page.drawText('No political party representatives won direct seats in this cycle.', {
        x: margin + 20,
        y: tableY - 50,
        size: 10,
        font: fontRegular,
        color: rgb(150/255, 150/255, 150/255)
      });
    }

    drawPageFooter(page, 4);
    pageCounter = 5;
  }

  // ================= PAGE 5 (OR 4 IF NOT NATIONAL) =================
  // BLOCKCHAIN AUDIT CERTIFDATE
  {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(page, 'Blockchain Security Auditory');

    page.drawText('SHA-256 Ledger Witness Verdict', {
      x: margin,
      y: pageHeight - 80,
      size: 15,
      font: fontBold,
      color: navyColor
    });

    page.drawText('Evaluation of physical database immutability through cryptographic chains of custody:', {
      x: margin,
      y: pageHeight - 98,
      size: 9,
      font: fontRegular,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Verification Result Badge
    const badgeColor = chainAudit.valid ? rgb(235/255, 247/255, 241/255) : rgb(254/255, 235/255, 235/255);
    const badgeBorder = chainAudit.valid ? greenBD : rgb(220/255, 50/255, 50/255);

    page.drawRectangle({
      x: margin,
      y: pageHeight - 210,
      width: contentWidth,
      height: 90,
      color: badgeColor,
      borderColor: badgeBorder,
      borderWidth: 1.5
    });

    const statusBig = chainAudit.valid ? 'BLOCKCHAIN VERIFICATION VERDICT: INTACT ✓' : 'ALERT: SECURITY CHAINS FAILED ✗';
    const textColor = chainAudit.valid ? greenBD : rgb(200/255, 30/255, 30/255);

    page.drawText(statusBig, {
      x: margin + 25,
      y: pageHeight - 162,
      size: 14,
      font: fontBold,
      color: textColor
    });

    const subStatusText = chainAudit.valid 
      ? 'The cryptographic chain hashes matched the theoretical sequence perfectly. No unauthorized tampering has been flagged.' 
      : 'Cryptographic anomaly diagnosed: pre-vague hash linking was breached, suggesting unauthorized database manipulation!';

    page.drawText(subStatusText, {
      x: margin + 25,
      y: pageHeight - 184,
      size: 9,
      font: fontRegular,
      color: charcoalColor
    });

    // Cryptographic parameters table
    page.drawRectangle({
      x: margin,
      y: pageHeight - 400,
      width: contentWidth,
      height: 165,
      color: grayLight,
      borderColor: dividerGray,
      borderWidth: 0.5
    });

    page.drawRectangle({
      x: margin,
      y: pageHeight - 265,
      width: contentWidth,
      height: 30,
      color: navyColor
    });

    page.drawText('SECURED INTEGRITY TRACE METRICS', {
      x: margin + 15,
      y: pageHeight - 253,
      size: 10,
      font: fontBold,
      color: rgb(1,1,1)
    });

    let trY = pageHeight - 290;
    const drawTraceRow = (lbl, val) => {
      page.drawText(lbl, { x: margin + 20, y: trY, size: 9, font: fontBold, color: charcoalColor });
      page.drawText(val, { x: margin + 180, y: trY, size: 9, font: fontRegular, color: charcoalColor });
      page.drawLine({
        start: { x: margin + 20, y: trY - 5 },
        end: { x: margin + contentWidth - 20, y: trY - 5 },
        thickness: 0.5,
        color: dividerGray
      });
      trY -= 24;
    };

    drawTraceRow('Total votes in ledger:', `${ledgerVotes.length} ballots`);
    drawTraceRow('Encryption hashing mechanism:', 'SHA-256 (Secure Hash Algorithm)');
    drawTraceRow('Audit verification status:', chainAudit.valid ? 'SUCCESS' : 'FAILURE / EXCEPTION');
    drawTraceRow('System validation execution date:', formatDate(new Date()));

    // Hashing display (Genesis & Latest)
    page.drawText('Chain Anchor hashes:', {
      x: margin,
      y: pageHeight - 440,
      size: 11,
      font: fontBold,
      color: navyColor
    });

    // Box of hashes
    page.drawRectangle({
      x: margin,
      y: pageHeight - 510,
      width: contentWidth,
      height: 55,
      color: rgb(248/255, 249/250, 252/255),
      borderColor: dividerGray,
      borderWidth: 1
    });

    const genesisPart = ledgerVotes.length > 0 ? ledgerVotes[0].prev_hash.substring(0, 8) : 'Not Active';
    const latestPart = ledgerVotes.length > 0 ? ledgerVotes[ledgerVotes.length - 1].vote_hash.substring(0, 8) : 'Not Active';

    page.drawText(`Genesis Hash:`, { x: margin + 20, y: pageHeight - 475, size: 9, font: fontBold, color: charcoalColor });
    page.drawText(`00000000.. [${genesisPart}]`, { x: margin + 120, y: pageHeight - 475, size: 9, font: fontMono, color: greenBD });

    page.drawText(`Latest Ballot Hash:`, { x: margin + 20, y: pageHeight - 495, size: 9, font: fontBold, color: charcoalColor });
    page.drawText(`.. ${latestPart}`, { x: margin + 120, y: pageHeight - 495, size: 9, font: fontMono, color: greenBD });

    // Decorative graphical chain representation
    page.drawText('CHAIN OF CUSTODY VISUAL REPRESENTATION', {
      x: margin,
      y: pageHeight - 550,
      size: 9,
      font: fontBold,
      color: rgb(113/255, 128/255, 150/255)
    });

    // Draw visual blocks
    let blockX = margin;
    const blockY = pageHeight - 610;
    const blockW = 85;
    const blockH = 40;

    const drawChainLink = (nameText, hashText, isGenesis = false) => {
      page.drawRectangle({
        x: blockX,
        y: blockY,
        width: blockW,
        height: blockH,
        color: rgb(235/255, 241/255, 248/255),
        borderColor: navyColor,
        borderWidth: 1
      });

      page.drawText(nameText, { x: blockX + 8, y: blockY + 25, size: 8, font: fontBold, color: navyColor });
      page.drawText(hashText, { x: blockX + 8, y: blockY + 10, size: 7, font: fontMono, color: greenBD });

      // Link Arrow
      if (blockX + blockW < margin + contentWidth - 20) {
        page.drawLine({
          start: { x: blockX + blockW, y: blockY + (blockH/2) },
          end: { x: blockX + blockW + 15, y: blockY + (blockH/2) },
          thickness: 1.5,
          color: greenBD
        });
        blockX += blockW + 15;
      }
    };

    drawChainLink('GENESIS BLOCK', '00000000', true);
    drawChainLink('BALLOT NO.1', genesisPart);
    drawChainLink('CHAIN LINK..', 'SHA-256');
    drawChainLink('LATEST BALLOT', latestPart);

    drawPageFooter(page, pageCounter);
  }

  // Compile final report document bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
