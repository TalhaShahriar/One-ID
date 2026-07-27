import crypto from 'crypto';

/**
 * Computes a standard vote block hash utilizing SHA-256
 */
export function computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash) {
  const data = [voteId, candidateId, electionId, timestamp, prevHash].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifies the complete blockchain chain of custody for a given election.
 * Returns information on chain validity.
 */
export function verifyChain(votes) {
  if (votes.length === 0) return { valid: true, totalVotes: 0 };
  for (let i = 0; i < votes.length; i++) {
    const v = votes[i];
    const expectedPrev = i === 0 ? '0'.repeat(64) : votes[i-1].vote_hash;
    if (v.prev_hash !== expectedPrev) return { valid: false, brokenAt: i, voteId: v.id };
    
    const castAtStr = v.cast_at instanceof Date ? v.cast_at.toISOString() : new Date(v.cast_at).toISOString();
    const expectedHash = computeVoteHash(v.id, v.candidate_id, v.election_id, castAtStr, v.prev_hash);
    
    if (expectedHash !== v.vote_hash) return { valid: false, brokenAt: i, voteId: v.id };
  }
  return { valid: true, totalVotes: votes.length };
}
