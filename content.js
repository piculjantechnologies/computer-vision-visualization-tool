const DEBUG = 1;
if (!DEBUG) console.log = () => {};

let isScrolling;
let images = [document.getElementsByTagName('img')];


// Array which stores all images previously sent to the server. Used to ensure no image is sent twice
let prev_sent = []
let classes = ["person","bicycle","car","motorbike","aeroplane","bus","train","truck","boat","traffic light","fire hydrant","stop sign","parking meter","bench","bird","cat","dog","horse","sheep","cow","elephant","bear","zebra","giraffe","backpack","umbrella","handbag","tie","suitcase","frisbee","skis","snowboard","sports ball","kite","baseball bat","baseball glove","skateboard","surfboard","tennis racket","bottle","wine glass","cup","fork","knife","spoon","bowl","banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza","donut","cake","chair","sofa","pottedplant","bed","diningtable","toilet","tvmonitor","laptop","mouse","remote","keyboard","cell phone","microwave","oven","toaster","sink","refrigerator","book","clock","vase","scissors","teddy bear","hair drier","toothbrush"]

let no_of_classes = classes.length
let total_colors = Math.pow(255, 3) - 1


// Each class gets its own color by spliting the color wheel into no_of_classes RGB colors.
colors = []
for (let i = 0; i < no_of_classes; i++) {
    let this_color = parseInt(total_colors / no_of_classes) * i;

    let r = Math.floor(this_color / Math.pow(255, 2))
    let g = Math.floor((this_color % Math.pow(255, 2)) / 255)
    let b = this_color % 255

    colors.push([r, g, b])
}


/**
 * Match object recognition coordinates to those of its corresponding image.
 * @param {Element} image       Image that was analysed
 * @param {Object} structure    Object recognition data
 * @returns {Array}             4-element array with relative coordinates
 */
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


/**
 * Function to collect all unanalysed images and send them to the server for analysis.
 */
function classifyImages() {
    images = [...images, ...document.getElementsByTagName('img')].unique();

    images.filter(validImage).forEach((image) => {
        if (!prev_sent.includes(image)) {
            prev_sent.push(image);
            analyzeImage(image);
        }
    });
}


/**
 * Determine if image is considered valid for analysis.
 * @param {Element} image 
 * @returns {Boolean}
 */
function validImage(image) {
    return image.src && image.width > 64 && image.height > 64;
}


/**
 * Add all necessary styles to canvas.
 * @param {Element} canvas      Empty canvas element
 * @param {Element} image       Image that was analysed
 * @param {Boolean} noneFlag    Set canvas display property to none
 * @returns {Element}           Initialized canvas
 */
function canvasInit(canvas, image, noneFlag) {
    canvas.width = image.width;
    canvas.height = image.height;

    let computedStyles = window.getComputedStyle(image)
    let marginLeft = computedStyles.getPropertyValue('margin-left')
    let marginTop = computedStyles.getPropertyValue('margin-top')

    // Force parent element to establish a formatting context
    // Otherwise, position: absolute; has different effects
    image.parentElement.style.position = "relative"

    canvas.style.position = "absolute";
    canvas.style.left = marginLeft;
    canvas.style.top = marginTop;
    canvas.style.cursor = "pointer";
    canvas.style.zIndex = "1";
    canvas.style.display = "inline-block"
    if (noneFlag) canvas.style.display = "none"
    return canvas
}


/**
 * Send image over to analysis and inject analysis data into HTML.
 * @param {Element} image   Image to be analysed
 */
function analyzeImage(image) {
    chrome.runtime.sendMessage({url: image.src}, response => {
        if (response) {

            let canvases = [undefined, undefined, undefined]
            let existing = [false, false, false]

            if (response.result.object_analysis) {
                if (response.result.object_analysis[0] && response.result.object_analysis[0].length) {

                    if (document.getElementById("canvas" + image.src)) existing[0] = true;
                    canvases[0] = document.createElement('canvas')
                    canvases[0].id = "canvas" + image.src;
                    canvases[0] = canvasInit(canvases[0], image, false)
                    const ctx = canvases[0].getContext("2d")

                    for (let i = 0; i < response.result.object_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.object_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx.beginPath();
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);

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
                if (response.result.face_analysis[0] && response.result.face_analysis[0].length) {

                    if (document.getElementById("facecanvas" + image.src)) existing[1] = true;
                    canvases[1] = document.createElement('canvas')
                    canvases[1].id = "facecanvas" + image.src
                    canvases[1] = canvasInit(canvases[1], image, true)
                    const ctx = canvases[1].getContext("2d")

                    for (let i = 0; i < response.result.face_analysis[0].length; i++) {

                        let coordinates = extractCoordinates(image, response.result.face_analysis[0][i])
                        let x1 = coordinates[0], y1 = coordinates[1], x2 = coordinates[2], y2 = coordinates[3]

                        ctx.beginPath();
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);

                        ctx.strokeStyle = "red";
                        ctx.font = "30px Arial";
                        ctx.fillText("face", x1, y1);
                        ctx.lineWidth = 5;
                        ctx.stroke();
                    }
                    
                }
            }

            if (response.result.pose_estimation_analysis) {
                if (response.result.pose_estimation_analysis[0] && response.result.pose_estimation_analysis[0].length) {

                    if (document.getElementById("posecanvas" + image.src)) existing[2] = true;
                    canvases[2] = document.createElement('canvas')
                    canvases[2].id = "posecanvas" + image.src
                    canvases[2] = canvasInit(canvases[2], image, true)
                    const ctx = canvases[2].getContext("2d")

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

            for (let i = 0; i < canvases.length; i++) if (!existing[i] && canvases[i]) image.parentElement.appendChild(canvases[i])

            // toggle between canvases with two buttons
            canvases = canvases.filter(c => c !== undefined)
            let total = canvases.length
            let active = 0

            if (total > 1) {

                let marginLeft = canvases[0].parentElement.style.marginLeft
                let marginRight = canvases[0].parentElement.style.marginRight
                if (marginLeft !== "") marginLeft = parseInt(marginLeft.split('px')[0])
                if (marginRight !== "") marginRight = parseInt(marginRight.split('px')[0])

                const button = document.createElement('button')
                button.style.width = "32px"
                button.style.minWidth = "32px"
                button.style.height = "32px"
                button.style.minHeight = "32px"
                button.style.position = "absolute"
                button.style.top = Math.floor(1 * (image.height - 32) / 2) + "px"
                button.style.zIndex = "3"
                button.style.padding = "0";
                button.style.borderRadius = "14px"

                let button_left = button.cloneNode()
                let button_right = button.cloneNode()

                let left = 0
                if (marginLeft !== "") left -= marginLeft
                let right = image.width - 32
                if (marginRight !== "") right += marginRight
                button_left.style.left = left + "px"
                button_right.style.left = right + "px"

                let image_right = document.createElement('img')
                image_right.style.width = "28px"
                image_right.style.height = "28px"
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

["resize", "scroll"].forEach(e => window.addEventListener(e, () => {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => { classifyImages() }, 500);
}))

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
