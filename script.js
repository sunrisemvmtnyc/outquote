let quote = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
let name = "First Last";
let title = "Position";
let showAttribution = true;
let showTitle = true;
let includeLogo = true;
let centerElements = false;
let useWordmark = false;
let includePhoto = false;
let photoURL = "";

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

/*
 * Correctly wraps the quote text by adding each word, checking if it fits
 * within the given maximum width, and adding a newline if not. After wrapping
 * the text, calculates the height at which it should start to be vertically
 * centered and fills the text.
 */
const wrapText = (context, text, x, maxWidth, lineHeight, canvasHeight) => {
  const grafs = text.split("\n");
  let y = 0;
  const textToFill = [];
  for (let graf of grafs) {
    const words = graf.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        textToFill.push([line, x, y]);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    textToFill.push([line, x, y]);
    y += lineHeight;
  }

  // subtract the last lineHeight and calculate adjusted height to center text
  y -= lineHeight;
  const adjustedHeight = canvasHeight / 2 - y / 2;

  // fill text with adjusted y values
  textToFill.forEach(item => {
    [line, x, y] = [...item];
    context.fillText(line, x, y + adjustedHeight);
  });

  return y;
}

/*
 * This the main function; it goes through all of the various options and
 * renders based on how the user has selected them.
 */
const renderContent = () => {
  // get the container's width to use in sizing calculations
  const container = document.getElementById("container");
  let containerWidth = container.offsetWidth;
  if (containerWidth < 400) {
    // subtract 40 for the container's padding (20px on left and right)
    containerWidth -= 40;
  }
  // the container's max width is 960, so get whichever is smaller
  const MAX_WIDTH = 960;
  containerWidth = Math.min(containerWidth, MAX_WIDTH);

  // resize the canvas based on the selected social media platform
  const canvas = document.getElementById("canvas");
  const size = document.getElementById("canvasSize").selectedIndex;
  canvas.width = SIZES[size][0];
  canvas.height = SIZES[size][1];

  // calculate the amount we should transform by
  let aspect = containerWidth / canvas.width;
  // on desktop, reduce the size of insta posts/stories so they're not so tall
  if (containerWidth > 700 && containerWidth < canvas.height) {
    aspect /= 2;
    aspect *= (canvas.width / canvas.height);
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
  const gradient = quoteCtx.createLinearGradient(
    canvas.width / 2, 0, canvas.width / 2, canvas.height);
  if (hasGradient) {
    gradient.addColorStop(0, GRADIENT[0]);
    gradient.addColorStop(0.5, GRADIENT[1]);
    gradient.addColorStop(1, GRADIENT[2]);
  }
  quoteCtx.fillStyle = hasGradient ? gradient : BACKGROUNDS[scheme];
  quoteCtx.fillRect(BORDERS[size],
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
  wrapText(
    quoteCtx,
    "\“" + quote + "\”",
    centerElements ? canvas.width / 2 : MARGINS[size],
    canvas.width - MARGINS[size] * 2,
    FONT_SIZE[size] + 10,
    canvas.height
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

    const nameLength = showTitle ?
      nameCtx.measureText(name + " | ").width :
      nameCtx.measureText(name).width;
    const titleLength = titleCtx.measureText(title).width;

    const centerPos = showTitle ?
      canvas.width / 2 - nameLength / 2 - titleLength / 2 :
      canvas.width / 2 - nameLength / 2;
    const nameCtxX = centerElements ? centerPos : MARGINS[size];
    const titleCtxX = nameLength + nameCtxX;
    const yPos = canvas.height - MARGINS[size] - BORDERS[size];

    // fill name text
    nameCtx.fillStyle = TEXT_COLORS[scheme];
    nameCtx.fillText(showTitle ? name + " | " : name, nameCtxX, yPos);

    // fill title text
    if (showTitle) {
      titleCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
      titleCtx.fillText(title, titleCtxX, yPos);
    }
	}
}

window.setTimeout(function() {
  renderContent();
}, 700);

document.getElementById("quoteBox").oninput = function() {
  quote = this.value;

  // Convert all quotes to curly quotes
  quote = quote.replace(/\b'/g, "\’");
  quote = quote.replace(/'(?=\d)/g, "\’");
  quote = quote.replace(/'(?=\b|$)/g, "\‘");
  quote = quote.replace(/\b"/g, "\”");
  quote = quote.replace(/"(?=\w|$)/g, "\“");
  renderContent();
}

document.getElementById("quoteAttr").oninput = function() {
  name = this.value;
  renderContent();
}

document.getElementById("quoteTitle").oninput = function() {
  title = this.value;
  renderContent();
}

document.getElementById("saveButton").addEventListener("click", function() {
  const dataURL = canvas.toDataURL("image/png");
  const data = atob(dataURL.substring("data:image/png;base64,".length)),
    asArray=new Uint8Array(data.length);
  for (let i = 0, len = data.length; i < len; ++i) {
    asArray[i] = data.charCodeAt(i);
  }
  const blob = new Blob([asArray.buffer], {
    type: "image/png"
  });
  saveAs(blob, "quote.png");
});

// EVENT HANDLERS

// Resize window
window.addEventListener("resize", renderContent);

// Change selected canvas size
const canvasSize = document.getElementById("canvasSize");
canvasSize.addEventListener("change", renderContent);

// Toggle attribution
const toggleAttrCheckbox = document.getElementById("toggleAttribution");
toggleAttrCheckbox.addEventListener("click", function() {
	showAttribution = !showAttribution;
	renderContent();
});

// Toggle attribution title
const toggleAttrTitleCheckbox = document.getElementById("toggleAttributionTitle");
toggleAttrTitleCheckbox.addEventListener("click", function() {
	showTitle = !showTitle;
  name = document.getElementById("quoteAttr").value || "First Last";
	renderContent();
});

// Toggle center elements
const toggleCenterCheckbox = document.getElementById("centerElements");
toggleCenterCheckbox.addEventListener("click", function() {
	centerElements = !centerElements;
	renderContent();
});

// Change selected background/color scheme
const backgroundColor = document.getElementById("backgroundColor");
backgroundColor.addEventListener("change", renderContent);

// Toggle wordmark
const useWordmarkCheckbox = document.getElementById("useWordmark");
useWordmarkCheckbox.addEventListener("click", function() {
  useWordmark = !useWordmark;
	renderContent();
});

// Include logo
const toggleLogoCheckbox = document.getElementById("toggleLogo");
toggleLogoCheckbox.addEventListener("click", function() {
  includeLogo = !includeLogo;
  renderContent();
});
