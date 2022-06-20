const DEBUG = 1;
if (!DEBUG) console.log = () => {};

let isScrolling;
let images = [...document.getElementsByTagName('img')];

function clasifyImages() {  [...images, ...document.getElementsByTagName('img')].unique().filter(validImage).forEach(analyzeImage);  
}

function validImage(image) {
  const valid = image.src &&
        image.width > 64 && image.height > 64
  return valid;
}

function analyzeImage(image) {

  chrome.runtime.sendMessage({url: image.src}, response => {

    if (response){

var rect = image.getBoundingClientRect();

canvas = document.getElementById("canvas" + image.src);

canvas_exists = false
if (canvas)
{canvas_exists = true}
else
{
canvas = document.createElement('canvas');
canvas.id = "canvas" + image.src;
}
canvas.style.zIndex = 1000;
canvas.width = image.width;
canvas.height = image.height;
canvas.style.top = rect.top + window.scrollY + "px"
canvas.style.bottom = rect.bottom + window.scrollY + "px"
canvas.style.left = rect.left + "px"
canvas.style.right = rect.right + "px"

//
canvas.style.position = "absolute";

var ctx = canvas.getContext("2d");
ctx.beginPath();
if (response.result.object_analysis)
if (response.result.object_analysis[0])
for (let i = 0; i < response.result.object_analysis[0].length; i++) {
if (response.result.object_analysis[0][i].classname == 'cat')
{

max_wh = Math.max(image.width, image.height)

x1 = response.result.object_analysis[0][i].x1*max_wh/416;
y1 = response.result.object_analysis[0][i].y1*max_wh/416;
x2 = response.result.object_analysis[0][i].x2*max_wh/416;
y2 = response.result.object_analysis[0][i].y2*max_wh/416;

if (image.height > image.width)
{
x1 = x1 - (image.height - image.width)/2;
x2 = x2 - (image.height - image.width)/2;
}

if (image.width > image.height)
{
y1 = y1 - (image.width - image.height)/2;
y2 = y2 - (image.width - image.height)/2;
}

x1 = Math.max(0, x1)
y1 = Math.max(0, y1)

x2 = Math.min(x2, image.width)
y2 = Math.min(y2, image.height)

console.log("coordinates", x1, y1, x2, y2)
console.log("coordinates", x1, y1, x2, y2)
x = x1
y = y1
w = x2 - x1;
h = y2 - y1;

  ctx.rect(x, y, w, h);


ctx.strokeStyle = 'blue';
ctx.font = "30px Arial";
ctx.fillText("cat", x+10, y+30);

}
  
}

ctx.lineWidth = 10;

ctx.stroke();

if (canvas_exists == false)
{
var body = document.getElementsByTagName("body")[0];
body.appendChild(canvas);
}

//canvas.appendChild(image)
console.log(image)
console.log(response)

    }
  });
}

window.addEventListener("resize", (images)=>{ 
  clearTimeout(isScrolling);
  isScrolling = setTimeout(()=>{clasifyImages()}, 500);
});


document.addEventListener("scroll", (images)=>{ 
  clearTimeout(isScrolling);
  isScrolling = setTimeout(()=>{clasifyImages()}, 500);
});

Array.prototype.unique = function() {
  return this.filter(function (value, index, self) { 
    return self.indexOf(value) === index;
  });
}

clasifyImages();

// Some images can be dynamically loaded after the page is ready.
// We track those with a MutationObserver on the document body.

/**
const onmutation = (mutations) => {
  for (let mutation of mutations) {
    const images = [...mutation.addedNodes]
      .filter(node => node.nodeType === 1) // 1 = element
      .map(node => {
        if (node.tagName === 'IMG') {
          return [node];
        } else {
          const nodes = node.getElementsByTagName('img');
          if (nodes.length > 0) {
            return [...nodes];
          } else {
            return [];
          }
        }
      })
      .flat();

    console.log('Page contains %d new images', images.length);
    images.filter(validImage).forEach(analyzeImage);
  }
};

const observer = new MutationObserver(onmutation);
const config = { attributes: false, childList: true, subtree: true };
observer.observe(document.body, config);
*/
