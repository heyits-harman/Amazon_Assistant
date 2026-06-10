import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Review, UserProfile } from '../types';
import AnalysisPanel from './AnalysisPanel';

interface Props {
  asin: string;
  scrapeReviews: (asin: string, limit?: number) => Promise<Review[]>;
}

type Stage = 'idle' | 'scraping' | 'analyzing' | 'done' | 'error';

function FloatingButton({ asin, scrapeReviews }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [analysis, setAnalysis] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile>({
    age: '',
    gender: '',
    useCase: '',
  });

  const handleStart = async () => {
    setStage('scraping');

    try {
      const reviews = await scrapeReviews(asin, 20);
      console.log(`Scraped ${reviews.length} reviews`);

      setStage('analyzing');

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin, reviews, userProfile: profile }),
      });

      const data = await response.json();
      setAnalysis(data.analysis);
      setStage('done');

    } catch (err) {
      console.error(err);
      setStage('error');
    }
  };

  return (
    <div style={styles.wrapper}>
      {!expanded ? (
        <button style={styles.fab} onClick={() => setExpanded(true)}>
          🤖 AI Review
        </button>
      ) : (
        <div style={styles.panel}>
          <button style={styles.close} onClick={() => setExpanded(false)}>✕</button>

          {stage === 'idle' && (
            <div>
              <h3 style={styles.heading}>Tell us about yourself</h3>
              <input
                style={styles.input}
                placeholder="Age (e.g. 25)"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
              <select
                style={styles.input}
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                style={styles.input}
                placeholder="Use case (e.g. gym, office, gifting)"
                value={profile.useCase}
                onChange={(e) => setProfile({ ...profile, useCase: e.target.value })}
              />
              <button style={styles.button} onClick={handleStart}>
                Analyze Reviews
              </button>
            </div>
          )}

          {stage === 'scraping' && (
            <p style={styles.status}>⏳ Scraping reviews...</p>
          )}
          {stage === 'analyzing' && (
            <p style={styles.status}>🤖 Analyzing with AI...</p>
          )}
          {stage === 'error' && (
            <p style={styles.status}>❌ Something went wrong. Try again.</p>
          )}
          {stage === 'done' && (
            <AnalysisPanel analysis={analysis} />
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999999,
    fontFamily: 'sans-serif',
  },
  fab: {
    backgroundColor: '#FF9900',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '12px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    width: '320px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
  heading: { margin: '0 0 12px', fontSize: '16px' },
  input: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#FF9900',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  status: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#555',
  },
};

export default function mountFloatingButton(
  container: HTMLElement,
  asin: string,
  scrapeReviews: (asin: string, limit?: number) => Promise<Review[]>
) {
  const root = createRoot(container);
  root.render(<FloatingButton asin={asin} scrapeReviews={scrapeReviews} />);
}