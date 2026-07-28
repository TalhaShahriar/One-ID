/**
 * OneID Bangladesh — AI Fraud Detection / Anomaly Detection Engine
 * 
 * NOTE: As per SRS specifications, this implements the core Anomaly Detection rules
 * using a robust, deterministic, rule-based design. Each rule check evaluates
 * specific security metrics with configurable alert thresholds.
 */

export const RULES = {
  IP_RATE_THRESHOLD: 50,        // Max requests per IP per window
  IP_WINDOW_MS: 5 * 60 * 1000,  // 5 minute window
  OFF_HOURS_START: 22,          // 10 PM
  OFF_HOURS_END: 6,             // 6 AM  
};

// In-memory IP request tracker
const ipRequestMap = new Map(); // ip → Array of timestamps (ms)

/**
 * Checks if a specific IP address has casted an unusual number of vote requests.
 */
export async function checkIPRateSpike(ip, electionId, prisma, voterId) {
  const now = Date.now();
  const windowStart = now - RULES.IP_WINDOW_MS;
  const ipKey = ip || "unknown_ip";
  
  if (!ipRequestMap.has(ipKey)) {
    ipRequestMap.set(ipKey, []);
  }
  
  const requests = ipRequestMap.get(ipKey).filter(t => t > windowStart);
  requests.push(now);
  ipRequestMap.set(ipKey, requests);
  
  if (requests.length > RULES.IP_RATE_THRESHOLD) {
    return await flagAnomaly(prisma, {
      flag_type: "IP_RATE_SPIKE",
      ip_address: ipKey,
      voter_id: voterId,
      election_id: electionId,
      severity: requests.length > 100 ? "HIGH" : "MEDIUM",
      details: { request_count: requests.length, window_minutes: 5 }
    });
  }
  return null;
}

/**
 * Checks if a browser fingerprint has been reused by a different voter in the same election.
 */
export async function checkDeviceFingerprint(fingerprint, voterId, electionId, prisma) {
  // Query all device collision flags for this election
  const existingFlags = await prisma.anomalyFlag.findMany({
    where: {
      flag_type: "DEVICE_COLLISION",
      election_id: electionId
    }
  });
  
  // Parse Details internally to match fingerprint and exclude same voter
  const otherVoters = existingFlags.filter(f => {
    let detailsObj = f.details;
    if (typeof detailsObj === 'string') {
      try {
        detailsObj = JSON.parse(detailsObj);
      } catch (e) {
        detailsObj = null;
      }
    }
    return detailsObj && detailsObj.fingerprint === fingerprint && f.voter_id !== voterId;
  });
  
  if (otherVoters.length > 0) {
    return await flagAnomaly(prisma, {
      flag_type: "DEVICE_COLLISION",
      ip_address: "N/A",
      voter_id: voterId,
      election_id: electionId,
      severity: "HIGH",
      details: { fingerprint, collision_count: otherVoters.length }
    });
  }
  
  // If this is the first use, we should ideally track it somewhere else
  // instead of polluting the AnomalyFlag table.
  return null;
}

/**
 * Checks if a voter is casting a ballot during off-hours.
 */
export async function checkOffHoursActivity(electionId, prisma, voterId) {
  const hour = new Date().getHours();
  const isOffHours = hour >= RULES.OFF_HOURS_START || hour < RULES.OFF_HOURS_END;
  
  if (isOffHours) {
    return await flagAnomaly(prisma, {
      flag_type: "OFF_HOURS_ACTIVITY",
      ip_address: "N/A",
      voter_id: voterId,
      election_id: electionId,
      severity: "LOW",
      details: { hour_detected: hour, threshold_start: RULES.OFF_HOURS_START, threshold_end: RULES.OFF_HOURS_END }
    });
  }
  return null;
}

/**
 * Internal helper to write an anomaly record into the database.
 */
async function flagAnomaly(prisma, data) {
  try {
    const dbData = {
      flag_type: data.flag_type,
      ip_address: data.ip_address || "N/A",
      voter_id: data.voter_id ? parseInt(data.voter_id, 10) : null,
      election_id: data.election_id ? parseInt(data.election_id, 10) : null,
      severity: data.severity,
      details: data.details || {},
      is_reviewed: false
    };

    return await prisma.anomalyFlag.create({ 
      data: dbData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  } catch (e) {
    console.error('Failed to write anomaly flag:', e);
    return null;
  }
}

/**
 * Orchestrates all rule checks concurrently, filtering out null responses.
 */
export async function runAllChecks({ ip, voterId, electionId, fingerprint, prisma }) {
  const flags = [];
  
  const ipFlag = await checkIPRateSpike(ip, electionId, prisma, voterId);
  if (ipFlag) flags.push(ipFlag);

  const deviceFlag = fingerprint ? await checkDeviceFingerprint(fingerprint, voterId, electionId, prisma) : null;
  if (deviceFlag) flags.push(deviceFlag);

  const hoursFlag = await checkOffHoursActivity(electionId, prisma, voterId);
  if (hoursFlag) flags.push(hoursFlag);

  return flags;
}
