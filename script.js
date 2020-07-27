let quote = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
let name = "First Last";
let title = "Title";
let showAttribution = true;
let showTitle = true;
let includeLogo = true;
let centerElements = false;
let useWordmark = false;

const PRIMARY = "#FFDE16";
const BACKGROUNDS = ["#33342E", "gradient"];
const GRADIENT = ["#EF4C39", "#FD9014", "#FFDE16"];
const TEXT_COLORS = ["#FFDE16", "#33342E"]
const LOGOS = ["logos/logo-yellow.svg", "logos/logo-gray.svg"];
const TEXT_LOGOS = ["logos/text-yellow.svg", "logos/text-gray.svg"];
const LOGO_HEIGHT = [160, 160, 80]
const FONT_SIZE = [60, 80, 40];
const SIZES = [
  [1080, 1080], // instagram post
  [1080, 1920], // instagram story
  [1280, 640] // twitter/facebook
];
const BORDERS = [25, 25, 10];
const MARGINS = [100, 100, 50];
const MAX_CONTAINER_WIDTH = 960;

/*
 * Correctly wraps the quote text by adding each word, checking if it fits
 * within the given maximum width, and adding a newline if not. After wrapping
 * the text, calculates the height at which it should start to be vertically
 * centered and fills the text. This method can also vertically center the text
 * (used for quote fill but not attribution fill).
 */
const wrapText = (context, text, maxW, maxH, lineH, x, y, vCenter) => {
  const grafs = text.split("\n");
  const textToFill = [];
  for (let graf of grafs) {
    const words = graf.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = context.measureText(testLine);
      if (metrics.width > maxW && n > 0) {
        textToFill.push([line, x, y]);
        line = words[n] + " ";
        y += lineH;
      } else {
        line = testLine;
      }
    }
    textToFill.push([line, x, y]);
    y += lineH;
  }

  // subtract the last line height and calculate adjusted height to center text
  y -= lineH;
  const adjustedHeight = vCenter ? (maxH - y) / 2 : 0;

  // fill text with adjusted y values
  textToFill.forEach(item => {
    [line, x, y] = [...item];
    context.fillText(line, x, y + adjustedHeight);
  });
}

/*
 * This the main function; it goes through all of the various options and
 * renders based on how the user has selected them.
 */
