import React, { useState, useEffect } from 'react';
import { HfInference } from '@huggingface/inference'; 
// Note: Leveraging HfInference for stable production-like response. 
// Ready for migration to the new InferenceClient structure if async streaming requirements increase.

const App = () => {
  // --- State Management ---
  const [sql, setSql] = useState('');
  const [results, setResults] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [hfToken, setHfToken] = useState('');

  // Use this block to auto-fill the token in dev environment (ensure token value is configured in secrets first)
  // const [hfToken, setHfToken] = useState(() => {
  //   // Only attempt to read environment variables in non-production environments (i.e., not a deployed web page)
  //   if (process.env.NODE_ENV !== 'production') {
  //     return process.env.REACT_APP_HF_TOKEN || '';
  //   }
  //   return '';
  // });

  // --- Test Case Library ---
  const testCases = [
    { 
      label: "1. Fatal Full Table Update", 
      code: "UPDATE CC_USER_BALANCE \nSET BALANCE_AMOUNT = 0, \nLAST_UPDATE_DATE = SYSDATE" 
    },
    { 
      label: "2. Index Invalidation (LIKE %)", 
      code: "SELECT * FROM CRM_CUSTOMER_INFO \nWHERE CUST_MOBILE_NO LIKE '%91234567'" 
    },
    { 
      label: "3. Legacy Cartesian Product", 
      code: "SELECT t1.CUST_ID, t2.ORDER_NO \nFROM TS_CUST_MASTER t1, TS_ORDER_DETAIL t2" 
    }
  ];

  // --- Layer 1: Senior PSR Expert Hard Rules (Local Execution) ---
  const quickAudit = (inputSql) => {
    const issues = [];
    const upper = inputSql.toUpperCase().trim();

    // 1. Full Table Update/Delete Check
    if ((upper.includes('UPDATE') || upper.includes('DELETE')) && !upper.includes('WHERE')) {
      issues.push({ level: 'Critical', msg: 'Full table UPDATE/DELETE detected! Missing WHERE clause is a fatal error in production environment.' });
    }
    
    // 2. Select * Check
    if (upper.includes('SELECT *')) {
      issues.push({ level: 'Warning', msg: 'Explicit column selection recommended. SELECT * increases I/O overhead and reduces cache efficiency.' });
    }

    // 3. Cartesian Product Check
    const hasMultipleTables = upper.includes(',') && (!upper.includes('WHERE') || upper.indexOf(',') < upper.indexOf('WHERE'));
    const hasJoinWithoutOn = upper.includes('JOIN') && !upper.includes('ON');
    if (hasMultipleTables || hasJoinWithoutOn) {
      issues.push({ level: 'High', msg: 'Potential Cartesian Product detected! Missing join conditions may lead to database service interruption.' });
    }

    // 4. Fuzzy Query Prefix Check
    if (upper.includes("LIKE '%")) {
      issues.push({ level: 'Warning', msg: 'Leading wildcard (%) invalidates Oracle indexes. Evaluate data volume or consider full-text search alternatives.' });
    }

    return issues;
  };

  // --- Layer 2: AI Deep Audit (Calling Qwen 2.5) ---
  const handleAudit = async () => {
    if (!hfToken) {
      alert("Please enter or configure Hugging Face Token to enable AI diagnostic features.");
      return;
    }

    setLoading(true);
    setAiAnalysis('');
    
    // Execute local rule engine
    const localIssues = quickAudit(sql);
    setResults(localIssues);

    try {
      const client = new HfInference(hfToken);
      const prompt = `You are a senior Oracle DBA and Production Support Engineer. 
      Please audit the following SQL and provide professional technical recommendations:
      
      SQL: ${sql}
      
      Please respond strictly in the following format:
      ### 1. Potential Risk Assessment
      ### 2. Performance Optimization (Oracle Specific)
      ### 3. Optimized SQL Example`;

      const response = await client.chatCompletion({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          { role: "system", content: "You are a senior expert specialized in SQL performance tuning and database security." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for deterministic professional output
      });

      setAiAnalysis(response.choices[0].message.content);
    } catch (err) {
      setAiAnalysis(`AI Diagnosis temporarily unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto', fontFamily: '"Segoe UI", Tahoma, sans-serif', color: '#333' }}>
      <header style={{ borderBottom: '3px solid #333', marginBottom: '20px' }}>
        <h1 style={{ margin: '0' }}>🛠️ Smart SQL Auditor</h1>
        <p style={{ color: '#666' }}>Senior Production Support (PSR) Analysis Tool</p>
      </header>

      {/* Configuration Section */}
      <section style={{ backgroundColor: '#f0f2f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>Hugging Face Token: </label>
        <input 
          type="password" 
          value={hfToken} 
          onChange={(e) => setHfToken(e.target.value)}
          placeholder="Enter hf_..."
          style={{ width: '300px', marginLeft: '10px', padding: '5px' }}
        />
        {process.env.REACT_APP_HF_TOKEN && <span style={{ color: 'green', marginLeft: '10px' }}>● System Secret Loaded Successfully</span>}
      </section>

      {/* Test Case Selection Section */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Load Examples: </strong>
        {testCases.map((tc, idx) => (
          <button 
            key={idx} 
            onClick={() => setSql(tc.code)}
            style={{ margin: '0 5px', cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {tc.label}
          </button>
        ))}
      </div>

      {/* SQL Input Area */}
      <textarea 
        style={{ width: '100%', height: '180px', padding: '15px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', boxSizing: 'border-box', backgroundColor: '#2d2d2d', color: '#fff', fontFamily: 'monospace' }}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="Paste your SQL statements here..."
      />

      <button 
        onClick={handleAudit}
        disabled={loading || !sql}
        style={{ width: '100%', marginTop: '15px', padding: '15px', backgroundColor: loading ? '#999' : '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: 'none' }}
      >
        {loading ? '🔍 Performing Deep Audit...' : 'Start SQL Analysis'}
      </button>

      {/* Audit Report Result Area */}
      {results && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ borderLeft: '5px solid #000', paddingLeft: '10px' }}>Analysis Report</h2>
          
          {/* Local PSR Rule Engine Results */}
          <div style={{ marginBottom: '20px' }}>
            {results.length === 0 ? (
              <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px' }}>✅ Passed all basic PSR rule checks.</div>
            ) : (
              results.map((r, i) => (
                <div key={i} style={{ padding: '10px', marginBottom: '8px', backgroundColor: r.level === 'Critical' ? '#ffebee' : '#fff3e0', borderLeft: `5px solid ${r.level === 'Critical' ? '#d32f2f' : '#f57c00'}`, color: '#333' }}>
                  <strong>[{r.level}]</strong> {r.msg}
                </div>
              ))
            )}
          </div>

          {/* AI-Powered Diagnostic Results */}
          {aiAnalysis && (
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', whiteSpace: 'pre-wrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>🤖 AI Deep Diagnosis (Qwen 2.5)</h3>
              {aiAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;