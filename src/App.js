import React, { useState, useEffect } from 'react';
import { HfInference } from '@huggingface/inference'; 
// Note: Leveraging HfInference for stable production-like response. 
// Ready for migration to the new InferenceClient structure if async streaming requirements increase.

const App = () => {
  // --- 狀態管理 ---
  const [sql, setSql] = useState('');
  const [results, setResults] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [hfToken, setHfToken] = useState('');
  // 使用這一段可以在開發環境中自動填token(要先在secret 設定好token value)
  // const [hfToken, setHfToken] = useState(() => {
  // // 只有在非生產環境（即不是 deploy 後的網頁）才嘗試讀取環境變數
  //   if (process.env.NODE_ENV !== 'production') {
  //     return process.env.REACT_APP_HF_TOKEN || '';
  //   }
  //   return '';
  // });

  // --- 測試案例庫 ---
  const testCases = [
    { 
      label: "1. 致命全表更新", 
      code: "UPDATE CC_USER_BALANCE \nSET BALANCE_AMOUNT = 0, \nLAST_UPDATE_DATE = SYSDATE" 
    },
    { 
      label: "2. 索引失效 (LIKE %)", 
      code: "SELECT * FROM CRM_CUSTOMER_INFO \nWHERE CUST_MOBILE_NO LIKE '%91234567'" 
    },
    { 
      label: "3. 舊式笛卡爾積", 
      code: "SELECT t1.CUST_ID, t2.ORDER_NO \nFROM TS_CUST_MASTER t1, TS_ORDER_DETAIL t2" 
    }
  ];

  // --- 第一層：資深 PSR 專家硬規則 (本地即時執行) ---
  const quickAudit = (inputSql) => {
    const issues = [];
    const upper = inputSql.toUpperCase().trim();

    // 1. 全表更新/刪除檢查
    if ((upper.includes('UPDATE') || upper.includes('DELETE')) && !upper.includes('WHERE')) {
      issues.push({ level: 'Critical', msg: '偵測到全表更新/刪除！缺失 WHERE 子句，這在生產環境是致命錯誤。' });
    }
    
    // 2. Select * 檢查
    if (upper.includes('SELECT *')) {
      issues.push({ level: 'Warning', msg: '建議指定具體欄位。使用 SELECT * 會增加 I/O 負擔並降低緩存效率。' });
    }

    // 3. 笛卡爾積 (Cartesian Product) 檢查
    const hasMultipleTables = upper.includes(',') && (!upper.includes('WHERE') || upper.indexOf(',') < upper.indexOf('WHERE'));
    const hasJoinWithoutOn = upper.includes('JOIN') && !upper.includes('ON');
    if (hasMultipleTables || hasJoinWithoutOn) {
      issues.push({ level: 'High', msg: '偵測到潛在的笛卡爾積！多表關聯缺失條件，可能導致資料庫崩潰。' });
    }

    // 4. 模糊查詢前綴檢查
    if (upper.includes("LIKE '%")) {
      issues.push({ level: 'Warning', msg: '前綴百分號 (%) 導致 Oracle 索引失效。建議評估資料量或改用全文索引。' });
    }

    return issues;
  };

  // --- 第二層：AI 深度審計 (呼叫 Qwen 2.5) ---
  const handleAudit = async () => {
    if (!hfToken) {
      alert("請輸入或配置 Hugging Face Token 以啟用 AI 功能。");
      return;
    }

    setLoading(true);
    setAiAnalysis('');
    
    // 執行本地規則
    const localIssues = quickAudit(sql);
    setResults(localIssues);

    try {
      const client = new HfInference(hfToken);
      const prompt = `你是一位資深 Oracle DBA 和 Production Support 工程師。
      請審計以下 SQL 並給出專業建議：
      
      SQL: ${sql}
      
      請嚴格按以下格式回答：
      ### 1. 潛在風險評估
      ### 2. 效能優化建議 (針對 Oracle 特性)
      ### 3. 優化後的 SQL 範例`;

      const response = await client.chatCompletion({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          { role: "system", content: "你是一位精通 SQL 性能調優和資料庫安全的資深專家。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3, // 降低隨機性，確保建議專業穩定
      });

      setAiAnalysis(response.choices[0].message.content);
    } catch (err) {
      setAiAnalysis(`AI 診斷暫時不可用: ${err.message}`);
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

      {/* 配置區 */}
      <section style={{ backgroundColor: '#f0f2f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>Hugging Face Token: </label>
        <input 
          type="password" 
          value={hfToken} 
          onChange={(e) => setHfToken(e.target.value)}
          placeholder="請輸入 hf_..."
          style={{ width: '300px', marginLeft: '10px', padding: '5px' }}
        />
        {process.env.REACT_APP_HF_TOKEN && <span style={{ color: 'green', marginLeft: '10px' }}>● 系統密鑰已載入</span>}
      </section>

      {/* 測試範例區 */}
      <div style={{ marginBottom: '10px' }}>
        <strong>載入範例：</strong>
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

      {/* 輸入區 */}
      <textarea 
        style={{ width: '100%', height: '180px', padding: '15px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', boxSizing: 'border-box', backgroundColor: '#2d2d2d', color: '#fff', fontFamily: 'monospace' }}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="在此貼上 SQL 語句..."
      />

      <button 
        onClick={handleAudit}
        disabled={loading || !sql}
        style={{ width: '100%', marginTop: '15px', padding: '15px', backgroundColor: loading ? '#999' : '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: 'none' }}
      >
        {loading ? '🔍 正在進行深度審計...' : '開始分析 SQL'}
      </button>

      {/* 審計報告區 */}
      {results && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ borderLeft: '5px solid #000', paddingLeft: '10px' }}>分析報告</h2>
          
          {/* 本地 PSR 規則結果 */}
          <div style={{ marginBottom: '20px' }}>
            {results.length === 0 ? (
              <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px' }}>✅ 通過基礎 PSR 規則檢查。</div>
            ) : (
              results.map((r, i) => (
                <div key={i} style={{ padding: '10px', marginBottom: '8px', backgroundColor: r.level === 'Critical' ? '#ffebee' : '#fff3e0', borderLeft: `5px solid ${r.level === 'Critical' ? '#d32f2f' : '#f57c00'}`, color: '#333' }}>
                  <strong>[{r.level}]</strong> {r.msg}
                </div>
              ))
            )}
          </div>

          {/* AI 建議結果 */}
          {aiAnalysis && (
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', whiteSpace: 'pre-wrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>🤖 AI 深度診斷 (Qwen 2.5)</h3>
              {aiAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;