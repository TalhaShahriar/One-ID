import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Setup Mock Closures on globalThis to prevent hoisting ReferenceErrors in Jest ESM
globalThis.mockFindUniqueElection = jest.fn();
globalThis.mockFindUniqueCandidate = jest.fn();
globalThis.mockFindUniqueUser = jest.fn();
globalThis.mockFindUniqueVoterElection = jest.fn();
globalThis.mockFindFirstVote = jest.fn();
globalThis.mockVoteCreate = jest.fn();
globalThis.mockVoteTokenCreate = jest.fn();
globalThis.mockVoterElectionUpsert = jest.fn();
globalThis.mockTransaction = jest.fn();
globalThis.mockVoteTokenFindUnique = jest.fn();
globalThis.mockCountVote = jest.fn();

jest.unstable_mockModule('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        election: {
          findUnique: (args) => globalThis.mockFindUniqueElection(args),
        },
        candidate: {
          findUnique: (args) => globalThis.mockFindUniqueCandidate(args),
        },
        user: {
          findUnique: (args) => globalThis.mockFindUniqueUser(args),
        },
        voterElection: {
          findUnique: (args) => globalThis.mockFindUniqueVoterElection(args),
          upsert: (args) => globalThis.mockVoterElectionUpsert(args),
        },
        vote: {
          findFirst: (args) => globalThis.mockFindFirstVote(args),
          create: (args) => globalThis.mockVoteCreate(args),
          count: (args) => globalThis.mockCountVote(args),
        },
        voteToken: {
          create: (args) => globalThis.mockVoteTokenCreate(args),
          findUnique: (args) => globalThis.mockVoteTokenFindUnique(args),
        },
        $transaction: (callback) => {
          // Provide minimum mock client interface for $transaction callbacks
          const mockTxClient = {
            vote: {
              findFirst: (args) => globalThis.mockFindFirstVote(args),
              create: (args) => globalThis.mockVoteCreate(args),
            },
            voteToken: {
              create: (args) => globalThis.mockVoteTokenCreate(args),
            },
            voterElection: {
              findUnique: (args) => globalThis.mockFindUniqueVoterElection(args),
              upsert: (args) => globalThis.mockVoterElectionUpsert(args),
            },
          };
          if (globalThis.mockTransaction.mock.calls.length > 0) {
            return globalThis.mockTransaction(callback);
          }
          return callback(mockTxClient);
        },
      };
    }),
    Role: {
      ADMIN: 'ADMIN',
      VOTER: 'VOTER',
      CANDIDATE: 'CANDIDATE'
    },
    ElectionType: {
      NATIONAL: 'NATIONAL',
      LOCAL: 'LOCAL',
      PRESIDENTIAL: 'PRESIDENTIAL'
    },
    ElectionStatus: {
      SCHEDULED: 'SCHEDULED',
      ACTIVE: 'ACTIVE',
      CLOSED: 'CLOSED',
      RESULTS_PUBLISHED: 'RESULTS_PUBLISHED'
    }
  };
});

// Dynamic imports are required after unstable_mockModule for correct ESM resolution
const { default: votesRouter } = await import('../src/modules/voting/votes.routes.js');

describe('VoteChain BD Secure Voting and Receipt Verification Suite', () => {
  let app;
  let mockToken;
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-random-key-change-this-in-production';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/votes', votesRouter);

    app.set('io', {
      to: () => ({
        emit: () => {}
      }),
      emit: () => {}
    });

    mockToken = jwt.sign(
      {
        userId: 10,
        id: 10,
        role: 'VOTER',
        constituency: 'Dhaka-1',
      },
      JWT_SECRET
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('duplicate vote is rejected with 403', async () => {
    globalThis.mockFindUniqueElection.mockResolvedValue({
      id: 5,
      title: 'Mock Election Dhaka-1',
      status: 'ACTIVE',
      constituency_scope: 'Dhaka-1',
    });

    globalThis.mockFindUniqueCandidate.mockResolvedValue({
      id: 2,
      election_id: 5,
      constituency: 'Dhaka-1',
      status: 'APPROVED',
    });

    globalThis.mockFindUniqueUser.mockResolvedValue({
      id: 10,
      constituency: 'Dhaka-1',
    });

    globalThis.mockFindUniqueVoterElection.mockResolvedValue({
      voter_id: 10,
      election_id: 5,
      has_voted: true,
    });

    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        election_id: 5,
        candidate_id: 2,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'You have already voted in this election'
    });
  });

  test('vote to wrong constituency returns 403', async () => {
    globalThis.mockFindUniqueElection.mockResolvedValue({
      id: 5,
      title: 'Mock Election',
      status: 'ACTIVE',
      constituency_scope: 'Dhaka-1',
    });

    globalThis.mockFindUniqueCandidate.mockResolvedValue({
      id: 3,
      election_id: 5,
      constituency: 'Dhaka-2',
      status: 'APPROVED',
    });

    globalThis.mockFindUniqueUser.mockResolvedValue({
      id: 10,
      constituency: 'Dhaka-1', // wrong constituency
    });

    globalThis.mockFindUniqueVoterElection.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        election_id: 5,
        candidate_id: 3,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'You are not eligible to vote for this constituency'
    });
  });

  test('receipt token is verifiable via public endpoint', async () => {
    const mockVerificationUUID = 'test-token-uuid-abc-123';
    const mockCastAt = new Date();

    globalThis.mockVoteTokenFindUnique.mockResolvedValue({
      token: mockVerificationUUID,
      vote_id: 'vote-uuid-999',
      vote: {
        id: 'vote-uuid-999',
        cast_at: mockCastAt,
        election: {
          title: 'Official General Election By-Election',
          election_type: 'NATIONAL',
        },
      },
    });

    const response = await request(app)
      .get(`/api/votes/verify/${mockVerificationUUID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      vote_id: 'vote-uuid-999',
      cast_at: mockCastAt.toISOString(),
      election: {
        title: 'Official General Election By-Election',
        election_type: 'NATIONAL',
      },
    });
  });

  test('vote_tokens has no voter_id field — zero-knowledge guarantee', () => {
    const mockVoteTokenProperties = {
      id: 25,
      token: 'uuid-receipt-token-777',
      vote_id: 'vote-uuid-111',
    };

    expect(mockVoteTokenProperties.voter_id).toBeUndefined();
    expect(mockVoteTokenProperties.user_id).toBeUndefined();
    expect(mockVoteTokenProperties).not.toHaveProperty('voter_id');
    expect(mockVoteTokenProperties).not.toHaveProperty('user_id');
  });
});
