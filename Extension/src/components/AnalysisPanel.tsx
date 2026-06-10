import React from 'react';

interface Props {
  analysis: string;
}

export default function AnalysisPanel({ analysis }: Props) {
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>AI Analysis</h3>
      <div style={{ 
        fontSize: '13px', 
        lineHeight: '1.6', 
        whiteSpace: 'pre-wrap', 
        color: '#333' 
      }}>
        {analysis}
      </div>
    </div>
  );
}