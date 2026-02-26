import { useState } from "react";
import "../styles/app.css";
 
export default function ResponseCard({ response }) {
  const [comments, setComments] = useState("");
  const [ticket, setTicket] = useState(null);
  const [resolved, setResolved] = useState(false);
 
  if (!response || !response.resolution_steps) {
    return (
      <div className="response-card">
        <p>No matching issue found. Please escalate.</p>
      </div>
    );
  }
 
  const queries = response.reference_queries || {};
  const assets = response.step_assets || {};
 
  const escalateIssue = async () => {
    const res = await fetch("https://ai-agent-project-he7a.onrender.com/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue_id: response.issue_id,
        user_comments: comments
      })
    });
 
    const data = await res.json();
    setTicket(data.ticket_id);
  };
 
  function renderTextWithLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
 
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="step-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  }
 
  return (
    <div className="response-card">
      <h3>Identified Issue</h3>
      <p style={{ whiteSpace: "pre-line" }}>
        {response.identified_issue}
      </p>
 
      <h3>Root Cause</h3>
      <p>{response.root_cause}</p>
 
      <h3>Resolution Steps</h3>
      <ol>
  {response.resolution_steps.map((step, idx) => {
    const stepNumber = String(idx + 1);
    return (
      <li key={idx}>
        {renderTextWithLinks(step)}
 
        {/* 📸 Step Images */}
        {assets[stepNumber] && (
          <div className="step-images">
            {assets[stepNumber].map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Step ${stepNumber}`}
              />
            ))}
          </div>
        )}
      </li>
    );
  })}
</ol>
 
      {/* 🔍 REFERENCE QUERIES */}
      {Object.keys(queries).length > 0 && (
        <>
          <h3>Reference Queries (Read-Only)</h3>
          {Object.entries(queries).map(([queryName, queryText]) => (
            <div key={queryName} className="query-block">
              <strong>{queryName.replaceAll("_", " ")}</strong>
              <pre>{queryText}</pre>
            </div>
          ))}
        </>
      )}
 
      {/* ✅ USER ACTIONS */}
      {!resolved && !ticket && (
        <>
          <h3>Did this resolve your issue?</h3>
 
          <textarea
            placeholder="Comments (optional, required only for escalation)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
 
          <div className="action-buttons">
            <button
              className="success-btn"
              onClick={() => setResolved(true)}
            >
              ✅ Resolved
            </button>
 
            <button
              className="danger-btn"
              onClick={escalateIssue}
            >
              ❌ Escalate to CBS
            </button>
          </div>
        </>
      )}
 
      {/* ✅ RESOLVED STATE */}
      {resolved && (
        <div className="ticket-box">
          <strong>Issue Resolved</strong>
          <p>No escalation required.</p>
        </div>
      )}
 
      {/* ❌ ESCALATED STATE */}
      {ticket && (
        <div className="ticket-box">
          <strong>Escalated Successfully</strong>
          <p>Ticket ID: {ticket}</p>
          <p>CBS support team will take over.</p>
        </div>
      )}
    </div>
  );
}
 