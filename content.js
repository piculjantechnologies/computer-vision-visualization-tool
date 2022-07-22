const DEBUG = 1;
if (!DEBUG) console.log = () => {};

let isScrolling;
let images = [document.getElementsByTagName('img')];

let prev_sent = []
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

    images.filter(validImage).forEach((image) => {
        if (!prev_sent.includes(image)) {
            prev_sent.push(image);
            analyzeImage(image);
        }
    });
}

function validImage(image) {
    return image.src && image.width > 64 && image.height > 64;
}

function analyzeImage(image) {
    chrome.runtime.sendMessage({url: image.src}, response => {
        if (response){

            let canvases = [undefined, undefined, undefined]
            let contexts = [undefined, undefined, undefined]
            let existing = [false, false, false]

            if (response.result.object_analysis) {
                if (response.result.object_analysis[0] && response.result.object_analysis[0].length) {
                    let c = document.getElementById("canvas" + image.src)
                    if (c) existing[0] = true;
                    canvases[0] = document.createElement('canvas')
                    canvases[0].id = "canvas" + image.src;
                }
            }

            if (response.result.face_analysis) {
                if (response.result.face_analysis[0] && response.result.face_analysis[0].length) {
                    let c = document.getElementById("facecanvas" + image.src)
                    if (c) existing[1] = true;
                    canvases[1] = document.createElement('canvas')
                    canvases[1].id = "facecanvas" + image.src
                }
            }

            if (response.result.pose_estimation_analysis) {
                if (response.result.pose_estimation_analysis[0] && response.result.pose_estimation_analysis[0].length) {
                    let c = document.getElementById("posecanvas" + image.src)
                    if (c) existing[2] = true;
                    canvases[2] = document.createElement('canvas')
                    canvases[2].id = "posecanvas" + image.src
                }
            }

            let rect = image.getBoundingClientRect();

            for (let i = 0; i < canvases.length; i++) {
                let canvas = canvases[i]
                if (canvas) {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    canvas.style.position = "absolute";
                    canvas.style.left = rect.x + "px";
                    canvas.style.top = rect.y + "px";
                    canvas.style.cursor = "pointer";
                    canvas.style.zIndex = "1";

                    canvas.style.display = "inline-block"
                    if (i !== 0) canvas.style.display = "none"

                    contexts[i] = canvas.getContext("2d")
                }
            }

            if (response.result.object_analysis) {
                if (response.result.object_analysis[0]) {
                    for (let i = 0; i < response.result.object_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.object_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx = contexts[0]
                        ctx.beginPath();
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);  // x1, y1, width, height

                        let classname = response.result.object_analysis[0][i].classname;
                        let color = colors[classes.indexOf(classname)]
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

                        ctx = contexts[1]
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

                        ctx = contexts[2]
                        ctx.beginPath()
                        ctx.moveTo(x1, y1)
                        ctx.lineTo(x2, y2)
                        ctx.strokeStyle = "blue"
                        ctx.lineWidth = 5
                        ctx.stroke()
                    }
                }
            }

            for (let i = 0; i < canvases.length; i++) if (!existing[i] && canvases[i]) image.parentElement.appendChild(canvases[i])

            // toggle between canvases with two buttons
            canvases = canvases.filter((c) => c !== undefined)
            let total = canvases.length
            let active = 0

            if (total > 1) {
                let button_right = document.createElement('button')
                button_right.style.width = "36px"
                button_right.style.minWidth = "36px"
                button_right.style.height = "36px"
                button_right.style.minHeight = "36px"
                button_right.style.position = "absolute"
                button_right.style.top = Math.floor(1 * (canvases[0].height - 36) / 2) + "px"
                button_right.style.zIndex = "3"
                button_right.style.padding = "0";
                button_right.style.borderRadius = "16px"

                let button_left = button_right.cloneNode()
                button_left.style.left = 0 + "px"
                button_right.style.left = canvases[0].width -36 + "px"

                let image_right = document.createElement('img')
                image_right.style.width = "32px"
                image_right.style.height = "32px"
                image_right.src = chrome.runtime.getURL('resources/next.png')

                let image_left = image_right.cloneNode()
                image_left.style.transform = "rotate(180deg)"

                button_left.appendChild(image_left)
                button_right.appendChild(image_right)
                image.parentElement.appendChild(button_left)
                image.parentElement.appendChild(button_right)

                image_left.addEventListener("click", (e) => {
                    canvases[active].style.display = "none"
                    if (active > 0) active -= 1
                    else if (active == 0) active = total - 1
                    canvases[active].style.display = "inline-block"
                    e.stopPropagation()
                    e.preventDefault()
                    return false
                })

                image_right.addEventListener("click", (e) => {
                    canvases[active].style.display = "none"
                    if (active < total - 1) active += 1
                    else if (active === total - 1) active = 0
                    canvases[active].style.display = "inline-block"
                    e.stopPropagation()
                    e.preventDefault()
                    return false
                })
            }
        }
    });
}

window.addEventListener("resize", (images)=>{

    let canvases = document.getElementsByTagName("canvas")
    for (let c of canvases) {
        c.style.top = 0 + "px"
        c.style.left = 0 + "px"
    }

    clearTimeout(isScrolling);
    isScrolling = setTimeout(()=>{classifyImages()}, 500);
});


document.addEventListener("scroll", (images)=>{

    let canvases = document.getElementsByTagName("canvas")
    for (let c of canvases) {
        c.style.top = 0 + "px"
        c.style.left = 0 + "px"
    }

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
                if (nodes.length > 0) return [...nodes];
                else return [];
            }
        })
        .flat();

        // console.log('Page contains %d new images', images.length);
        // images.filter(validImage).forEach(analyzeImage);

        images.filter(validImage).forEach((image) => {
            if (!prev_sent.includes(image)) {
                prev_sent.push(image);
                analyzeImage(image);
            }
        });
    }
};

const observer = new MutationObserver(onmutation);
const config = { attributes: false, childList: true, subtree: true };
observer.observe(document.body, config);
*/
