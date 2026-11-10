
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function ScatterMark() {
  return (
    <svg viewBox="0 0 64 64" className="scatter-mark" fill="none">
      <path d="M18 18L32 32L48 15M32 32L48 49M32 32L13 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[ [18,18], [48,15], [32,32], [48,49], [13,48] ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i===2?7:6} fill="currentColor" />
      ))}
    </svg>
  );
}

function KnowledgeNetwork() {
  return (
    <div className="welcome-visual">
      <div className="network-orbit orbit-one"></div>
      <div className="network-orbit orbit-two"></div>

      <svg
        className="knowledge-network"
        viewBox="0 0 520 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Connected project knowledge network"
      >
        <defs>
          <linearGradient id="networkLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A995FF" />
            <stop offset="100%" stopColor="#55D8E8" />
          </linearGradient>

          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor="#B8A5FF" />
            <stop offset="100%" stopColor="#7657E8" />
          </radialGradient>

          <filter id="networkGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g stroke="url(#networkLine)" strokeWidth="2" opacity="0.65">
          <path d="M260 190 L115 85" />
          <path d="M260 190 L405 85" />
          <path d="M260 190 L75 200" />
          <path d="M260 190 L445 200" />
          <path d="M260 190 L115 315" />
          <path d="M260 190 L405 315" />
        </g>

        <g filter="url(#networkGlow)">
          <path d="M260 125 L350 175 L260 225 L170 175 Z" fill="#9B83FF" opacity="0.35" />
          <path d="M170 175 L260 225 L260 265 L170 215 Z" fill="#7058D8" />
          <path d="M260 225 L350 175 L350 215 L260 265 Z" fill="#8C72F0" />
          <path d="M170 175 L260 125 L350 175 L260 225 Z" fill="url(#coreGlow)" stroke="#C5B8FF" strokeWidth="2" />

          <g stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round">
            <path d="M240 167 L260 185 L283 157" />
            <path d="M260 185 L260 207" />
          </g>

          <g fill="#FFFFFF">
            <circle cx="240" cy="167" r="7" />
            <circle cx="283" cy="157" r="7" />
            <circle cx="260" cy="185" r="8" />
            <circle cx="260" cy="207" r="7" />
          </g>
        </g>

        <g filter="url(#networkGlow)">
          <rect x="75" y="45" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
          <rect x="365" y="45" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
          <rect x="35" y="160" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
          <rect x="405" y="160" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
          <rect x="75" y="275" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
          <rect x="365" y="275" width="80" height="80" rx="18" fill="#171E38" stroke="#A995FF" strokeWidth="2" />
        </g>

        <g stroke="#C5B8FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M101 68 H126 L136 78 V104 H101 Z" />
          <path d="M126 68 V80 H136 M108 88 H128 M108 96 H128" />
          <path d="M386 86 L401 101 L427 70" />
        </g>

        <path d="M53 191 H68 L76 200 H97 V221 H53 Z" stroke="#C5B8FF" strokeWidth="3" strokeLinejoin="round" />

        <g stroke="#C5B8FF" strokeWidth="4" strokeLinecap="round">
          <path d="M425 220 V205 M443 220 V188 M461 220 V175" />
        </g>

        <g stroke="#C5B8FF" strokeWidth="3">
          <ellipse cx="115" cy="299" rx="20" ry="8" />
          <path d="M95 299 V326 C95 336 135 336 135 326 V299" />
          <path d="M95 313 C95 323 135 323 135 313" />
        </g>

        <g stroke="#C5B8FF" strokeWidth="3" strokeLinecap="round">
          <circle cx="395" cy="305" r="9" />
          <circle cx="417" cy="305" r="9" />
          <path d="M377 338 C377 316 410 316 410 338" />
          <path d="M405 338 C405 320 437 320 437 338" />
        </g>

        <g fill="#BDAEFF" filter="url(#networkGlow)">
          <circle cx="260" cy="190" r="7" />
          <circle cx="115" cy="85" r="5" />
          <circle cx="405" cy="85" r="5" />
          <circle cx="75" cy="200" r="5" />
          <circle cx="445" cy="200" r="5" />
          <circle cx="115" cy="315" r="5" />
          <circle cx="405" cy="315" r="5" />
        </g>
      </svg>

      <div className="network-caption">
        <span className="network-live-dot"></span>
        CONNECTED PROJECT MEMORY
      </div>
    </div>
  );
}


function StatCard({ label, value, detail, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <h2>{value}</h2>
      <p>{detail}</p>
    </div>
  );
}

function Insight({ icon, title, onClick }) {
  return (
    <button type="button" className="insight-item" onClick={onClick}
      style={{ width:"100%", border:"none", background:"transparent", color:"inherit", textAlign:"left", cursor:"pointer" }}>
      <span>{icon}</span><strong>{title}</strong><span className="insight-arrow">→</span>
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("Overview");

  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [findings, setFindings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [testDriveQuestion, setTestDriveQuestion] = useState("");
  const [testDriveResult, setTestDriveResult] = useState(null);

  const [handoverReport, setHandoverReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState("All");

  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("All");
  const [reviewer, setReviewer] = useState("Project Reviewer");
  const [reviewComments, setReviewComments] = useState({});
  const [editingFinding, setEditingFinding] = useState(null);
  const [reviewHistory, setReviewHistory] = useState({});
  const [historyOpen, setHistoryOpen] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title:"", description:"", assigned_to:"", priority:"Medium", due_date:""
  });

  const [decisionForm, setDecisionForm] = useState({
    title:"", decision:"", reasoning:"", evidence:"", impact:"", decided_by:""
  });

  const menuItems = [
    { name:"Overview", icon:"▦" },
    { name:"Documents", icon:"▤" },
    { name:"Knowledge Base", icon:"◇" },
    { name:"Human Review", icon:"✓" },
    { name:"Decisions", icon:"◎" },
    { name:"Pending Tasks", icon:"◷" },
    { name:"Risks & Issues", icon:"△" },
    { name:"Handover Test Drive", icon:"◉" },
    { name:"Handover Report", icon:"▧" },
  ];

  const fieldStyle = {
    width:"100%", padding:"11px 12px", borderRadius:"7px",
    border:"1px solid #30363D", background:"#0D1117",
    color:"#C9D1D9", fontSize:"14px", boxSizing:"border-box",
    outline:"none"
  };

  const labelStyle = {
    display:"block", color:"#C9D1D9", fontSize:"13px",
    fontWeight:"600", marginBottom:"7px"
  };

  const cardStyle = {
    background:"#161B22", border:"1px solid #30363D",
    borderRadius:"10px", padding:"22px", marginBottom:"18px"
  };

  const gridStyle = {
    display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
    gap:"16px"
  };

  const buttonStyle = {
    background:"#238636", color:"#FFFFFF", border:"none",
    borderRadius:"7px", padding:"11px 17px", fontSize:"14px",
    fontWeight:"600", cursor:"pointer"
  };

  const secondaryButtonStyle = {
    background:"#21262D", color:"#C9D1D9",
    border:"1px solid #30363D", borderRadius:"7px",
    padding:"9px 13px", cursor:"pointer", fontSize:"13px"
  };

  function clearMessages() {
    setMessage("");
    setError("");
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "The request could not be completed.");
    }
    return data;
  }

  // LOAD DATA

  async function loadDocuments() {
    const data = await apiRequest("/api/documents");
    setDocuments(data.documents || []);
  }

  async function loadTasks() {
    const data = await apiRequest("/api/tasks");
    setTasks(data.tasks || []);
  }

  async function loadDecisions() {
    const data = await apiRequest("/api/decisions");
    setDecisions(data.decisions || []);
  }

  async function loadKnowledge() {
    const data = await apiRequest("/api/knowledge");
    setFindings(data.findings || []);
  }

  async function loadReviews() {
    const data = await apiRequest("/api/reviews");
    setFindings(data.findings || []);
  }

  async function loadAllData() {
    try {
      await Promise.all([
        loadDocuments(),
        loadTasks(),
        loadDecisions(),
        loadKnowledge()
      ]);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // DOCUMENT UPLOAD

  async function uploadDocument() {
    if (!file) {
      setError("Please select a PDF or DOCX file first.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiRequest("/api/documents/upload", {
        method:"POST",
        body:formData
      });

      setMessage(`${file.name} uploaded successfully!`);
      setFile(null);
      const input = document.getElementById("document-input");
      if (input) input.value = "";
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // TASK MANAGEMENT

  async function createNewTask(event) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      await apiRequest("/api/tasks", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(taskForm)
      });

      setMessage("Task created successfully!");
      setTaskForm({
        title:"", description:"", assigned_to:"",
        priority:"Medium", due_date:""
      });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeTaskStatus(taskId, status) {
    clearMessages();

    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status})
      });
      setMessage("Task status updated.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTask(taskId) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    clearMessages();

    try {
      await apiRequest(`/api/tasks/${taskId}`, {method:"DELETE"});
      setMessage("Task deleted successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  // DECISION MANAGEMENT

  async function createNewDecision(event) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      await apiRequest("/api/decisions", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(decisionForm)
      });

      setMessage("Project decision saved successfully!");
      setDecisionForm({
        title:"", decision:"", reasoning:"",
        evidence:"", impact:"", decided_by:""
      });
      await loadDecisions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // HUMAN REVIEW

  function startEditingFinding(item) {
    setEditingFinding({
      id:item.id,
      title:item.title || "",
      description:item.description || "",
      evidence:item.evidence || ""
    });
  }

  async function submitReview(item, status) {
    setReviewSaving(item.id);
    clearMessages();

    const edit = editingFinding?.id === item.id ? editingFinding : null;

    try {
      await apiRequest(`/api/reviews/${item.id}`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          review_status:status,
          reviewer:reviewer.trim() || "Project Reviewer",
          comments:reviewComments[item.id] || "",
          title:edit ? edit.title : null,
          description:edit ? edit.description : null,
          evidence:edit ? edit.evidence : null
        })
      });

      setMessage(`Finding ${status.toLowerCase()} successfully.`);
      setEditingFinding(null);
      setReviewComments(prev => ({...prev,[item.id]:""}));
      await Promise.all([loadReviews(), loadKnowledge()]);
      if (handoverReport) await loadHandoverReport();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewSaving(null);
    }
  }

  async function loadReviewHistory(findingId) {
    if (historyOpen === findingId) {
      setHistoryOpen(null);
      return;
    }

    setHistoryOpen(findingId);

    try {
      const data = await apiRequest(`/api/reviews/${findingId}/history`);
      setReviewHistory(prev => ({
        ...prev,
        [findingId]:data.history || []
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  function getReviewStatus(item) {
    return item.review_status || "Needs Review";
  }

  function getStatusColor(status) {
    if (status === "Approved") return "#3FB950";
    if (status === "Rejected") return "#F85149";
    return "#D29922";
  }

  // HANDOVER TEST DRIVE

  function answerTestDriveQuestion(event) {
    event.preventDefault();

    const question = testDriveQuestion.trim().toLowerCase();
    if (!question) {
      setTestDriveResult(null);
      return;
    }

    const stopWords = new Set([
      "what","which","who","where","when","why","how","does","did",
      "the","this","that","there","are","was","were","is","has","have",
      "had","can","could","would","should","will","for","from","with",
      "about","into","and","but","not","use","used","using","project",
      "please","tell","me","show","find","give","recorded","selected",
      "still","been","being","responsible","assigned","information",
      "details","related","any","all","list","explain","describe"
    ]);

    const getKeywords = text => text.toLowerCase()
      .replace(/[^a-z0-9\s]/g," ")
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    const questionKeywords = getKeywords(question);

    const findMatches = (records, fields) => {
      if (!questionKeywords.length) return [];
      return records.map(record => {
        const content = fields.map(field => record[field] || "").join(" ");
        const words = new Set(getKeywords(content));
        const score = questionKeywords.filter(word => words.has(word)).length;
        return {record,score};
      }).filter(item => item.score > 0)
        .sort((a,b) => b.score-a.score)
        .map(item => item.record);
    };

    const matchedTasks = findMatches(tasks, [
      "title","description","assigned_to","priority","status"
    ]);

    const matchedDecisions = findMatches(decisions, [
      "title","decision","reasoning","evidence","impact","decided_by"
    ]);

    const asksPending = ["pending","unfinished","incomplete","remaining"]
      .some(word => question.includes(word));
    const asksCompleted = question.includes("completed") || question.includes("finished");
    const asksOwner = ["who","responsible","assigned","owner"]
      .some(word => question.includes(word));
    const asksAllDecisions = question.includes("what decisions") ||
      question.includes("list decisions") ||
      question.includes("all decisions") ||
      question.includes("decisions have been recorded");
    const asksDecision = question.includes("decision") ||
      question.includes("decided") || question.includes("why") ||
      question.includes("selected");

    const result = {
      answer:"",
      tasks:[],
      decisions:[],
      status:"missing",
      explanation:""
    };

    if (asksPending || asksCompleted) {
      const filtered = tasks.filter(task =>
        asksCompleted ? task.status === "Completed" : task.status !== "Completed"
      );
      result.tasks = filtered;
      result.status = filtered.length ? "found" : "missing";
      result.answer = filtered.length
        ? `${filtered.length} ${asksCompleted ? "completed" : "pending"} task(s) found.`
        : `No ${asksCompleted ? "completed" : "pending"} tasks were found.`;
      result.explanation = "Based on saved project task records.";
    } else if (asksAllDecisions) {
      result.decisions = decisions;
      result.status = decisions.length ? "found" : "missing";
      result.answer = decisions.length
        ? `${decisions.length} project decision(s) have been recorded.`
        : "No project decisions have been recorded.";
      result.explanation = "Based on all saved decision records.";
    } else if (asksOwner) {
      result.tasks = matchedTasks;
      result.status = matchedTasks.length ? "found" : "missing";
      result.answer = matchedTasks.length
        ? "Here are the matching task ownership records."
        : "No matching task ownership information was found.";
      result.explanation = "Based on matching task records.";
    } else if (asksDecision) {
      result.decisions = matchedDecisions;
      result.status = matchedDecisions.length ? "found" : "missing";
      result.answer = matchedDecisions.length
        ? `${matchedDecisions.length} relevant decision(s) found.`
        : "No relevant decision information was found.";
      result.explanation = "Based on matching decision records.";
    } else {
      const hasMatches = matchedTasks.length > 0 || matchedDecisions.length > 0;
      result.tasks = matchedTasks;
      result.decisions = matchedDecisions;
      result.status = hasMatches ? "found" : "missing";
      result.answer = hasMatches
        ? "Related information was found in saved project records."
        : "I couldn't find enough information to answer this question.";
      result.explanation = hasMatches
        ? "Results use keyword matching on saved records."
        : "This may be a knowledge gap. Record the missing information in ScatterMem.";
    }

    setTestDriveResult(result);
  }

  // FINAL HANDOVER REPORT

  async function loadHandoverReport() {
    setReportLoading(true);
    setReportError("");
    setHandoverReport(null);

    try {
      const data = await apiRequest("/api/handover/report");
      setHandoverReport(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  function downloadHandoverReport() {
    if (!handoverReport) return;

    const report = handoverReport;
    const overview = report.project_overview || {};

    const content = `# ${report.report_title}

Generated: ${report.generated_at}
Handover Status: ${report.handover_status}

## Project Overview

- Documents: ${overview.total_documents ?? 0}
- Total Findings: ${overview.total_findings ?? 0}
- Approved Findings: ${overview.approved_findings ?? 0}
- Rejected Findings: ${overview.rejected_findings ?? 0}
- Pending Reviews: ${overview.pending_review ?? 0}
- Total Tasks: ${overview.total_tasks ?? 0}
- Completed Tasks: ${overview.completed_tasks ?? 0}
- Pending Tasks: ${overview.pending_tasks ?? 0}
- Decisions: ${overview.total_decisions ?? 0}

## Approved Knowledge

${(report.approved_knowledge || []).map(item =>
  `### ${item.title}\n${item.description || ""}\nEvidence: ${item.evidence || "Not recorded"}\nSource: ${item.source_location || "Not specified"}`
).join("\n\n") || "No approved findings."}

## Pending Reviews

${(report.pending_review_findings || []).map(item =>
  `- ${item.title}: ${item.description || "No description"}`
).join("\n") || "No pending reviews."}

## Rejected Findings

${(report.rejected_findings || []).map(item =>
  `- ${item.title}: ${item.description || "No description"}`
).join("\n") || "No rejected findings."}

## Completed Tasks

${(report.completed_tasks || []).map(item =>
  `- ${item.title} — Owner: ${item.assigned_to || "Unassigned"}`
).join("\n") || "No completed tasks."}

## Pending Tasks

${(report.pending_tasks || []).map(item =>
  `- ${item.title} — Owner: ${item.assigned_to || "Unassigned"} — Priority: ${item.priority || "Medium"} — Due: ${item.due_date || "Not specified"}`
).join("\n") || "No pending tasks."}

## Project Decisions

${(report.project_decisions || []).map(item =>
  `### ${item.title}\nDecision: ${item.decision || ""}\nReasoning: ${item.reasoning || "Not recorded"}\nEvidence: ${item.evidence || "Not recorded"}\nImpact: ${item.impact || "Not recorded"}`
).join("\n\n") || "No decisions recorded."}

## Recommended Next Actions

${(report.recommended_next_actions || []).map(item =>
  `- ${item.action} — Owner: ${item.owner} — Priority: ${item.priority} — Due: ${item.due_date}`
).join("\n") || "No additional actions."}
`;

    const blob = new Blob([content], {type:"text/markdown;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ScatterMem-Handover-Report.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // PAGE HEADER

  function PageHeader({ eyebrow, title, subtitle }) {
    return (
      <div style={{marginBottom:"25px"}}>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    );
  }

  // DOCUMENTS PAGE

  function renderDocumentsPage() {
    return (
      <div>
        <PageHeader eyebrow="PROJECT KNOWLEDGE" title="Documents"
          subtitle="Upload project documents to extract and preserve important knowledge." />

        <div className="upload-card">
          <div className="card-icon">↑</div>
          <h3>Upload project documents</h3>
          <p>Select a PDF or DOCX document from your computer.</p>
          <input id="document-input" type="file" accept=".pdf,.docx"
            onChange={event => {setFile(event.target.files[0] || null);clearMessages();}} />
          {file && <p className="selected-file">Selected: {file.name}</p>}
          <button className="primary-button" onClick={uploadDocument} disabled={loading}>
            {loading ? "Uploading..." : "Upload document →"}
          </button>
        </div>

        <div className="section-heading document-heading">
          <h2>Uploaded documents ({documents.length})</h2>
          <p>Documents saved in the ScatterMem database</p>
        </div>

        {documents.length === 0 ? (
          <div className="empty-state">No documents uploaded yet.</div>
        ) : (
          <div className="document-list">
            {documents.map(doc => (
              <div className="document-row" key={doc.id}>
                <div><strong>{doc.filename}</strong><p>{doc.file_type} · Uploaded successfully</p></div>
                <span className="document-status">Uploaded</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TASKS PAGE

  function renderTasksPage() {
    return (
      <div>
        <PageHeader eyebrow="PROJECT MANAGEMENT" title="Pending Tasks"
          subtitle="Track unfinished work, ownership, priorities and deadlines." />

        <div style={cardStyle}>
          <h3 style={{marginTop:0}}>Create a new task</h3>
          <form onSubmit={createNewTask}>
            <div style={gridStyle}>
              <div><label style={labelStyle}>Task title *</label>
                <input style={fieldStyle} placeholder="e.g. Complete API integration"
                  value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} required /></div>
              <div><label style={labelStyle}>Assigned to</label>
                <input style={fieldStyle} placeholder="Team member name"
                  value={taskForm.assigned_to} onChange={e=>setTaskForm({...taskForm,assigned_to:e.target.value})} /></div>
              <div><label style={labelStyle}>Priority</label>
                <select style={fieldStyle} value={taskForm.priority}
                  onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select></div>
              <div><label style={labelStyle}>Due date</label>
                <input type="date" style={fieldStyle} value={taskForm.due_date}
                  onChange={e=>setTaskForm({...taskForm,due_date:e.target.value})} /></div>
            </div>
            <div style={{marginTop:"16px"}}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...fieldStyle,minHeight:"85px",resize:"vertical"}}
                placeholder="Describe what needs to be completed..."
                value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})} />
            </div>
            <button type="submit" style={{...buttonStyle,marginTop:"17px"}} disabled={loading}>
              {loading ? "Saving..." : "+ Create task"}
            </button>
          </form>
        </div>

        <div className="section-heading"><h2>Project tasks ({tasks.length})</h2><p>Tasks saved in the ScatterMem database</p></div>

        {tasks.length === 0 ? <div className="empty-state">No tasks yet. Create your first project task above.</div> :
          <div style={{display:"grid",gap:"13px"}}>
            {tasks.map(task=>(
              <div key={task.id} style={cardStyle}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"15px",flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <h3 style={{margin:"0 0 8px"}}>{task.title}</h3>
                    <p style={{color:"#8B949E",margin:"0 0 12px"}}>{task.description || "No description provided."}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"15px",color:"#8B949E",fontSize:"13px"}}>
                      <span>Owner: {task.assigned_to || "Unassigned"}</span><span>Priority: {task.priority}</span><span>Due: {task.due_date || "Not set"}</span>
                    </div>
                  </div>
                  <button onClick={()=>removeTask(task.id)}
                    style={{background:"transparent",color:"#F85149",border:"1px solid #30363D",borderRadius:"6px",padding:"8px 11px",cursor:"pointer"}}>Delete</button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",marginTop:"18px",paddingTop:"14px",borderTop:"1px solid #30363D"}}>
                  <label style={{color:"#8B949E",fontSize:"13px"}}>Update status:</label>
                  <select style={{...fieldStyle,width:"160px"}} value={task.status}
                    onChange={e=>changeTaskStatus(task.id,e.target.value)}>
                    <option>Pending</option><option>In Progress</option><option>Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>}
      </div>
    );
  }

  // DECISIONS PAGE

  function renderDecisionsPage() {
    return (
      <div>
        <PageHeader eyebrow="DECISION DNA" title="Project Decisions"
          subtitle="Preserve what was decided, why it was decided, and its impact." />

        <div style={cardStyle}>
          <h3 style={{marginTop:0}}>Record a project decision</h3>
          <form onSubmit={createNewDecision}>
            <div style={gridStyle}>
              <div><label style={labelStyle}>Decision title *</label>
                <input style={fieldStyle} placeholder="e.g. Use SQLite for MVP"
                  value={decisionForm.title} onChange={e=>setDecisionForm({...decisionForm,title:e.target.value})} required /></div>
              <div><label style={labelStyle}>Decided by</label>
                <input style={fieldStyle} placeholder="Team member name"
                  value={decisionForm.decided_by} onChange={e=>setDecisionForm({...decisionForm,decided_by:e.target.value})} /></div>
            </div>
            <div style={{marginTop:"16px"}}><label style={labelStyle}>What was decided? *</label>
              <textarea style={{...fieldStyle,minHeight:"75px",resize:"vertical"}}
                value={decisionForm.decision} onChange={e=>setDecisionForm({...decisionForm,decision:e.target.value})} required /></div>
            <div style={{marginTop:"16px"}}><label style={labelStyle}>Why was it decided? *</label>
              <textarea style={{...fieldStyle,minHeight:"90px",resize:"vertical"}}
                value={decisionForm.reasoning} onChange={e=>setDecisionForm({...decisionForm,reasoning:e.target.value})} required /></div>
            <div style={{...gridStyle,marginTop:"16px"}}>
              <div><label style={labelStyle}>Supporting evidence</label>
                <textarea style={{...fieldStyle,minHeight:"75px",resize:"vertical"}}
                  value={decisionForm.evidence} onChange={e=>setDecisionForm({...decisionForm,evidence:e.target.value})} /></div>
              <div><label style={labelStyle}>Expected impact</label>
                <textarea style={{...fieldStyle,minHeight:"75px",resize:"vertical"}}
                  value={decisionForm.impact} onChange={e=>setDecisionForm({...decisionForm,impact:e.target.value})} /></div>
            </div>
            <button type="submit" style={{...buttonStyle,marginTop:"17px"}} disabled={loading}>
              {loading ? "Saving..." : "+ Save decision"}
            </button>
          </form>
        </div>

        <div className="section-heading"><h2>Decision history ({decisions.length})</h2><p>Reasoning and context preserved for future team members</p></div>
        {decisions.length === 0 ? <div className="empty-state">No decisions recorded yet.</div> :
          <div style={{display:"grid",gap:"15px"}}>
            {decisions.map(item=>(
              <div key={item.id} style={cardStyle}>
                <div style={{display:"flex",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
                  <h3 style={{margin:0}}>{item.title}</h3>
                  <span style={{color:"#8B949E",fontSize:"12px"}}>{item.decided_by ? `Decided by ${item.decided_by}` : "Owner not specified"}</span>
                </div>
                <div style={{marginTop:"17px"}}><p style={labelStyle}>DECISION</p><p style={{lineHeight:1.6}}>{item.decision}</p></div>
                <div style={{marginTop:"16px"}}><p style={labelStyle}>REASONING</p><p style={{lineHeight:1.6}}>{item.reasoning || "Reasoning not recorded."}</p></div>
                {item.evidence && <div style={{marginTop:"16px"}}><p style={labelStyle}>SUPPORTING EVIDENCE</p><p style={{color:"#8B949E"}}>{item.evidence}</p></div>}
                {item.impact && <div style={{marginTop:"16px"}}><p style={labelStyle}>EXPECTED IMPACT</p><p style={{color:"#8B949E"}}>{item.impact}</p></div>}
              </div>
            ))}
          </div>}
      </div>
    );
  }

  // KNOWLEDGE BASE

  function renderKnowledgeBasePage() {
    const categories = ["All", ...new Set(findings.map(item=>item.category).filter(Boolean))];

    const filtered = findings.filter(item=>{
      const text = `${item.title || ""} ${item.description || ""} ${item.evidence || ""} ${item.filename || ""}`.toLowerCase();
      const matchesSearch = text.includes(knowledgeSearch.toLowerCase());
      const matchesCategory = knowledgeCategory === "All" || item.category === knowledgeCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div>
        <PageHeader eyebrow="PROJECT MEMORY" title="Knowledge Base"
          subtitle="Explore extracted project knowledge, supporting evidence and review status." />

        <div style={cardStyle}>
          <div style={{display:"flex",justifyContent:"space-between",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
            <div>
              <h3 style={{margin:"0 0 6px"}}>Preserved project knowledge</h3>
              <p style={{color:"#8B949E",margin:0}}>Findings extracted from uploaded project documents.</p>
            </div>
            <button style={secondaryButtonStyle} onClick={async()=>{
              try { await loadKnowledge(); setMessage("Knowledge Base refreshed."); }
              catch(err){setError(err.message);}
            }}>↻ Refresh</button>
          </div>
          <div style={{...gridStyle,marginTop:"18px"}}>
            <div>
              <label style={labelStyle}>Search findings</label>
              <input style={fieldStyle} placeholder="Search title, evidence or document..."
                value={knowledgeSearch} onChange={e=>setKnowledgeSearch(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={fieldStyle} value={knowledgeCategory} onChange={e=>setKnowledgeCategory(e.target.value)}>
                {categories.map(category=><option key={category}>{category}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="section-heading">
          <h2>Findings ({filtered.length})</h2>
          <p>Each finding should be checked against its original source.</p>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {findings.length === 0
              ? "No knowledge findings are available yet. Upload a document and run document analysis when the AI service is available."
              : "No findings match your search or category filter."}
          </div>
        ) : (
          <div style={{display:"grid",gap:"14px"}}>
            {filtered.map(item=>(
              <div key={item.id} style={cardStyle}>
                <div style={{display:"flex",justifyContent:"space-between",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:"12px",color:"#58A6FF",fontWeight:"700"}}>{item.category || "GENERAL"}</span>
                  <span style={{fontSize:"12px",fontWeight:"700",color:getStatusColor(getReviewStatus(item))}}>
                    {getReviewStatus(item)}
                  </span>
                </div>
                <h3 style={{margin:"12px 0 8px"}}>{item.title || "Untitled finding"}</h3>
                <p style={{color:"#C9D1D9",lineHeight:1.7}}>{item.description || "No description available."}</p>
                <div style={{background:"#0D1117",border:"1px solid #30363D",borderRadius:"8px",padding:"13px",marginTop:"12px"}}>
                  <p style={{fontSize:"12px",fontWeight:"700",color:"#8B949E",marginTop:0}}>SUPPORTING EVIDENCE</p>
                  <p style={{marginBottom:0,lineHeight:1.6}}>{item.evidence || "No evidence recorded."}</p>
                </div>
                <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginTop:"13px",fontSize:"12px",color:"#8B949E"}}>
                  <span>Source: {item.filename || "Unknown document"}</span>
                  <span>Location: {item.source_location || "Not specified"}</span>
                  {item.confidence !== undefined && item.confidence !== null && <span>Confidence: {item.confidence}</span>}
                </div>
                <button style={{...secondaryButtonStyle,marginTop:"14px"}} onClick={()=>setActiveTab("Human Review")}>
                  Open Human Review →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // HUMAN REVIEW PAGE

  function renderHumanReviewPage() {
    const filtered = findings.filter(item=>{
      const status = getReviewStatus(item);
      const text = `${item.title || ""} ${item.description || ""} ${item.filename || ""}`.toLowerCase();
      const matchesSearch = text.includes(reviewSearch.toLowerCase());
      const matchesStatus = reviewFilter === "All" || status === reviewFilter;
      return matchesSearch && matchesStatus;
    });

    const approvedCount = findings.filter(item=>getReviewStatus(item)==="Approved").length;
    const rejectedCount = findings.filter(item=>getReviewStatus(item)==="Rejected").length;
    const pendingCount = findings.length - approvedCount - rejectedCount;

    return (
      <div>
        <PageHeader eyebrow="HUMAN VALIDATION" title="Human Review"
          subtitle="Verify extracted project knowledge, correct errors and approve reliable findings before handover." />

        <div style={gridStyle}>
          <div style={cardStyle}><p style={{color:"#8B949E",marginTop:0}}>Total findings</p><h2 style={{margin:0}}>{findings.length}</h2></div>
          <div style={cardStyle}><p style={{color:"#8B949E",marginTop:0}}>Approved</p><h2 style={{margin:0,color:"#3FB950"}}>{approvedCount}</h2></div>
          <div style={cardStyle}><p style={{color:"#8B949E",marginTop:0}}>Rejected</p><h2 style={{margin:0,color:"#F85149"}}>{rejectedCount}</h2></div>
          <div style={cardStyle}><p style={{color:"#8B949E",marginTop:0}}>Needs review</p><h2 style={{margin:0,color:"#D29922"}}>{pendingCount}</h2></div>
        </div>

        <div style={cardStyle}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Reviewer name</label>
              <input style={fieldStyle} value={reviewer} onChange={e=>setReviewer(e.target.value)} placeholder="Enter reviewer name" />
            </div>
            <div>
              <label style={labelStyle}>Search findings</label>
              <input style={fieldStyle} value={reviewSearch} onChange={e=>setReviewSearch(e.target.value)} placeholder="Search findings..." />
            </div>
            <div>
              <label style={labelStyle}>Filter by status</label>
              <select style={fieldStyle} value={reviewFilter} onChange={e=>setReviewFilter(e.target.value)}>
                <option>All</option><option>Needs Review</option><option>Approved</option><option>Rejected</option>
              </select>
            </div>
          </div>
          <button style={{...secondaryButtonStyle,marginTop:"15px"}} onClick={async()=>{
            try { await loadReviews(); setMessage("Review findings refreshed."); }
            catch(err){setError(err.message);}
          }}>↻ Refresh findings</button>
        </div>

        <div className="section-heading"><h2>Findings awaiting verification ({filtered.length})</h2><p>Review the evidence before approving a finding.</p></div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            {findings.length === 0 ? "No findings available. Upload a document and analyse it when AI analysis is available." : "No findings match this filter."}
          </div>
        ) : (
          <div style={{display:"grid",gap:"16px"}}>
            {filtered.map(item=>{
              const status = getReviewStatus(item);
              const isEditing = editingFinding?.id === item.id;
              const history = reviewHistory[item.id] || [];

              return (
                <div key={item.id} style={cardStyle}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:"12px",fontWeight:"700",color:"#58A6FF"}}>{item.category || "GENERAL"}</span>
                    <span style={{fontSize:"12px",fontWeight:"700",color:getStatusColor(status)}}>{status}</span>
                  </div>

                  {isEditing ? (
                    <div style={{marginTop:"14px",display:"grid",gap:"12px"}}>
                      <div><label style={labelStyle}>Finding title</label>
                        <input style={fieldStyle} value={editingFinding.title}
                          onChange={e=>setEditingFinding({...editingFinding,title:e.target.value})} /></div>
                      <div><label style={labelStyle}>Description</label>
                        <textarea style={{...fieldStyle,minHeight:"90px"}}
                          value={editingFinding.description}
                          onChange={e=>setEditingFinding({...editingFinding,description:e.target.value})} /></div>
                      <div><label style={labelStyle}>Evidence</label>
                        <textarea style={{...fieldStyle,minHeight:"80px"}}
                          value={editingFinding.evidence}
                          onChange={e=>setEditingFinding({...editingFinding,evidence:e.target.value})} /></div>
                      <div style={{display:"flex",gap:"9px",flexWrap:"wrap"}}>
                        <button style={buttonStyle} onClick={()=>submitReview(item,status)} disabled={reviewSaving===item.id}>Save edits</button>
                        <button style={secondaryButtonStyle} onClick={()=>setEditingFinding(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={{margin:"13px 0 8px"}}>{item.title || "Untitled finding"}</h3>
                      <p style={{lineHeight:1.7,color:"#C9D1D9"}}>{item.description || "No description recorded."}</p>
                      <div style={{background:"#0D1117",border:"1px solid #30363D",borderRadius:"8px",padding:"13px",marginTop:"12px"}}>
                        <p style={{fontSize:"12px",fontWeight:"700",color:"#8B949E",marginTop:0}}>SUPPORTING EVIDENCE</p>
                        <p style={{lineHeight:1.6,marginBottom:0}}>{item.evidence || "No evidence recorded."}</p>
                      </div>
                    </>
                  )}

                  <div style={{display:"flex",gap:"15px",flexWrap:"wrap",marginTop:"13px",fontSize:"12px",color:"#8B949E"}}>
                    <span>Document: {item.filename || "Unknown"}</span>
                    <span>Location: {item.source_location || "Not specified"}</span>
                    {item.confidence !== undefined && item.confidence !== null && <span>Confidence: {item.confidence}</span>}
                  </div>

                  <div style={{marginTop:"16px"}}>
                    <label style={labelStyle}>Review comments</label>
                    <textarea style={{...fieldStyle,minHeight:"65px",resize:"vertical"}}
                      placeholder="Add verification notes or explain why this finding needs correction..."
                      value={reviewComments[item.id] ?? item.review_comments ?? ""}
                      onChange={e=>setReviewComments(prev=>({...prev,[item.id]:e.target.value}))} />
                  </div>

                  <div style={{display:"flex",gap:"9px",flexWrap:"wrap",marginTop:"15px"}}>
                    <button style={{...buttonStyle,background:"#238636"}} disabled={reviewSaving===item.id}
                      onClick={()=>submitReview(item,"Approved")}>
                      {reviewSaving===item.id ? "Saving..." : "✓ Approve"}
                    </button>
                    <button style={{...buttonStyle,background:"#9E3039"}} disabled={reviewSaving===item.id}
                      onClick={()=>submitReview(item,"Rejected")}>
                      ✕ Reject
                    </button>
                    <button style={{...secondaryButtonStyle,color:"#D29922"}} disabled={reviewSaving===item.id}
                      onClick={()=>submitReview(item,"Needs Review")}>
                      Needs Review
                    </button>
                    {!isEditing && <button style={secondaryButtonStyle} onClick={()=>startEditingFinding(item)}>✎ Edit finding</button>}
                    <button style={secondaryButtonStyle} onClick={()=>loadReviewHistory(item.id)}>
                      {historyOpen===item.id ? "Hide history" : "◷ Review history"}
                    </button>
                  </div>

                  {historyOpen===item.id && (
                    <div style={{marginTop:"17px",paddingTop:"15px",borderTop:"1px solid #30363D"}}>
                      <h4 style={{marginTop:0}}>Review history</h4>
                      {history.length===0 ? (
                        <p style={{color:"#8B949E",fontSize:"13px"}}>No previous review actions recorded.</p>
                      ) : (
                        <div style={{display:"grid",gap:"10px"}}>
                          {history.map((entry,index)=>(
                            <div key={entry.id || index} style={{background:"#0D1117",padding:"12px",borderRadius:"7px",border:"1px solid #30363D"}}>
                              <strong style={{color:getStatusColor(entry.review_status)}}>{entry.review_status}</strong>
                              <p style={{fontSize:"13px",color:"#8B949E",margin:"7px 0"}}>Reviewer: {entry.reviewer || "Not specified"}</p>
                              <p style={{fontSize:"13px",margin:"5px 0"}}>{entry.comments || "No comments."}</p>
                              <p style={{fontSize:"11px",color:"#8B949E",marginBottom:0}}>{entry.reviewed_at || ""}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // BLINDSPOT SCANNER

  function renderRisksPage() {
    const today = new Date().toISOString().split("T")[0];
    const unassignedTasks = tasks.filter(task=>!task.assigned_to || !task.assigned_to.trim());
    const overdueTasks = tasks.filter(task=>task.due_date && task.due_date<today && task.status!=="Completed");
    const highPriorityTasks = tasks.filter(task=>["High","Critical"].includes(task.priority) && task.status!=="Completed");
    const incompleteDecisions = decisions.filter(item=>!item.reasoning?.trim() || !item.evidence?.trim());
    const totalIssues = unassignedTasks.length+overdueTasks.length+highPriorityTasks.length+incompleteDecisions.length;
    const issueCardStyle = {...cardStyle,padding:"20px",marginBottom:"14px"};

    return (
      <div>
        <PageHeader eyebrow="BLINDSPOT SCANNER" title="Risks & Issues"
          subtitle="Identify missing ownership, overdue work and incomplete project knowledge." />
        <div style={cardStyle}>
          <p className="eyebrow">PROJECT HEALTH CHECK</p>
          <h2 style={{margin:"8px 0"}}>{totalIssues} potential blindspots detected</h2>
          <p style={{color:"#8B949E",margin:0}}>Based on {tasks.length} tasks and {decisions.length} decisions.</p>
        </div>
        <div className="section-heading"><h2>Detected issues</h2><p>Potential knowledge gaps requiring attention.</p></div>
        {totalIssues===0 ? <div className="empty-state">No blindspots detected in the saved records.</div> :
          <div>
            {unassignedTasks.map(task=><div key={`owner-${task.id}`} style={issueCardStyle}><span style={{color:"#F85149",fontSize:"12px",fontWeight:"700"}}>UNASSIGNED TASK</span><h3>{task.title}</h3><p style={{color:"#8B949E"}}>This task does not have a responsible owner.</p></div>)}
            {overdueTasks.map(task=><div key={`overdue-${task.id}`} style={issueCardStyle}><span style={{color:"#F85149",fontSize:"12px",fontWeight:"700"}}>OVERDUE TASK</span><h3>{task.title}</h3><p style={{color:"#8B949E"}}>Due date: {task.due_date}. Status: {task.status}.</p></div>)}
            {highPriorityTasks.map(task=><div key={`priority-${task.id}`} style={issueCardStyle}><span style={{color:"#D29922",fontSize:"12px",fontWeight:"700"}}>HIGH-PRIORITY WORK</span><h3>{task.title}</h3><p style={{color:"#8B949E"}}>This {task.priority.toLowerCase()} priority task is not completed.</p><p style={{color:"#8B949E",fontSize:"13px"}}>Owner: {task.assigned_to || "Unassigned"} · Status: {task.status}</p></div>)}
            {incompleteDecisions.map(item=><div key={`decision-${item.id}`} style={issueCardStyle}><span style={{color:"#D29922",fontSize:"12px",fontWeight:"700"}}>INCOMPLETE DECISION</span><h3>{item.title}</h3>{!item.reasoning?.trim() && <p style={{color:"#FF7B72"}}>Missing decision reasoning.</p>}{!item.evidence?.trim() && <p style={{color:"#FF7B72"}}>Missing supporting evidence.</p>}</div>)}
          </div>}
        <p style={{color:"#8B949E",fontSize:"12px",marginTop:"20px"}}>These are rule-based checks of saved records, not AI-generated risk assessments.</p>
      </div>
    );
  }

  // HANDOVER TEST DRIVE

  function renderHandoverTestDrivePage() {
    const sampleQuestions = [
      "Which tasks are still pending?",
      "Who is responsible for the dashboard?",
      "Why was PostgreSQL selected?",
      "What decisions have been recorded?"
    ];

    const coverageItems = [
      {label:"Project tasks recorded",complete:tasks.length>0,detail:`${tasks.length} task(s)`},
      {label:"Task ownership recorded",complete:tasks.some(task=>task.assigned_to?.trim()),detail:`${tasks.filter(task=>task.assigned_to?.trim()).length} with an owner`},
      {label:"Project decisions recorded",complete:decisions.length>0,detail:`${decisions.length} decision(s)`},
      {label:"Decision reasoning recorded",complete:decisions.some(item=>item.reasoning?.trim()),detail:`${decisions.filter(item=>item.reasoning?.trim()).length} with reasoning`},
      {label:"Decision evidence recorded",complete:decisions.some(item=>item.evidence?.trim()),detail:`${decisions.filter(item=>item.evidence?.trim()).length} with evidence`}
    ];

    const coverageScore = Math.round(coverageItems.filter(item=>item.complete).length/coverageItems.length*100);

    return (
      <div>
        <PageHeader eyebrow="KNOWLEDGE READINESS" title="Handover Test Drive"
          subtitle="Test whether a new team member can understand the project using saved knowledge." />
        <div style={cardStyle}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"20px",flexWrap:"wrap"}}>
            <div><p className="eyebrow">KNOWLEDGE COVERAGE</p><h2 style={{margin:"8px 0"}}>{coverageScore}% coverage</h2><p style={{color:"#8B949E",margin:0}}>Based on saved tasks and project decisions.</p></div>
            <div style={{width:"100px",height:"100px",borderRadius:"50%",border:"8px solid #30363D",borderTopColor:coverageScore>=60?"#3FB950":"#D29922",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"23px",fontWeight:"700"}}>{coverageScore}%</div>
          </div>
          <div style={{marginTop:"22px",display:"grid",gap:"12px"}}>
            {coverageItems.map(item=><div key={item.label} style={{display:"flex",justifyContent:"space-between",gap:"12px",paddingBottom:"10px",borderBottom:"1px solid #30363D"}}><span><span style={{color:item.complete?"#3FB950":"#D29922"}}>{item.complete?"✓":"!"}</span> {item.label}</span><span style={{color:"#8B949E",fontSize:"13px"}}>{item.detail}</span></div>)}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{marginTop:0}}>Ask the project memory</h3>
          <p style={{color:"#8B949E",lineHeight:1.6}}>Ask a question that a new team member might have. ScatterMem searches saved tasks and decisions and shows supporting records.</p>
          <form onSubmit={answerTestDriveQuestion}>
            <textarea style={{...fieldStyle,minHeight:"95px",resize:"vertical"}} placeholder="e.g. Which tasks are still pending?"
              value={testDriveQuestion} onChange={event=>{setTestDriveQuestion(event.target.value);setTestDriveResult(null);}} />
            <button type="submit" style={{...buttonStyle,marginTop:"13px"}}>Test project knowledge →</button>
          </form>
          <div style={{marginTop:"20px"}}><p style={labelStyle}>TRY A SAMPLE QUESTION</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"9px"}}>
              {sampleQuestions.map(question=><button type="button" key={question} onClick={()=>{setTestDriveQuestion(question);setTestDriveResult(null);}} style={{background:"#21262D",border:"1px solid #30363D",color:"#C9D1D9",borderRadius:"20px",padding:"9px 13px",cursor:"pointer",fontSize:"12px"}}>{question}</button>)}
            </div>
          </div>
        </div>

        {testDriveResult && <div style={cardStyle}>
          <p className="eyebrow">TEST DRIVE RESULT</p>
          <h3 style={{color:testDriveResult.status==="found"?"#3FB950":"#D29922"}}>{testDriveResult.status==="found"?"Knowledge found":"Knowledge gap detected"}</h3>
          <p style={{lineHeight:1.7}}>{testDriveResult.answer}</p>
          <p style={{color:"#8B949E",fontSize:"13px"}}>{testDriveResult.explanation}</p>
          {testDriveResult.tasks.length>0 && <div style={{marginTop:"20px"}}><h4>Supporting task records</h4>{testDriveResult.tasks.map(task=><div key={task.id} style={{background:"#0D1117",border:"1px solid #30363D",borderRadius:"8px",padding:"14px",marginTop:"10px"}}><strong>{task.title}</strong><p style={{color:"#8B949E"}}>{task.description || "No description recorded."}</p><p style={{color:"#8B949E",fontSize:"12px"}}>Owner: {task.assigned_to || "Unassigned"} · Priority: {task.priority} · Status: {task.status}</p></div>)}</div>}
          {testDriveResult.decisions.length>0 && <div style={{marginTop:"20px"}}><h4>Supporting decision records</h4>{testDriveResult.decisions.map(item=><div key={item.id} style={{background:"#0D1117",border:"1px solid #30363D",borderRadius:"8px",padding:"14px",marginTop:"10px"}}><strong>{item.title}</strong><p>{item.decision}</p><p style={{color:"#8B949E",fontSize:"13px"}}>Reasoning: {item.reasoning || "Not recorded"}</p><p style={{color:"#8B949E",fontSize:"13px"}}>Evidence: {item.evidence || "Not recorded"}</p></div>)}</div>}
        </div>}
        <p style={{color:"#8B949E",fontSize:"12px",marginTop:"18px"}}>This feature currently uses rule-based keyword matching on saved task and decision records. It does not use Gemini or search uploaded document contents.</p>
      </div>
    );
  }

  // FINAL HANDOVER REPORT PAGE

  function renderHandoverReportPage() {
    const overview = handoverReport?.project_overview || {};

    function renderRecords(records, emptyMessage, renderItem) {
      if (!records || records.length===0) return <p style={{color:"#8B949E"}}>{emptyMessage}</p>;
      return <div style={{display:"grid",gap:"12px"}}>{records.map((item,index)=><div key={item.id || index} style={{background:"#0D1117",border:"1px solid #30363D",borderRadius:"8px",padding:"14px"}}>{renderItem(item)}</div>)}</div>;
    }

    const reportCardStyle = {...cardStyle,marginBottom:"15px"};

    return (
      <div>
        <PageHeader eyebrow="PROJECT KNOWLEDGE EXPORT" title="Final Handover Report"
          subtitle="A consolidated view of project knowledge, decisions, tasks, review status and recommended next actions." />
        <div style={cardStyle}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flexWrap:"wrap"}}>
            <div><p className="eyebrow">REPORT GENERATOR</p><h3 style={{margin:"8px 0"}}>Generate your project handover</h3><p style={{color:"#8B949E",marginBottom:0}}>Collect the latest saved project information into one report.</p></div>
            <button style={buttonStyle} onClick={loadHandoverReport} disabled={reportLoading}>{reportLoading?"Generating...":"Generate report →"}</button>
          </div>
        </div>

        {reportError && <div style={{...reportCardStyle,borderColor:"#F85149",color:"#FF7B72"}}>{reportError}</div>}
        {reportLoading && <div className="empty-state">Collecting project information and preparing your report...</div>}
        {!handoverReport && !reportLoading && !reportError && <div className="empty-state">Click "Generate report" to create your project handover report.</div>}

        {handoverReport && <>
          <div style={reportCardStyle}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flexWrap:"wrap"}}>
              <div><p className="eyebrow">GENERATED REPORT</p><h2 style={{margin:"8px 0"}}>{handoverReport.report_title}</h2><p style={{color:"#8B949E",fontSize:"13px"}}>Generated: {handoverReport.generated_at ? new Date(handoverReport.generated_at).toLocaleString() : "Not available"}</p><p style={{color:"#D29922",fontWeight:"600"}}>Status: {handoverReport.handover_status}</p></div>
              <button style={buttonStyle} onClick={downloadHandoverReport}>↓ Download Markdown</button>
            </div>
          </div>
          <div className="section-heading"><h2>Project Overview</h2><p>Summary of information preserved in ScatterMem.</p></div>
          <div style={gridStyle}>
            {[
              ["Documents",overview.total_documents],["Total Findings",overview.total_findings],
              ["Approved Knowledge",overview.approved_findings],["Pending Reviews",overview.pending_review],
              ["Rejected Findings",overview.rejected_findings],["Total Tasks",overview.total_tasks],
              ["Completed Tasks",overview.completed_tasks],["Pending Tasks",overview.pending_tasks],
              ["Project Decisions",overview.total_decisions]
            ].map(([label,value])=><div key={label} style={{...cardStyle,marginBottom:0}}><p style={{color:"#8B949E",fontSize:"13px"}}>{label}</p><h2 style={{margin:0}}>{value ?? 0}</h2></div>)}
          </div>
          <div style={{...reportCardStyle,marginTop:"25px"}}><h3>Approved Knowledge</h3>{renderRecords(handoverReport.approved_knowledge,"No approved knowledge findings yet.",item=><><strong>{item.title}</strong><p>{item.description}</p><p style={{color:"#8B949E",fontSize:"13px"}}>Evidence: {item.evidence || "Not recorded"}</p><p style={{color:"#8B949E",fontSize:"12px"}}>Source: {item.source_location || "Not specified"}</p></>)}</div>
          <div style={reportCardStyle}><h3>Pending Reviews</h3>{renderRecords(handoverReport.pending_review_findings,"No findings awaiting review.",item=><><strong>{item.title}</strong><p style={{color:"#8B949E"}}>{item.description}</p></>)}</div>
          <div style={reportCardStyle}><h3>Rejected Findings</h3>{renderRecords(handoverReport.rejected_findings,"No rejected findings.",item=><><strong>{item.title}</strong><p style={{color:"#8B949E"}}>{item.description}</p></>)}</div>
          <div style={reportCardStyle}><h3>Pending Tasks</h3>{renderRecords(handoverReport.pending_tasks,"No pending tasks.",item=><><strong>{item.title}</strong><p style={{color:"#8B949E"}}>{item.description || "No description"}</p><p style={{fontSize:"13px",color:"#8B949E"}}>Owner: {item.assigned_to || "Unassigned"} · Priority: {item.priority || "Medium"} · Due: {item.due_date || "Not specified"}</p></>)}</div>
          <div style={reportCardStyle}><h3>Completed Tasks</h3>{renderRecords(handoverReport.completed_tasks,"No completed tasks.",item=><><strong>{item.title}</strong><p style={{color:"#8B949E"}}>Owner: {item.assigned_to || "Unassigned"}</p></>)}</div>
          <div style={reportCardStyle}><h3>Project Decisions</h3>{renderRecords(handoverReport.project_decisions,"No project decisions recorded.",item=><><strong>{item.title}</strong><p><b>Decision:</b> {item.decision}</p><p><b>Reasoning:</b> {item.reasoning || "Not recorded"}</p><p style={{color:"#8B949E"}}><b>Evidence:</b> {item.evidence || "Not recorded"}</p><p style={{color:"#8B949E"}}><b>Impact:</b> {item.impact || "Not recorded"}</p></>)}</div>
          <div style={reportCardStyle}><h3>Recommended Next Actions</h3>{renderRecords(handoverReport.recommended_next_actions,"No additional actions recommended.",item=><><strong>{item.action}</strong><p style={{color:"#8B949E",fontSize:"13px"}}>Owner: {item.owner} · Priority: {item.priority} · Due: {item.due_date}</p></>)}</div>
        </>}
      </div>
    );
  }

  // MAIN DASHBOARD

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><ScatterMark /></div><div><h2>ScatterMem</h2><span>Knowledge Handover</span></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {menuItems.map(item=><button key={item.name}
            className={`nav-item ${activeTab===item.name?"active":""}`}
            onClick={()=>{setActiveTab(item.name);clearMessages();}}>
            <span className="nav-icon">{item.icon}</span>{item.name}
          </button>)}
        </nav>
        <div className="sidebar-bottom"><div className="status-dot"></div><div><strong>AI Engine</strong><span>Gemini configured</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="breadcrumb">Workspace / </span><strong>{activeTab}</strong></div><div className="avatar">U</div></header>
        <section className="page-content">
          {message && <div style={{background:"#12261A",border:"1px solid #238636",color:"#3FB950",padding:"12px 15px",borderRadius:"7px",marginBottom:"18px"}}>{message}</div>}
          {error && <div style={{background:"#2D1618",border:"1px solid #F85149",color:"#FF7B72",padding:"12px 15px",borderRadius:"7px",marginBottom:"18px"}}>{error}</div>}

          {activeTab==="Documents" && renderDocumentsPage()}
          {activeTab==="Pending Tasks" && renderTasksPage()}
          {activeTab==="Decisions" && renderDecisionsPage()}
          {activeTab==="Knowledge Base" && renderKnowledgeBasePage()}
          {activeTab==="Human Review" && renderHumanReviewPage()}
          {activeTab==="Risks & Issues" && renderRisksPage()}
          {activeTab==="Handover Test Drive" && renderHandoverTestDrivePage()}
          {activeTab==="Handover Report" && renderHandoverReportPage()}

          {activeTab==="Overview" && <>
            <div className="welcome-section">
              <div>
                <p className="eyebrow">PROJECT KNOWLEDGE INTELLIGENCE</p>
                <h1>Preserve knowledge.<br/><span>Never lose context.</span></h1>
                <p className="subtitle">Turn scattered project information into structured, actionable knowledge for your team.</p>
                <button className="primary-button" onClick={()=>setActiveTab("Documents")}>Upload project documents →</button>
              </div>
              <KnowledgeNetwork />
            </div>

            <div className="stats-grid">
              <StatCard label="Documents" value={documents.length} detail="Uploaded files" icon="▤" />
              <StatCard label="Project Tasks" value={tasks.length} detail="Recorded tasks" icon="◷" />
              <StatCard label="Decisions" value={decisions.length} detail="Preserved decisions" icon="◇" />
              <StatCard label="Knowledge Findings" value={findings.length} detail="Extracted findings" icon="✓" />
            </div>

            <div className="section-heading"><h2>Knowledge workspace</h2><p>Manage your project's knowledge and continuity.</p></div>
            <div className="workspace-grid">
              <div className="upload-card"><div className="card-icon">↑</div><h3>Project documents</h3><p>Upload project reports, documentation and handover files.</p><button className="primary-button" onClick={()=>setActiveTab("Documents")}>Explore documents →</button><div className="file-types">Supported formats: PDF and DOCX</div></div>
              <div className="insight-card"><div className="insight-header"><h3>Project Memory</h3><span className="ai-badge">SCATTERMEM</span></div><p>Preserve decisions and keep track of work that needs to be completed.</p><div className="insight-list">
                <Insight icon="◇" title="Project decisions" onClick={()=>setActiveTab("Decisions")} />
                <Insight icon="◷" title="Pending tasks" onClick={()=>setActiveTab("Pending Tasks")} />
                <Insight icon="▤" title="Project documents" onClick={()=>setActiveTab("Documents")} />
                <Insight icon="✓" title="Human Review" onClick={()=>setActiveTab("Human Review")} />
              </div></div>
            </div>
            <div className="bottom-banner"><div><span className="banner-label">YOUR PROJECT MEMORY</span><h3>Every decision has a story. Keep it alive.</h3><p>Build a reliable knowledge handover for the next team.</p></div><div className="banner-symbol"><ScatterMark /></div></div>
          </>}
        </section>
      </main>
    </div>
  );
}

export default App;
