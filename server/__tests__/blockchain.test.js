import { computeVoteHash, verifyChain } from '../utils/blockchain.js';

describe('VoteChain BD Blockchain Chain-Of-Custody Verification Suite', () => {
  // Mock timestamp for deterministic hashes
  const mockTimestamp = '2026-06-13T00:00:00.000Z';

  test('empty chain is valid', () => {
    const result = verifyChain([]);
    expect(result.valid).toBe(true);
    expect(result.totalVotes).toBe(0);
  });

  test('single vote chain is valid', () => {
    const voteId = 'vote-uuid-1';
    const candidateId = 1;
    const electionId = 100;
    const prevHash = '0'.repeat(64);
    
    const voteHash = computeVoteHash(voteId, candidateId, electionId, mockTimestamp, prevHash);

    const singleVoteChain = [
      {
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(mockTimestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      },
    ];

    const result = verifyChain(singleVoteChain);
    expect(result.valid).toBe(true);
    expect(result.totalVotes).toBe(1);
  });

  test('multi-vote chain with correct hashes is valid', () => {
    const votes = [];
    let prevHash = '0'.repeat(64);

    for (let i = 0; i < 5; i++) {
      const voteId = `vote-uuid-${i}`;
      const candidateId = (i % 3) + 1;
      const electionId = 100;
      const timestamp = new Date(new Date(mockTimestamp).getTime() + i * 60000).toISOString();
      const voteHash = computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash);

      votes.push({
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(timestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      });

      prevHash = voteHash;
    }

    const result = verifyChain(votes);
    expect(result.valid).toBe(true);
    expect(result.totalVotes).toBe(5);
  });

  test('chain with tampered vote hash is detected', () => {
    const votes = [];
    let prevHash = '0'.repeat(64);

    for (let i = 0; i < 3; i++) {
      const voteId = `vote-uuid-${i}`;
      const candidateId = i + 1;
      const electionId = 100;
      const timestamp = new Date(new Date(mockTimestamp).getTime() + i * 60000).toISOString();
      const voteHash = computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash);

      votes.push({
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(timestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      });

      prevHash = voteHash;
    }

    // Tamper with the hash of the second block (index 1)
    votes[1].vote_hash = 'tampered-hash-value-12345';

    const result = verifyChain(votes);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
    expect(result.voteId).toBe('vote-uuid-1');
  });

  test('chain with tampered prev_hash is detected', () => {
    const votes = [];
    let prevHash = '0'.repeat(64);

    for (let i = 0; i < 3; i++) {
      const voteId = `vote-uuid-${i}`;
      const candidateId = i + 1;
      const electionId = 100;
      const timestamp = new Date(new Date(mockTimestamp).getTime() + i * 60000).toISOString();
      const voteHash = computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash);

      votes.push({
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(timestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      });

      prevHash = voteHash;
    }

    // Tamper with intermediate prev_hash links
    votes[2].prev_hash = 'tampered-prev-link-99999';

    const result = verifyChain(votes);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(2);
    expect(result.voteId).toBe('vote-uuid-2');
  });

  test('chain with tampered candidate_id is detected — hash no longer matches', () => {
    const votes = [];
    let prevHash = '0'.repeat(64);

    for (let i = 0; i < 3; i++) {
      const voteId = `vote-uuid-${i}`;
      const candidateId = 1; // originally was candidate 1
      const electionId = 100;
      const timestamp = new Date(new Date(mockTimestamp).getTime() + i * 60000).toISOString();
      const voteHash = computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash);

      votes.push({
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(timestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      });

      prevHash = voteHash;
    }

    // Attempting to change candidate_id of index 1 post-facto to candidate 2
    votes[1].candidate_id = 2;

    const result = verifyChain(votes);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
    expect(result.voteId).toBe('vote-uuid-1');
  });

  test('broken chain reports correct brokenAt index', () => {
    const votes = [];
    let prevHash = '0'.repeat(64);

    for (let i = 0; i < 10; i++) {
      const voteId = `vote-uuid-${i}`;
      const candidateId = 2;
      const electionId = 100;
      const timestamp = new Date(new Date(mockTimestamp).getTime() + i * 60000).toISOString();
      const voteHash = computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash);

      votes.push({
        id: voteId,
        candidate_id: candidateId,
        election_id: electionId,
        cast_at: new Date(timestamp),
        prev_hash: prevHash,
        vote_hash: voteHash,
      });

      prevHash = voteHash;
    }

    // Break link at index 7 (the 8th vote block)
    votes[7].vote_hash = 'broken-hash-link';

    const result = verifyChain(votes);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(7);
    expect(result.voteId).toBe('vote-uuid-7');
  });
});
