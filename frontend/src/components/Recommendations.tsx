import { useState, useEffect } from 'react';
import { fetchRecommendations } from '../api/weather';
import type { WeatherData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface RecommendationsProps {
  location1: string;
  location2: string;
  weather1: WeatherData;
  weather2: WeatherData;
}

interface ParsedSection {
  title: string;
  content: string;
  icon: string;
}

function parseRecommendations(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Split by markdown headers (**Title:**)
  const lines = text.split('\n');
  let currentSection: ParsedSection | null = null;
  
  for (const line of lines) {
    const headerMatch = line.match(/^\*\*(.+?):\*\*$/);
    
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      const title = headerMatch[1];
      let icon = '📝';
      
      // Assign icons based on title
      if (title.toLowerCase().includes('difference')) icon = '🌡️';
      else if (title.toLowerCase().includes('bring') || title.toLowerCase().includes('wear')) icon = '🎒';
      else if (title.toLowerCase().includes('microclimate') || title.toLowerCase().includes('insight')) icon = '🌁';
      else if (title.toLowerCase().includes('summary')) icon = '✨';
      
      currentSection = { title, content: '', icon };
    } else if (currentSection && line.trim()) {
      // Add content to current section
      currentSection.content += line + '\n';
    } else if (!currentSection && line.trim()) {
      // Content before any header - add as intro
      if (sections.length === 0 || sections[0].title !== 'Overview') {
        sections.unshift({ title: 'Overview', content: line + '\n', icon: '📋' });
      } else {
        sections[0].content += line + '\n';
      }
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.filter(s => s.content.trim());
}

export default function Recommendations({ location1, location2, weather1, weather2 }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const recs = await fetchRecommendations(location1, location2, weather1, weather2);
        setRecommendations(recs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [location1, location2, weather1, weather2]);

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Recommendations</h2>
        <LoadingSpinner message="Generating personalized advice..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Recommendations</h2>
        <ErrorMessage message={error} />
      </div>
    );
  }

  const sections = recommendations ? parseRecommendations(recommendations) : [];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-semibold text-gray-800">AI Recommendations</h2>
      </div>
      
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{section.icon}</span>
              <h3 className="font-semibold text-gray-800 text-base">{section.title}</h3>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              {section.content.trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
