export async function queryIssue(userQuery) {
  //local
  // const res = await fetch("http://127.0.0.1:8000/query", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ user_query: userQuery })
  // });
  //prod
  const res = await fetch("https://ai-agent-project-he7a.onrender.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_query: userQuery })
  });

  return res.json();
}
