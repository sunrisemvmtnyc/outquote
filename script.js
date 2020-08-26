let quote = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
let name = "First Last";
let title = "Title";
let showAttribution = true;
let showTitle = true;
let includeLogo = true;
let splitAttribution = false;
let centerElements = false;
let insetLogo = false;
let includeSunrays = false;
let useBackgroundImage = false;
let selectedBackgroundImage = 0;

/* CONSTANTS */

const PRIMARY = ["#FFDE16", "#E3EDDF", "#33342E"];
const BACKGROUNDS = [
  ["#33342E"],
  ["#8F0D56", "#EF4C39", "#FD9014"],
  ["#8F0D56", "#EF4C39", "#FD9014", "#FFDE16"]
];
// background photos are named by numbers; update NUM_BGS when adding new photos
const NUM_BGS = 27;
const BG_PHOTOS = [...Array(NUM_BGS).keys()].map(i => {
  const num = `${i+1}`;
  return `bg-photos/${num.padStart(2, "0")}.jpg`;
});
const SUNRAYS = [
  "sunrays/orange.svg"
];
const LOGOS = [
  "logos/national",
  "logos/nyc"
];
const LOGO_SCHEMES = [
  "-yellow.svg",
  "-white.svg",
  "-gray.svg"
];
const LOGO_HEIGHT = [160, 160, 80];
// this logo-specific factor adjusts the height when setting it into the border
const LOGO_INSET_FACTOR = [0.75, 0.85];
const FONT_SIZE = [60, 80, 40];
const SIZES = [
  [1080, 1080], // instagram post
  [1080, 1920], // instagram story
  [1280, 640] // twitter/facebook
];
const BORDERS = [10, 10, 6];
const MARGINS = [100, 100, 60];
const MAX_CONTAINER_WIDTH = 960;

/* FUNCTIONS */

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
  const hasGradient = BACKGROUNDS[scheme].length > 1;

  // fill the background with the selection
  const quoteCtx = canvas.getContext("2d");
  const half = canvas.width / 2;
  const gradient = quoteCtx.createLinearGradient(half, 0, half, canvas.height);
  if (hasGradient) {
    const stops = BACKGROUNDS[scheme].length - 1;
    BACKGROUNDS[scheme].forEach((color, i) => {
      gradient.addColorStop(i / stops, color);
    });
  }
  quoteCtx.fillStyle = hasGradient ? gradient : BACKGROUNDS[scheme];
  quoteCtx.fillRect(0, 0, canvas.width, canvas.height);

  // render elements in the correct order
  renderBackgroundImage([canvas, quoteCtx, scheme, size])
    .then(renderSunrays)
    .then(renderForeground);
}

/*
 * Render the selected background image. This function returns a promise so that
 * we can ensure elements are rendered in the correct order.
 */
const renderBackgroundImage = (args) => {
  [canvas, quoteCtx, scheme, size] = [...args];
  return new Promise(resolve => {
    if (useBackgroundImage) {
      const image = new Image();
      image.onload = () => {
        const imageAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        // scale image based on aspect ratios so it covers the entire background
        const width = canvasAspect > imageAspect ?
          canvas.width :
          canvas.height * imageAspect;
        const height = canvasAspect < imageAspect?
          canvas.height :
          canvas.width * (1 / imageAspect);
        const xPos = (canvas.width - width) / 2;
        const yPos = (canvas.height - height) / 2;
        const blendMode = document.getElementById("blendMode").value;
        quoteCtx.globalCompositeOperation = blendMode;
        quoteCtx.drawImage(image, xPos, yPos, width, height);
        quoteCtx.globalCompositeOperation = "source-over";
        // resolve (draw sunrays) after loading the image
        resolve(args);
      }
      image.src = BG_PHOTOS[selectedBackgroundImage];
    } else {
      resolve(args);
    }
  });
}

/*
 * Render sunrays. This function returns a promise so that we can ensure
 * elements are rendered in the correct order.
 */