const render = () => {
  // get the container's width to use in sizing calculations
  let containerWidth = document.getElementById("container").offsetWidth;
  if (containerWidth < 400) {
    // subtract 40 for the container's padding (20px on left and right)
    containerWidth -= 40;
  }
  // the container's max width is 960, so get whichever is smaller
  containerWidth = Math.min(containerWidth, MAX_CONTAINER_WIDTH);

  // resize the canvas based on the selected social media platform
  const canvas = document.getElementById("canvas");
  const size = document.getElementById("canvasSize").selectedIndex;
  canvas.width = SIZES[size][0];
  canvas.height = SIZES[size][1];

  // calculate the amount we should transform by
  let aspect = containerWidth / canvas.width;
  // on desktop, reduce the size of insta posts/stories so they're not so tall
  if (containerWidth > 700 && containerWidth < canvas.height) {
    aspect *= 0.5 * canvas.width / canvas.height;
  }
  canvas.style.transform = `scale(${aspect})`;

  // adjust the size of the canvas's container so we don't get any extra scroll
  const canvasRow = document.getElementById("canvasRow");
  canvasRow.style.width = `${canvas.width * aspect}px`;
  canvasRow.style.height = `${canvas.height * aspect}px`;

  // the background drop down is used to determine the color scheme
  const scheme = document.getElementById("backgroundColor").selectedIndex;
  const hasGradient = BACKGROUNDS[scheme] == "gradient";

  // use the primary color for the outline
  const quoteCtx = canvas.getContext("2d");
  quoteCtx.fillStyle = PRIMARY;
  quoteCtx.fillRect(0, 0, canvas.width, canvas.height);

  // then fill the background with the selection
  const half = canvas.width / 2;
  const gradient = quoteCtx.createLinearGradient(half, 0, half, canvas.height);
  if (hasGradient) {
    gradient.addColorStop(0, GRADIENT[0]);
    gradient.addColorStop(0.5, GRADIENT[1]);
    gradient.addColorStop(1, GRADIENT[2]);
  }
  quoteCtx.fillStyle = hasGradient ? gradient : BACKGROUNDS[scheme];
  quoteCtx.fillRect(
    BORDERS[size],
    BORDERS[size],
    canvas.width - BORDERS[size] * 2,
    canvas.height - BORDERS[size] * 2
  );

  quoteCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
  quoteCtx.fillStyle = TEXT_COLORS[scheme];

  if (centerElements) {
    quoteCtx.textAlign = "center";
  }

  // render quote text
  const LINE_H = FONT_SIZE[size] + 10;
  const MAX_W = canvas.width - MARGINS[size] * 2;
  const MAX_H = canvas.height;
  wrapText(
    quoteCtx,
    "\“" + quote + "\”",
    MAX_W,
    MAX_H,
    LINE_H,
    centerElements ? half : MARGINS[size],
    0,
    true
  );

  // load logo
  if (includeLogo) {
    const image = new Image();
    image.onload = () => {
      const height = useWordmark ? LOGO_HEIGHT[size] * 0.7 : LOGO_HEIGHT[size];
      const width = height * (image.width / image.height);
      const xPos = centerElements ?
        (canvas.width - width) / 2 :
        canvas.width - width - MARGINS[size];
      quoteCtx.drawImage(image, xPos, MARGINS[size], width, height);
    }
    image.src = useWordmark ? TEXT_LOGOS[scheme] : LOGOS[scheme];
  }

  if (showAttribution) {
    quoteCtx.textAlign = "left"; // makes below calculations work
    const nameCtx = canvas.getContext("2d");
    const titleCtx = canvas.getContext("2d");

    // set the nameCtx font to get correct width measurement
    nameCtx.font = `700 ${FONT_SIZE[size]}px source sans pro`;
    nameCtx.fillStyle = TEXT_COLORS[scheme];

    let nameText = showTitle ? name + " | " : name;
    const nameLength = nameCtx.measureText(nameText).width;
    const titleLength = showTitle ? titleCtx.measureText(title).width : 0;

    // if the attribution and/or title are more than one line, adjust positions
    const lines = Math.floor((nameLength + titleLength) / MAX_W);
    const xPos = centerElements ? half : MARGINS[size];
    const yPos = canvas.height - MARGINS[size] - lines * LINE_H;

    if (centerElements) {
      nameCtx.textAlign = "center";
      titleCtx.textAlign = "center";
      // TODO: this is a bit hacky and on really long text doesn't quite work
      // (the reason is because spaces break differently on the lines than text)
      const count = Math.round(titleLength / nameCtx.measureText(" ").width);
      nameText += " ".repeat(count);
    }

    // fill name text
    wrapText(nameCtx, nameText, MAX_W, MAX_H, LINE_H, xPos, yPos, false);

    // fill title text
    if (showTitle) {
      titleCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
      // TODO: this is a bit hacky right now
      const count = Math.round(nameLength / titleCtx.measureText(" ").width);
      const text = " ".repeat(count) + title;
      wrapText(titleCtx, text, MAX_W, MAX_H, LINE_H, xPos, yPos, false);
    }
  }
}

window.setTimeout(render, 700);

document.getElementById("quoteBox").oninput = function() {
  quote = this.value;

  // Convert all quotes to curly quotes
  quote = quote.replace(/\b'/g, "\’");
  quote = quote.replace(/'(?=\d)/g, "\’");
  quote = quote.replace(/'(?=\b|$)/g, "\‘");
  quote = quote.replace(/\b"/g, "\”");
  quote = quote.replace(/"(?=\w|$)/g, "\“");
  render();
}

document.getElementById("quoteAttr").oninput = function() {
  name = this.value;
  render();
}

document.getElementById("quoteTitle").oninput = function() {
  title = this.value;
  render();
}

document.getElementById("saveButton").addEventListener("click", function() {
  const dataURL = canvas.toDataURL("image/png");
  const data = atob(dataURL.substring("data:image/png;base64,".length));
  const asArray = new Uint8Array(data.length);
  for (let i = 0; i < data.length; ++i) {
    asArray[i] = data.charCodeAt(i);
  }
  const blob = new Blob([asArray.buffer], {type: "image/png"});
  saveAs(blob, "quote.png");
});

// EVENT HANDLERS

// Resize window
window.addEventListener("resize", render);

// Change selected canvas size
document.getElementById("canvasSize").addEventListener("change", render);

// Toggle attribution
document.getElementById("toggleAttribution").addEventListener("click", () => {
  showAttribution = !showAttribution;
  render();
});

// Toggle attribution title
document.getElementById("toggleTitle").addEventListener("click", () => {
  showTitle = !showTitle;
  name = document.getElementById("quoteAttr").value || "First Last";
  render();
});

// Toggle center elements
document.getElementById("centerElements").addEventListener("click", () => {
  centerElements = !centerElements;
  render();
});

// Change selected background/color scheme
document.getElementById("backgroundColor").addEventListener("change", render);

// Toggle wordmark
document.getElementById("useWordmark").addEventListener("click", () => {
  useWordmark = !useWordmark;
  render();
});

// Include logo
document.getElementById("toggleLogo").addEventListener("click", () => {
  includeLogo = !includeLogo;
  render();
});
