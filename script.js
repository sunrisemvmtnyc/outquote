let quote = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
let name = "First Last";
let title = "Position";
let showAttribution = true;
let showAttributionTitle = true;
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

/*
 * Correctly wraps the quote text by adding each word, checking if it fits
 * within the given maximum width, and adding a newline if not.
 */
const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  return y;
}

/*
 * This the main function; it goes through all of the various options and
 * renders based on how the user has selected them.
 */
const renderContent = () => {
  const canvas = document.getElementById("canvas");
  // TODO: abstract these into options for different platforms
  canvas.width = 1000;
  canvas.height = 500;

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
  quoteCtx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

  quoteCtx.font = "400 38px source sans pro";
  quoteCtx.fillStyle = TEXT_COLORS[scheme];

  if (centerElements) {
    quoteCtx.textAlign = "center";
  }

  // render elements
  const quoteBottomSpacing = (showAttribution ? 0 : -20)
    + (includeLogo ? 50 : 120) + (!showAttribution && !includeLogo ? 40 : 0);
  wrapText(quoteCtx, "\“" + quote + "\”", centerElements ? 500 : 50,
    canvas.height / 2 - quoteBottomSpacing, 800, 48);

  // load logo
  if (includeLogo) {
    const image = new Image();
    image.onload = () => {
      const aspect = image.width / image.height;
      const width = 80 * aspect;
      quoteCtx.drawImage(image, centerElements ? (canvas.width - width) / 2 + 10 : canvas.width - width - 50, 50,
        width, 80);
    }
    image.src = useWordmark ? TEXT_LOGOS[scheme] : LOGOS[scheme];
  }

  if (showAttribution) {
    quoteCtx.textAlign = "left"; // makes below calculations work
    const nameCtx = canvas.getContext("2d");
    const titleCtx = canvas.getContext("2d");

    // set the nameCtx font to get correct width measurement
    nameCtx.font = "700 38px source sans pro";

    const nameLength = showAttributionTitle ? nameCtx.measureText(name + " | ").width : nameCtx.measureText(name).width;
    const titleLength = titleCtx.measureText(title).width;

    const centerPos = (showAttributionTitle) ? canvas.width / 2 - nameLength / 2 - titleLength / 2 : canvas.width / 2 - nameLength / 2;
    const nameCtxX = centerElements ? centerPos : 50;
    const titleCtxX = nameLength + nameCtxX;

    // fill name text
    nameCtx.fillStyle = TEXT_COLORS[scheme];
    nameCtx.fillText(showAttributionTitle ? name + " | " : name, nameCtxX,
      canvas.height - (includeLogo ? 70 : 120) + (!includeLogo && showAttribution ? 50 : 0));

    // fill title text
    if (showAttributionTitle) {
      titleCtx.font = "400 38px source sans pro";
      titleCtx.fillText(title, titleCtxX, canvas.height - (includeLogo ? 70 : 120)
        + (!includeLogo && showAttribution ? 50 : 0));
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

// Toggle attribution
const toggleAttrCheckbox = document.getElementById("toggleAttribution");
toggleAttrCheckbox.addEventListener("click", function() {
	showAttribution = !showAttribution;
	renderContent();
});

// Toggle attribution title
const toggleAttrTitleCheckbox = document.getElementById("toggleAttributionTitle");
toggleAttrTitleCheckbox.addEventListener("click", function() {
	showAttributionTitle = !showAttributionTitle;
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
backgroundColor.addEventListener("change", function() {
	renderContent();
});

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
