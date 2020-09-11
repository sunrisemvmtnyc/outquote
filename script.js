/* GLOBALS */

let selectedBackgroundImage = 0;

/* CONSTANTS */

const DEFAULT_QUOTE = `Lorem ipsum dolor sit amet, consectetur adipisicing
elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua.`.replace(/\n/g, " ");
const DEFAULT_ATTR = "First Last";
const DEFAULT_TITLE = "Title";

// RESIZING
const MAX_CONTAINER_WIDTH = 960;

// BACKGROUND PHOTOS
// background photos are named by numbers; update NUM_BGS when adding new photos
const NUM_BGS = 27;
const BG_PHOTOS = [...Array(NUM_BGS).keys()].map(i => {
  const num = `${i+1}`;
  return `bg-photos/${num.padStart(2, "0")}.jpg`;
});

// SUNRAYS
const SUNRAYS = [
  "sunrays/orange.svg"
];

// LOGOS
const LOGOS = [
  "logos/national",
  "logos/nyc"
];
// this logo-specific factor adjusts the height when setting it into the border
const LOGO_INSET_FACTOR = [0.75, 0.85];

// COLOR SCHEMES
const PRIMARY = ["#E3EDDF", "#33342E", "#33342E", "#FFDE16"];
const BACKGROUNDS = [
  ["#8F0D56", "#EF4C39", "#FD9014"],
  ["#8F0D56", "#EF4C39", "#FD9014", "#FFDE16"],
  ["#FFDE16"],
  ["#33342E"]
];
const LOGO_SCHEMES = [
  "-white.svg",
  "-gray.svg",
  "-gray.svg",
  "-yellow.svg"
];

// CANVAS SIZE
const INSTA_POST = 0;
const INSTA_STORY = 1;
const TWITTER_FB = 2;
const SIZES = [
  [1080, 1080], // instagram post
  [1080, 1920], // instagram story
  [1280, 640] // twitter/facebook
];
const LOGO_HEIGHT = [160, 160, 80];
const FONT_SIZE = [60, 80, 40];
const BORDERS = [10, 10, 6];
const MARGINS = [100, 100, 60];

/* FUNCTIONS */

/*
 * First size and transform the canvas as necessary so that it displays well on
 * various screen sizes. Then call all of the rendering functions for the actual
 * inputs specified by the user.
 */
const render = () => {
  // the canvas element
  const canvas = document.getElementById("canvas");
  // get the context to render everything on
  const context = canvas.getContext("2d");
  // the background drop down is used to determine the color scheme
  const scheme = document.getElementById("backgroundColor").selectedIndex;
  // the dimensions for the graphic based on the selected social media platform
  const size = document.getElementById("canvasSize").selectedIndex;

  // resize the canvas based on the selected social media platform
  canvas.width = SIZES[size][0];
  canvas.height = SIZES[size][1];

  // resize the canvas element based on its aspect ratio and the screen size
  transformCanvasByScreenSize(canvas, size);

  // render elements in the correct order
  renderBackground([canvas, context, scheme, size])
    .then(renderBackgroundImage)
    .then(renderSunrays)
    .then(renderForeground);
}

/*
 * Resize the HTML canvas element based on the social media platform selected
 * and the user's screen size. This ensures that the page doesn't scroll too
 * much on desktop for the taller sizes, like the Instagram post and story.
 */
const transformCanvasByScreenSize = (canvas, size) => {
  const offsetWidth = document.getElementById("container").offsetWidth;
  // the container's max width is 960, so get whichever is smaller
  const containerWidth = Math.min(
    // subtract 40 for the container's padding on small screens
    offsetWidth < 400 ? offsetWidth - 40 : offsetWidth,
    MAX_CONTAINER_WIDTH
  );

  // on desktop, reduce the size of insta posts/stories so they're not so tall
  const aspect = containerWidth / canvas.width;
  const scale = containerWidth > 700 && size != TWITTER_FB ?
    aspect * 0.5 * canvas.width / canvas.height :
    aspect;
  canvas.style.transform = `scale(${scale})`;

  // adjust the size of the canvas's container so we don't get any extra scroll
  const canvasRow = document.getElementById("canvasRow");
  canvasRow.style.width = `${canvas.width * scale}px`;
  canvasRow.style.height = `${canvas.height * scale}px`;
}

/*
 * Render the background based on the selected color scheme. It's technically
 * overkill to use a promise for this function, but it keeps all the rendering
 * functions consistent.
 */
const renderBackground = (args) => {
  [canvas, context, scheme, size] = [...args];
  return new Promise(resolve => {
    const hasGradient = BACKGROUNDS[scheme].length > 1;

    // fill the background with the selection
    const half = canvas.width / 2;
    const gradient = context.createLinearGradient(half, 0, half, canvas.height);
    if (hasGradient) {
      const stops = BACKGROUNDS[scheme].length - 1;
      BACKGROUNDS[scheme].forEach((color, i) => {
        gradient.addColorStop(i / stops, color);
      });
    }
    context.fillStyle = hasGradient ? gradient : BACKGROUNDS[scheme];
    context.fillRect(0, 0, canvas.width, canvas.height);
    resolve(args)
  });
}

