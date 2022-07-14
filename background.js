map = {}

async function executeModel(url) {

  if (url in map) output = map[url]
  else {
    data = {'url_or_id': url}
    console.log("url_or_id:", url)
    output = fetch("http://20.127.169.209:8000/upload/", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(res => res.json());
    console.log("object_analysis", output.object_analysis)
    if (output.object_analysis) map[url] = output;
  }

  console.log('Prediction for %s', url);
  console.log('Output', output);
  return output;
}

chrome.runtime.onMessage.addListener((request, sender, callback) => {

  executeModel(request.url)
  .then(result => callback({result: result}))
  .catch(err => callback({result: false, err: err.message}));
  
  return true; // needed to make the content script wait for the async processing to complete
});
