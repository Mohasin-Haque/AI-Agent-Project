// import { useState } from "react";
// import "../styles/app.css";

// export default function ResponseCard({ response }) {
//   const [comments, setComments] = useState("");
//   const [ticket, setTicket] = useState(null);
//   const [resolved, setResolved] = useState(false);

//   if (!response || !response.resolution_steps) {
//     return (
//       <div className="response-card">
//         <p>No matching issue found. Please escalate.</p>
//       </div>
//     );
//   }

//   const queries = response.reference_queries || {};
//   const assets = response.step_assets || {};

//   const escalateIssue = async () => {
//     const res = await fetch("https://ai-agent-project-he7a.onrender.com/escalate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         issue_id: response.issue_id,
//         user_comments: comments
//       })
//     });

//     const data = await res.json();
//     setTicket(data.ticket_id);
//   };

//   function renderTextWithLinks(text) {
//     const urlRegex = /(https?:\/\/[^\s]+)/g;

//     return text.split(urlRegex).map((part, index) => {
//       if (part.match(urlRegex)) {
//         return (
//           <a
//             key={index}
//             href={part}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="step-link"
//           >
//             {part}
//           </a>
//         );
//       }
//       return part;
//     });
//   }

//   return (
//     <div className="response-card">
//       <h3>Identified Issue</h3>
//       <p style={{ whiteSpace: "pre-line" }}>
//         {response.identified_issue}
//       </p>

//       <h3>Root Cause</h3>
//       <p>{response.root_cause}</p>

//       <h3>Resolution Steps</h3>
//       <ol>
//   {response.resolution_steps.map((step, idx) => {
//     const stepNumber = String(idx + 1);
//     return (
//       <li key={idx}>
//         {renderTextWithLinks(step)}

//         {/* 📸 Step Images */}
//         {assets[stepNumber] && (
//           <div className="step-images">
//             {assets[stepNumber].map((img, i) => (
//               <img
//                 key={i}
//                 src={img}
//                 alt={`Step ${stepNumber}`}
//               />
//             ))}
//           </div>
//         )}
//       </li>
//     );
//   })}
// </ol>

//       {/* 🔍 REFERENCE QUERIES */}
//       {Object.keys(queries).length > 0 && (
//         <>
//           <h3>Reference Queries (Read-Only)</h3>
//           {Object.entries(queries).map(([queryName, queryText]) => (
//             <div key={queryName} className="query-block">
//               <strong>{queryName.replaceAll("_", " ")}</strong>
//               <pre>{queryText}</pre>
//             </div>
//           ))}
//         </>
//       )}

//       {/* ✅ USER ACTIONS */}
//       {!resolved && !ticket && (
//         <>
//           <h3>Did this resolve your issue?</h3>

//           <textarea
//             placeholder="Comments (optional, required only for escalation)"
//             value={comments}
//             onChange={(e) => setComments(e.target.value)}
//           />

//           <div className="action-buttons">
//             <button
//               className="success-btn"
//               onClick={() => setResolved(true)}
//             >
//               ✅ Resolved
//             </button>

//             <button
//               className="danger-btn"
//               onClick={escalateIssue}
//             >
//               ❌ Escalate to CBS
//             </button>
//           </div>
//         </>
//       )}

//       {/* ✅ RESOLVED STATE */}
//       {resolved && (
//         <div className="ticket-box">
//           <strong>Issue Resolved</strong>
//           <p>No escalation required.</p>
//         </div>
//       )}

//       {/* ❌ ESCALATED STATE */}
//       {ticket && (
//         <div className="ticket-box">
//           <strong>Escalated Successfully</strong>
//           <p>Ticket ID: {ticket}</p>
//           <p>CBS support team will take over.</p>
//         </div>
//       )}
//     </div>
//   );
// }
import { useState } from "react";
import "../styles/app.css";

export default function ResponseCard({ response }) {
  const [comments, setComments] = useState("");
  const [ticket, setTicket] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [escalationMessage, setEscalationMessage] = useState("");
  const [escalationEmailSent, setEscalationEmailSent] = useState(null);
  const [escalationTargetTeam, setEscalationTargetTeam] = useState(null);
  const [escalationLogPath, setEscalationLogPath] = useState(null);
  const [escalationLogError, setEscalationLogError] = useState(null);

  if (!response || !response.resolution_steps) {
    return (
      <div className="response-card">
        <p>No matching issue found. Please escalate.</p>
      </div>
    );
  }

  const queries = response.reference_queries || {};
  const assets = response.step_assets || {};

  // determine which support team should handle this issue based on the system field
  function getEscalationTeam(system) {
    if (!system) return "CBS";
    const s = system.toLowerCase();
    if (s.includes("compass") || s.includes("aml")) return "AML";
    if (s.includes("sdk")) return "Digital";
    return "CBS";
  }

  const escalationTeam = getEscalationTeam(response.system);

  const escalateIssue = async () => {
    // basic validation for reporter fields
    if (!reporterName || !reporterEmail) {
      alert('Please provide your name and email before escalating.');
      return;
    }

    const res = await fetch("https://ai-agent-project-he7a.onrender.com/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue_id: response.issue_id,
        user_comments: comments,
        system: response.system,
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        reporter_phone: reporterPhone,
        search_query: response.search_query || null
      })
    });

    const data = await res.json();
    setTicket(data.ticket_id);
    setEscalationMessage(data.message || "");
    setEscalationEmailSent(data.email_sent ?? null);
    setEscalationTargetTeam(data.target_team || null);
    setEscalationLogPath(data.log_path || null);
    setEscalationLogError(data.log_error || null);
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
      {response.system && (
        <p><strong>System:</strong> {response.system}</p>
      )}

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 8 }}>
            <input
              type="text"
              placeholder="Your name"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
            />
          </div>

          <p style={{ fontSize: '0.9em', color: '#555' }}>
            Escalation will be sent to the <strong>{escalationTeam}</strong> team.
          </p>

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
              ❌ Escalate to {escalationTeam}
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
          {escalationMessage && <p>{escalationMessage}</p>}
          {escalationTargetTeam && <p>Target team: {escalationTargetTeam}</p>}
          {escalationEmailSent === true && (
            <p>Escalation email was sent to the support contact.</p>
          )}
          {escalationEmailSent === false && (
            <p>Escalation email was not sent; payload saved on server.</p>
          )}
          {escalationLogPath && (
            <p>Logged event: <code>{escalationLogPath}</code></p>
          )}
          {escalationLogError && (
            <p style={{ color: 'red' }}>Logging error: {escalationLogError}</p>
          )}
        </div>
      )}
    </div>
  );
}