/*
 * Render the selected background image. This function returns a promise so that
 * we can ensure elements are rendered in the correct order.
 */
const renderBackgroundImage = (args) => {
  [canvas, context, scheme, size] = [...args];
  return new Promise(resolve => {
    if (document.getElementById("useBackgroundImage").checked) {
      const image = new Image();
      image.onload = () => {
        const imageAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        // scale image based on aspect ratios so it covers the entire background
        const width = canvasAspect > imageAspect ?
          canvas.width :
          canvas.height * imageAspect;
        const height = canvasAspect > imageAspect?
          canvas.width * (1 / imageAspect):
          canvas.height;
        const xPos = (canvas.width - width) / 2;
        const yPos = (canvas.height - height) / 2;
        const blendMode = document.getElementById("blendMode").value;
        context.globalCompositeOperation = blendMode;
        context.drawImage(image, xPos, yPos, width, height);
        context.globalCompositeOperation = "source-over";
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
    [canvas, context, scheme, size] = [...args];
    if (document.getElementById("includeSunrays").checked) {
      const image = new Image();
      image.onload = () => {
        // firefox uses svg width/height properties, meaning we can't distort it
        // thus, the sunrays need to be twice as big as the canvas to cover it
        const imageAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        const width = canvasAspect > imageAspect ?
          canvas.width * 2 :
          canvas.height * 2 * imageAspect;
        const height = canvasAspect > imageAspect?
          canvas.width * 2 * (1 / imageAspect) :
          canvas.height * 2;
        const xPos = (canvas.width - width) / 2;
        // move yPos up a bit so the rays align with the bottom border
        const heightAdjust = size == TWITTER_FB ? 10 : canvas.height / 7;
        const yPos = heightAdjust - MARGINS[size] / 2 - canvas.height;
        context.drawImage(image, xPos, yPos, width, height);
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
  [canvas, context, scheme, size] = [...args];
  // draw the border
  context.strokeStyle = PRIMARY[scheme];
  context.lineWidth = BORDERS[size];
  context.beginPath();
  const insetLogo = document.getElementById("insetLogo").checked;
  if (insetLogo) {
    // for the inset logo, we draw four lines to handle the break for the logo
    context.moveTo(canvas.width - MARGINS[size] * 1.5, MARGINS[size] / 2);
    context.lineTo(MARGINS[size] / 2, MARGINS[size] / 2);
    context.lineTo(MARGINS[size] / 2, canvas.height - MARGINS[size] / 2);
    context.lineTo(
      canvas.width - MARGINS[size] / 2,
      canvas.height - MARGINS[size] / 2
    );
    context.lineTo(canvas.width - MARGINS[size] / 2, MARGINS[size] * 2);
  } else {
    // for the regular logo, we can just draw a stroked rectangle
    context.rect(
      MARGINS[size] / 2,
      MARGINS[size] / 2,
      canvas.width - MARGINS[size],
      canvas.height - MARGINS[size]
    );
  }
  context.stroke();

  // set context options for rendering the quote
  const centerElements = document.getElementById("centerElements").checked;
  context.font = `400 ${FONT_SIZE[size]}px source sans pro`;
  context.fillStyle = PRIMARY[scheme];
  if (centerElements) {
    context.textAlign = "center";
  }

  // render quote text
  const lineH = FONT_SIZE[size] + 10;
  const maxW = canvas.width - MARGINS[size] * 2;
  const maxH = canvas.height;
  const half = canvas.width / 2;
  const x = centerElements ? half : MARGINS[size];
  wrapText(context, getAndCleanQuote(), maxW, maxH, lineH, x, 0, true);

  // load and draw logo
  if (document.getElementById("toggleLogo").checked) {
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
      context.drawImage(image, xPos, yPos, width, height);
    }
    image.src = LOGOS[logo] + LOGO_SCHEMES[scheme];
  }

  // render the attribution
  if (document.getElementById("toggleAttribution").checked) {
    const name = document.getElementById("quoteAttr").value || DEFAULT_ATTR;
    const title = document.getElementById("quoteTitle").value || DEFAULT_TITLE;

    // get contexts for name and title
    const nameCtx = canvas.getContext("2d");
    const titleCtx = canvas.getContext("2d");

    // set the nameCtx font to get correct width measurement
    nameCtx.font = `700 ${FONT_SIZE[size]}px source sans pro`;
    nameCtx.fillStyle = PRIMARY[scheme];

    // get the lengths of the name and title texts
    const splitAttrib = document.getElementById("splitAttribution").checked;
    const showTitle = document.getElementById("toggleTitle").checked;
    let nameText = showTitle && !splitAttrib ? name + " | " : name;
    const nameLength = nameCtx.measureText(nameText).width;
    const titleLength = showTitle ? titleCtx.measureText(title).width : 0;

    // if the attribution and/or title are more than one line, adjust positions
    const lines = splitAttrib ?
      Math.floor(nameLength / maxW) + Math.ceil(titleLength / maxW) :
      Math.floor((nameLength + titleLength) / maxW);
    const xPos = centerElements ? half : MARGINS[size];
    const yPos = canvas.height - MARGINS[size] - lines * lineH;

    if (centerElements) {
      nameCtx.textAlign = "center";
      titleCtx.textAlign = "center";
      if (!splitAttrib) {
        // TODO: this is a bit hacky and on really long text doesn't quite work
        // (this is because spaces break differently on the lines than text)
        const count = Math.round(titleLength / nameCtx.measureText(" ").width);
        nameText += " ".repeat(count);
      }
    }

    // fill name text
    wrapText(nameCtx, nameText, maxW, maxH, lineH, xPos, yPos, false);

    // fill title text
    if (showTitle) {
      titleCtx.font = `400 ${FONT_SIZE[size]}px source sans pro`;
      if (splitAttrib) {
        const yPosTitle = yPos + lineH;
        wrapText(titleCtx, title, maxW, maxH, lineH, xPos, yPosTitle, false);
      } else {
        const count = Math.round(nameLength / titleCtx.measureText(" ").width);
        const text = " ".repeat(count) + title;
        wrapText(titleCtx, text, maxW, maxH, lineH, xPos, yPos, false);
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
      row.className = "mgm-row thumbnail-row";
    }
    const column = document.createElement("div");
    column.className = "three mgm-columns center";
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
  if ((BG_PHOTOS.length - 1) % 4 !== 3) thumbnails.appendChild(row);
}

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
 * Get the quote from the text box element and replace all apostrophes and
 * quotation marks in it with curly ones. Return the converted quote within
 * curly quote marks.
 */
const getAndCleanQuote = () => {
  let quote = document.getElementById("quoteBox").value;

  // use default quote if user leaves quote box empty
  if (!quote) {
    return `\“${DEFAULT_QUOTE}\“`;
  }

  // convert all quotes to curly quotes
  quote = quote.replace(/\b'/g, "\’");
  quote = quote.replace(/'(?=\d)/g, "\’");
  quote = quote.replace(/'(?=\b|$)/g, "\‘");
  quote = quote.replace(/\b"/g, "\”");
  quote = quote.replace(/"(?=\w|$)/g, "\“");

  return `\“${quote}\“`;
}

/* EVENT HANDLERS */

// Type in the quote box
document.getElementById("quoteBox").oninput = render;

// Type in the attribution box
document.getElementById("quoteAttr").oninput = render;

// Type in the title box
document.getElementById("quoteTitle").oninput = render;

// Save the image
document.getElementById("saveButton").addEventListener("click", () => {
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
document.getElementById("centerElements").addEventListener("click", render);

// Toggle split attribution
document.getElementById("splitAttribution").addEventListener("click", render);

// Toggle inset logo
document.getElementById("insetLogo").addEventListener("click", render);

// STYLE

// Change selected background/color scheme
document.getElementById("backgroundColor").addEventListener("change", render);

// Toggle including sunrays
document.getElementById("includeSunrays").addEventListener("click", render);

// Toggle using background image
document.getElementById("useBackgroundImage").addEventListener("click", () => {
  const checked = document.getElementById("useBackgroundImage").checked;
  const thumbnailsContainer = document.getElementById("thumbnailsContainer");
  thumbnailsContainer.style.display = checked ? "block" : "none";
  document.getElementById("blendMode").disabled = !checked;
  render();
});

// Change selected blend mode
document.getElementById("blendMode").addEventListener("change", render);

// ELEMENTS

// Toggle attribution
document.getElementById("toggleAttribution").addEventListener("click", () => {
  const checked = document.getElementById("toggleAttribution").checked;
  document.getElementById("splitAttribution").disabled = !checked;
  document.getElementById("toggleTitle").disabled = !checked;
  // make sure split attribution and title follow suit with attribution
  document.getElementById("splitAttribution").checked = checked;
  document.getElementById("toggleTitle").checked = checked;
  render();
});

// Toggle attribution title
document.getElementById("toggleTitle").addEventListener("click", render);

// Change selected logo
document.getElementById("hubLogo").addEventListener("change", render);

// Include logo
document.getElementById("toggleLogo").addEventListener("click", () => {
  const checked = document.getElementById("toggleLogo").checked;
  document.getElementById("hubLogo").disabled = !checked;
  document.getElementById("insetLogo").disabled = !checked;
  document.getElementById("insetLogo").checked = checked;
  render();
});

/* RUN */

createBackgroundImageElements();
window.setTimeout(render, 700);
