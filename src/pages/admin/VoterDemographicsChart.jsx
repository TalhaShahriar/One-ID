import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend
} from 'recharts';
import { Users, MapPin, Loader2 } from 'lucide-react';
import api from '../../lib/api.js';

export default function VoterDemographicsChart({ electionId }) {
  const [loading, setLoading] = useState(true);
  const [demographics, setDemographics] = useState({ regionData: [], ageData: [] });

  useEffect(() => {
    let mounted = true;
    
    const fetchDemographics = async () => {
      if (!electionId) return;
      
      try {
        setLoading(true);
        const res = await api.get(`/elections/${electionId}/demographics`);
        if (mounted) {
          setDemographics(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch demographic stats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDemographics();
    
    // Set up polling for real-time-ish updates if socket isn't directly giving demographics
    const interval = setInterval(fetchDemographics, 15000); // every 15s
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [electionId]);

  if (!electionId) return null;

  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
          Demographic Turnout Analysis
        </h4>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* REGION CHART */}
        <div className="space-y-3">
          <h5 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
            <MapPin className="h-3.5 w-3.5" /> Turnout by Region
          </h5>
          <div className="h-48 w-full">
            {demographics.regionData.length === 0 && !loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No regional data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographics.regionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-950 text-white p-3 rounded-lg shadow-xl text-left">
                            <p className="text-xs font-bold">{payload[0].payload.name}</p>
                            <p className="text-xs text-emerald-400 mt-0.5">{payload[0].value}% Turnout</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="turnout" fill="#006a4e" radius={[0, 4, 4, 0]} barSize={16}>
                    {demographics.regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.turnout > 50 ? '#006a4e' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AGE GROUP CHART */}
        <div className="space-y-3">
          <h5 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
            <Users className="h-3.5 w-3.5" /> Turnout by Age Group
          </h5>
          <div className="h-48 w-full flex items-center justify-center">
            {demographics.ageData.length === 0 && !loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No age group data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 border border-slate-950 text-white p-3 rounded-lg shadow-xl text-left">
                            <p className="text-xs font-bold">{payload[0].payload.name} Years</p>
                            <p className="text-xs text-blue-400 mt-0.5">{payload[0].value}% Turnout</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={demographics.ageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="turnout"
                  >
                    {demographics.ageData.map((entry, index) => {
                      const colors = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: '10px', fontWeight: '600' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
