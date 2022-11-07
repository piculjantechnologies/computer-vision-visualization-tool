map = {}

async function executeModel(url, token) {

  if (url in map) output = map[url]
  else {
    data = {'url_or_id': url}
    console.log("url_or_id:", url)
    console.log("token:", token)
        
    output = fetch("https://cortex4.p.rapidapi.com/upload/", {
      method: "POST",
      headers: {'Content-Type': 'application/json', 
      		 'X-RapidAPI-Host': 'cortex4.p.rapidapi.com',
      		 'X-RapidAPI-Key': token},
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

  executeModel(request.url, request.token)
  .then(result => callback({result: result}))
  .catch(err => callback({result: false, err: err.message}));
  
  return true; // needed to make the content script wait for the async processing to complete
});