const renderSunrays = (args) => {
  return new Promise(resolve => {
    [canvas, quoteCtx, scheme, size] = [...args];
    if (includeSunrays) {
      const image = new Image();
      image.onload = () => {
        const xPos = 0 - canvas.width / 2;
        const yPos = 0 - canvas.height / 4;
        const width = canvas.width * 2;
        const height = canvas.height - yPos * 1.3;
        quoteCtx.drawImage(image, xPos, yPos, width, height);
        // resolve (draw foreground) after loading the image
        resolve(args);
      }
      image.src = SUNRAYS[0];
    } else {
      resolve(args);
    }
  });
}

/*
 * Separating the foreground rendering from the background means that the
 * sunrays won't render over the foreground elements. This renders the border,
 * logo, quote, and attribution.
 */
const renderForeground = (args) => {
  [canvas, quoteCtx, scheme, size] = [...args];
  // draw the border
  quoteCtx.strokeStyle = PRIMARY[scheme];
  quoteCtx.lineWidth = BORDERS[size];
  quoteCtx.beginPath();
  if (insetLogo) {
    quoteCtx.moveTo(canvas.width - MARGINS[size] * 1.5, MARGINS[size] / 2);
    quoteCtx.lineTo(MARGINS[size] / 2, MARGINS[size] / 2);
    quoteCtx.lineTo(MARGINS[size] / 2, canvas.height - MARGINS[size] / 2);
    quoteCtx.lineTo(
      canvas.width - MARGINS[size] / 2,
      canvas.height - MARGINS[size] / 2
    );
    quoteCtx.lineTo(canvas.width - MARGINS[size] / 2, MARGINS[size] * 2);
  } else {
    quoteCtx.rect(
      MARGINS[size] / 2,
      MARGINS[size] / 2,
      canvas.width - MARGINS[size],
      canvas.height - MARGINS[size]
    );
  }
  quoteCtx.stroke();

  quoteCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
  quoteCtx.fillStyle = PRIMARY[scheme];

  if (centerElements) {
    quoteCtx.textAlign = "center";
  }

  // render quote text
  const LINE_H = FONT_SIZE[size] + 10;
  const MAX_W = canvas.width - MARGINS[size] * 2;
  const MAX_H = canvas.height;
  const half = canvas.width / 2;
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
    const logo = document.getElementById("hubLogo").selectedIndex;
    const image = new Image();
    image.onload = () => {
      const height = insetLogo ?
        LOGO_HEIGHT[size] * LOGO_INSET_FACTOR[logo] :
        LOGO_HEIGHT[size];
      const width = height * (image.width / image.height);
      let xPos = canvas.width - width - MARGINS[size];
      if (centerElements) {
        xPos = (canvas.width - width) / 2;
      }
      // inset logo should override center elements
      if (insetLogo) {
        xPos = canvas.width - width - MARGINS[size] / 2;
      }
      const yPos = insetLogo ?
        MARGINS[size] / 2 - BORDERS[size] / 2 :
        MARGINS[size];
      quoteCtx.drawImage(image, xPos, yPos, width, height);
    }
    image.src = LOGOS[logo] + LOGO_SCHEMES[scheme];
  }

  if (showAttribution) {
    quoteCtx.textAlign = "left"; // makes below calculations work
    const nameCtx = canvas.getContext("2d");
    const titleCtx = canvas.getContext("2d");

    // set the nameCtx font to get correct width measurement
    nameCtx.font = `700 ${FONT_SIZE[size]}px source sans pro`;
    nameCtx.fillStyle = PRIMARY[scheme];

    let nameText = showTitle && !splitAttribution ? name + " | " : name;
    const nameLength = nameCtx.measureText(nameText).width;
    const titleLength = showTitle ? titleCtx.measureText(title).width : 0;

    // if the attribution and/or title are more than one line, adjust positions
    const lines = splitAttribution ?
      Math.floor(nameLength / MAX_W) + Math.ceil(titleLength / MAX_W) :
      Math.floor((nameLength + titleLength) / MAX_W);
    const xPos = centerElements ? half : MARGINS[size];
    const yPos = canvas.height - MARGINS[size] - lines * LINE_H;

    if (centerElements) {
      nameCtx.textAlign = "center";
      titleCtx.textAlign = "center";
      if (!splitAttribution) {
        // TODO: this is a bit hacky and on really long text doesn't quite work
        // (the reason is because spaces break differently on the lines than text)
        // could possibly handle this with non-breaking spaces
        const count = Math.round(titleLength / nameCtx.measureText(" ").width);
        nameText += " ".repeat(count);
      }
    }

    // fill name text
    wrapText(nameCtx, nameText, MAX_W, MAX_H, LINE_H, xPos, yPos, false);

    // fill title text
    if (showTitle) {
      titleCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
      if (splitAttribution) {
        const yPosTitle = yPos + LINE_H;
        wrapText(titleCtx, title, MAX_W, MAX_H, LINE_H, xPos, yPosTitle, false);
      } else {
        const count = Math.round(nameLength / titleCtx.measureText(" ").width);
        const text = " ".repeat(count) + title;
        wrapText(titleCtx, text, MAX_W, MAX_H, LINE_H, xPos, yPos, false);
      }
    }
  }
}

