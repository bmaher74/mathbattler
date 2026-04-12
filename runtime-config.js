// Committed stub — overwritten by npm run build (local) / Netlify CI.
// Do not commit secrets: use repo-root .env locally; set env vars on Netlify for production.
(function(){
  window.__dashscope_api_key = "";
  if ("".trim()) window.__dashscope_base_url = "";
  if ("".trim()) window.__dashscope_model = "";
  if ("".trim()) window.__dashscope_chat_completions_url = "";

  // Firebase config must be a JSON string in window.__firebase_config.
  var fbJson = "";
  if (fbJson.trim()) {
    window.__firebase_config = fbJson;
  } else if ("".trim() && "".trim()) {
    window.__firebase_config = JSON.stringify({
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: ""
    });
  }
})();
