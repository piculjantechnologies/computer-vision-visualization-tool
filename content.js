const DEBUG = 1;
if (!DEBUG) console.log = () => {};

let isScrolling;
let images = [document.getElementsByTagName('img')];
let anchor_parents = []

let classes = ["person","bicycle","car","motorbike","aeroplane","bus","train","truck","boat","traffic light","fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow","elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee","skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle","wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza","donut","cake","chair","sofa","pottedplant","bed","diningtable","toilet","tvmonitor","laptop","mouse","remote","keyboard","cell phone","microwave","oven","toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush"]

let no_of_classes = classes.length
let total_colors = Math.pow(255, 3) - 1
colors = []
for (let i = 0; i < no_of_classes; i++) {
    let this_color = parseInt(total_colors / no_of_classes) * i;

    let r = Math.floor(this_color / Math.pow(255, 2))
    let g = Math.floor((this_color % Math.pow(255, 2)) / 255)
    let b = this_color % 255

    colors.push([r, g, b])
}

function extractCoordinates(image, structure) {
    let max_wh = Math.max(image.width, image.height)
    let x1 = structure.x1 * max_wh/416;
    let x2 = structure.x2 * max_wh/416;
    let y1 = structure.y1 * max_wh/416;
    let y2 = structure.y2 * max_wh/416;
    if (image.height > image.width) {
        x1 = x1 - (image.height - image.width)/2;
        x2 = x2 - (image.height - image.width)/2;
    }
    if (image.width > image.height) {
        y1 = y1 - (image.width - image.height)/2;
        y2 = y2 - (image.width - image.height)/2;
    }
    x1 = Math.max(0, x1)
    y1 = Math.max(0, y1)
    x2 = Math.min(x2, image.width)
    y2 = Math.min(y2, image.height)
    return [x1, y1, x2, y2]
}

function classifyImages() {
    images = [...images, ...document.getElementsByTagName('img')].unique();

    /*
    anchor_parents = []
    for (let i of images) {
        console.log("image try", i);
        let parentElement = i.parentElement;
        let counter = 3;
        while (parentElement.nodeName !== "A") {
            if (counter) {
                parentElement = parentElement.parentElement;
                counter--;
            }
            else break;
        }
        if (parentElement.nodeName === "A") anchor_parents.push(parentElement);
        else anchor_parents.push(null);
    }
     */

    images.filter(validImage).forEach(analyzeImage);
}

function validImage(image) {
  return image.src && image.width > 64 && image.height > 64;
}

function analyzeImage(image) {
    chrome.runtime.sendMessage({url: image.src}, response => {
        if (response){
            let image_parent = image.parentElement;
            while (image_parent.tagName !== "A") image_parent = image_parent.parentElement;

            let rect = image.getBoundingClientRect();

            let canvas = document.getElementById("canvas" + image.src);
            let canvas_exists = false
            if (canvas) canvas_exists = true
            else {
                canvas = document.createElement('canvas');
                canvas.id = "canvas" + image.src;
            }

            canvas.style.zIndex = 1;
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.style.top = rect.top + window.scrollY + "px"
            canvas.style.bottom = rect.bottom + window.scrollY + "px"
            canvas.style.left = rect.left + "px"
            canvas.style.right = rect.right + "px"
            canvas.style.position = "absolute";
            canvas.style.cursor = "pointer";
            canvas.onclick = () => {
                console.log("clicked")
            }

            let ctx = canvas.getContext("2d");

            if (response.result.object_analysis) {
                if (response.result.object_analysis[0]) {
                    console.log(response.result)
                    for (let i = 0; i < response.result.object_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.object_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx.beginPath();
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);  // x1, y1, width, height

                        let classname = response.result.object_analysis[0][i].classname;
                        color = colors[classes.indexOf(classname)]
                        ctx.strokeStyle = `rgb(
                            ${color[0]},
                            ${color[1]},
                            ${color[2]}
                        )`

                        ctx.font = "30px Arial";
                        ctx.fillText(classname, x1, y1);
                        ctx.lineWidth = 5;
                        ctx.stroke();
                    }
                }
            }

            if (response.result.face_analysis) {
                if (response.result.face_analysis[0]) {
                    for (let i = 0; i < response.result.face_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.face_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx.beginPath();
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);  // x1, y1, width, height

                        ctx.strokeStyle = "red";
                        ctx.font = "30px Arial";
                        ctx.fillText("face", x1, y1);
                        ctx.lineWidth = 5;
                        ctx.stroke();
                    }
                }
            }

            if (response.result.pose_estimation_analysis) {
                if (response.result.pose_estimation_analysis[0]) {
                    for (let i = 0; i < response.result.pose_estimation_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.pose_estimation_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx.beginPath()
                        ctx.moveTo(x1, y1)
                        ctx.lineTo(x2, y2)
                        ctx.strokeStyle = "blue"
                        ctx.lineWidth = 5
                        ctx.stroke()
                    }
                }
            }

            if (canvas_exists === false) {
                var body = document.getElementsByTagName("body")[0];
                body.appendChild(canvas);
            }
        }
    });
}

window.addEventListener("resize", (images)=>{ 
  clearTimeout(isScrolling);
  isScrolling = setTimeout(()=>{classifyImages()}, 500);
});


document.addEventListener("scroll", (images)=>{ 
  clearTimeout(isScrolling);
  isScrolling = setTimeout(()=>{classifyImages()}, 500);
});


Array.prototype.unique = function() {
  return this.filter(function (value, index, self) { 
    return self.indexOf(value) === index;
  });
}

classifyImages();



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
