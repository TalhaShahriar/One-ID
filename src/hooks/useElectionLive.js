import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useSocket } from './useSocket.js';

/**
 * Custom hook to monitor live votes and candidate metrics of an election in real-time.
 */
export function useElectionLive(electionId) {
  const [candidates, setCandidates] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { socket, isConnected } = useSocket();

  const fetchResults = async () => {
    if (!electionId) return;
    try {
      const response = await api.get(`/elections/${electionId}/results`);
      if (response.data && response.data.candidates) {
        setCandidates(response.data.candidates);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching dynamic election results:', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  useEffect(() => {
    if (!socket || !electionId) return;

    // Join the distinct Socket.io room dedicated to this electionId
    const electionIdStr = electionId.toString();
    socket.emit('join:election', electionIdStr);
    console.log(`📡 Emitted join:election room handshake for ID: ${electionIdStr}`);

    // Handle vote cast event triggers in real-time
    const handleVoteCast = (data) => {
      if (parseInt(data.election_id, 10) !== parseInt(electionId, 10)) return;
      
      console.log('🗳️ Live vote:cast socket match received: ', data);
      
      // Dynamically increment targeted candidate count in React local state
      setCandidates((prevCandidates) => 
        prevCandidates.map((cand) => {
          if (cand.id === parseInt(data.candidate_id, 10)) {
            return {
              ...cand,
              votesCount: (cand.votesCount || 0) + 1,
              vote_count: (cand.vote_count || 0) + 1
            };
          }
          return cand;
        })
      );
      
      setLastUpdated(new Date());

      // Trigger standard CSS flash rendering if option callback attached
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('vote:cast:flash', { detail: data }));
      }
    };

    socket.on('vote:cast', handleVoteCast);

    return () => {
      socket.off('vote:cast', handleVoteCast);
    };
  }, [socket, electionId]);

  const totalVotes = candidates.reduce((sum, cand) => sum + (cand.votesCount || cand.vote_count || 0), 0);

  return { candidates, totalVotes, lastUpdated, refetch: fetchResults };
}