/*
 * Creates the row and column structure for thumbnails and populates it with the
 * photos. Also adds the onclick functions that will change the background
 * image used in the graphic.
 */
const createBackgroundImageElements = () => {
  const thumbnails = document.getElementById("thumbnails");
  let row;
  BG_PHOTOS.forEach((photo, i) => {
    if (i % 4 === 0) {
      row = document.createElement("div");
      row.className = "row thumbnail-row";
    }
    const column = document.createElement("div");
    column.className = "three columns center";
    const image = document.createElement("img");
    image.className = "thumbnail";
    image.src = photo;
    image.onclick = () => {
      selectedBackgroundImage = i;
      render();
    }
    column.appendChild(image);
    row.appendChild(column);
    // if we've already added the four columns, append the row
    if (i % 4 === 3) {
      thumbnails.appendChild(row);
    }
  });
  // append the last row if we didn't get it within the loop
  if (BG_PHOTOS.length-1 % 4 !== 3) thumbnails.appendChild(row);
}

/* EVENT HANDLERS */

// Type in the quote box
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

// Type in the attribution box
document.getElementById("quoteAttr").oninput = function() {
  name = this.value;
  render();
}

// Type in the title box
document.getElementById("quoteTitle").oninput = function() {
  title = this.value;
  render();
}

// Save the image
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

// Resize window
window.addEventListener("resize", render);

// FORMATTING

// Change selected canvas size
document.getElementById("canvasSize").addEventListener("change", render);

// Toggle center elements
document.getElementById("centerElements").addEventListener("click", () => {
  centerElements = !centerElements;
  render();
});

// Toggle split attribution
document.getElementById("splitAttribution").addEventListener("click", () => {
  splitAttribution = !splitAttribution;
  render();
});

// Toggle inset logo
document.getElementById("insetLogo").addEventListener("click", () => {
  insetLogo = !insetLogo;
  render();
});

// STYLE

// Change selected background/color scheme
document.getElementById("backgroundColor").addEventListener("change", render);

// Toggle including sunrays
document.getElementById("includeSunrays").addEventListener("click", () => {
  includeSunrays = !includeSunrays;
  render();
});

// Toggle using background image
document.getElementById("useBackgroundImage").addEventListener("click", () => {
  useBackgroundImage = !useBackgroundImage;
  document.getElementById("thumbnailsContainer").style.display =
    useBackgroundImage ? "block" : "none";
  document.getElementById("blendMode").disabled = !useBackgroundImage;
  render();
});

// Change selected blend mode
document.getElementById("blendMode").addEventListener("change", render);

// ELEMENTS

// Toggle attribution
document.getElementById("toggleAttribution").addEventListener("click", () => {
  showAttribution = !showAttribution;
  document.getElementById("splitAttribution").disabled = !showAttribution;
  document.getElementById("toggleTitle").disabled = !showAttribution;
  // make sure attribution title follows suit with attribution
  document.getElementById("toggleTitle").checked = showAttribution;
  showTitle = showAttribution;
  render();
});

// Toggle attribution title
document.getElementById("toggleTitle").addEventListener("click", () => {
  showTitle = !showTitle;
  name = document.getElementById("quoteAttr").value || "First Last";
  render();
});

// Change selected logo
document.getElementById("hubLogo").addEventListener("change", render);

// Include logo
document.getElementById("toggleLogo").addEventListener("click", () => {
  includeLogo = !includeLogo;
  document.getElementById("hubLogo").disabled = !includeLogo;
  render();
});

/* RUN */

createBackgroundImageElements();
window.setTimeout(render, 700);
