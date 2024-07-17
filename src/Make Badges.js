/**
 * Retrieves the row numbers of badge entries based on given UT EIDs.
 * 
 * @param {string|string[]} inputEids - A single UT EID or an array of UT EIDs to search for in the registration sheet.
 * @returns {number[]} An array of row numbers corresponding to the UT EIDs found in the registration sheet.
 */
function getBadgeRows(inputEids) {
  const utEids = Array.isArray(inputEids) ? inputEids : [inputEids]
  const registrationValues = CONFIGS.Sheet.get(CONFIGS.Sheet.Registration).getDataRange().getValues();
  const headers = registrationValues.shift()
  const utEIDIndex = headers.indexOf("UT EID")
  return registrationValues.map((row, index) => {
    const eidIndex = utEids.indexOf(row[utEIDIndex])
    return eidIndex === -1 ? null : index + 2
  }).filter(rowNumber => rowNumber !== null)
}

/**
 * Receives the form input values from the Spreadsheet UI. The function that calls this can be found in the Utilities.gs file
 */
function makeBadges(formObject) {
  const rowLimits = {
    smallest: 2,
    largest: CONFIGS.Sheet.get(CONFIGS.Sheet.Registration).getLastRow(),
    valueInRange(value) {
      if (value < this.smallest || value > this.largest) {
        throw new Error(`Invalid row number: ${value}. Row numbers must be between ${this.smallest} and ${this.largest}.`);
      }
    }
  }

  const rows = formObject.inputText.replace(/\s*/g, "").split(",").map(rowNumber => {
    if (rowNumber.includes("-")) {
      const [start, end] = rowNumber.split("-").map(Number).sort((a, b) => a - b);
      const rangeValues = [];
      for (let i = start; i <= end; i++) {
        rowLimits.valueInRange(i);
        rangeValues.push(i);
      }
      return rangeValues;
    } else {
      const number = parseInt(rowNumber, 10);
      rowLimits.valueInRange(number);
      return number;
    }
  }).flat()

  const uniqueRows = [...new Set(rows)].sort((a, b) => a - b).join(",");

  try {
    const url = `https://script.google.com/a/macros/utexas.edu/s/AKfycbxuqKwaTzlsJEb29qoOITdoA_g1PlzRzc14KGdbYKp3/dev?badges=${encodeURIComponent(uniqueRows)}`;
    const html = "<script>window.open('" + url + "');google.script.host.close();</script>"
    const userInterface = HtmlService.createHtmlOutput(html)
      .setWidth(90)
      .setHeight(1);
    SpreadsheetApp.getUi().showModalDialog(userInterface, 'Opening...');
  } catch (error) {
    SpreadsheetApp.getUi().alert(error.message);
  }
}

/**
 * Generates and returns an HTML output containing badge information.
 * 
 * @param {string} badges - A string containing row numbers separated by commas.
 * @returns {GoogleAppsScript.HTML.HtmlOutput} The HTML output containing the badge information with appropriate styles for printing.
 */
function doGetHtmlBadges(badges) {
  const template = CONFIGS.Templates.get(CONFIGS.Templates.Badges);
  template.badges = badges
  const htmloutput = template.evaluate()
  const style = '<style>@media print { body, html { width: 100%; display: block; } .page-break { page-break-after: always; } } body { overflow: visible !important; }</style>';
  htmloutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).append(style)
  return htmloutput;
}

/**
 * Processes badge data and creates an array of badge objects with formatted vCard URLs.
 * 
 * @param {string} badges - A string containing row numbers separated by commas.
 * @returns {Object[]} An array of badge objects containing the name and vCard URL for each badge.
 */
function makeBadgeString(badges) {
  const rows = [...new Set(badges.replace(/\s*/, "").split(',').map(row => parseInt(row)).sort())]
  const currentInstancesInput = rows.map(rowNumber => CurrentInstance.createEvent(CONFIGS.Sheet.Registration, rowNumber));
  const currentInstances = Array.isArray(currentInstancesInput) ? currentInstancesInput : [currentInstancesInput];

  const padding = Array(currentInstances.length % 3 === 0 ? 0 : 3 - (currentInstances.length % 3)).fill({ "name": "", "url": "" });
  const badgeArray = currentInstances.map(currentInstance => {
    return {
      "name": `${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`,
      "url": `BEGIN:VCARD\r\nVERSION:4.0\r\nN:${currentInstance.values["Last Name"]};${currentInstance.values["First Name"]}\r\nFN:${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}\r\nORG:MER\r\nTEL;TYPE=cell:${currentInstance.values["Phone Number"]}\r\nEMAIL;TYPE=work:${currentInstance.values["Email Address"]}\r\nNOTE:${currentInstance.values["UT EID"]}\r\nEND:VCARD`
    };
  });
  badgeArray.push(...padding)
  return badgeArray;
}