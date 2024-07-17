/**
 * Assigns a basket to a user based on their cleanroom access needs and updates the basket index sheet.
 * If a basket is already assigned, it updates the existing assignment. Otherwise, it finds a suitable basket and assigns it.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, including user and cleanroom details.
 */
function assignBasket(currentInstance) {
  /**
   * Creates a new row of basket data based on existing row structure and current instance data.
   * @param {GoogleAppsScript.Spreadsheet.Range} range - The range of the current basket assignment.
   * @param {CurrentInstance} currentInstance - Data from the form submission.
   * @returns {Array[]} New row data for the basket sheet.
   */
  const makeNewRow = (range, currentInstance) => {
    const currentValues = range.getValues().flat();
    return [[currentValues[0], currentValues[1], false, true, currentInstance.range.getRow(), currentInstance.values["UT EID"], currentInstance.values["Phone Number"], currentInstance.values["Email Address"], currentInstance.values["First Name"], currentInstance.values["Last Name"], currentInstance.values["Timestamp"]]];
  }

  const sheet = CONFIGS.Sheet.get(CONFIGS.Sheet.BasketIndex);
  const existingAssignment = currentInstance.values["Basket ID"] !== undefined ? currentInstance.values["Basket ID"].match(/(S|N){1}[0-9]{3}/) : false
  if (existingAssignment) {
    Logger.log(`${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]} already assigned Basket ${currentInstance.values["Basket ID"]}`);
    const row = sheet.getRange(2, 1, sheet.getLastRow() - 2, 1).getValues().flat().indexOf(currentInstance.values["Basket ID"]) + 2;
    const range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    range.setValues(makeNewRow(range, currentInstance));
    return
  }

  const values = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues()
  let rowNumber = 1;
  for (let row in values) {
    if (values[row][1] === currentInstance.values["Cleanroom"] && values[row][2]) {
      const range = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn())
      range.setValues(makeNewRow(range, currentInstance))
      currentInstance.values = { key: "Basket ID", value: values[row][0] }
      currentInstance.updateSpreadsheet()
      break;
    }
    rowNumber++;
  }
  if (currentInstance.values["Basket ID"]) {

  }
}

/**
 * Generates a QR code for a user's basket assignment, including essential user information and encodes it into a PDF file.
 * The QR code is saved to Google Drive.
 *
 * @param {CurrentInstance} currentInstance - An instance with user data needed for the QR code.
 * @param {string} [size="255"] - The size of the QR code image in pixels.
 * @returns {GoogleAppsScript.Base.Blob} A blob representing the generated PDF file containing the QR code.
 */
function generateBasketQRCode(currentInstance) {
  const qrCodeData = {
    eid: currentInstance.values["UT EID"],
    name: `${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`,
    phone: currentInstance.values["Phone Number"],
    email: currentInstance.values["Email Address"],
    basket: currentInstance.values["Basket ID"],
    assigned: currentInstance.values["Timestamp"]
  }

  const fileName = `Basket ${qrCodeData.basket} ${qrCodeData.assigned} ${qrCodeData.name}`;
  const qrCodeFolder = CONFIGS.Drive.get(CONFIGS.Drive.Baskets);

  const template = CONFIGS.Templates.get(CONFIGS.Templates.BasketQRCode);
  template.dynamicData = {
    basketNumber: qrCodeData.basket,
    qrCodeContent: JSON.stringify(qrCodeData)
  }
  const htmlContent = template.evaluate()
  const pdfFile = qrCodeFolder.createFile(htmlContent.getBlob().getAs(MimeType.PDF))
    .setName(`${fileName}.pdf`)
    .setDescription(JSON.stringify(qrCodeData));
  return pdfFile.getAs(MimeType.PDF);
}

/**
 * Sends an email to a user notifying them of their cleanroom basket assignment. The email includes attachments
 * for a QR code and a guide PDF.
 *
 * @param {CurrentInstance} currentInstance - An instance with user data to personalize the email and attachments.
 */
function sendBasketEmail(currentInstance) {
  if (currentInstance.values["Basket ID"] === "" || currentInstance.values["Basket ID"] === undefined) {
    let template = CONFIGS.Templates.get(CONFIGS.Templates.BasketUnavailable);
    template.dynamicData = currentInstance.values;
    GmailApp.sendEmail(currentInstance.values["Email Address"], `No Cleanroom Basket Available`, "", {
      from: CONFIGS.Email.William,
      htmlBody: template.evaluate().getContent(),
      name: "Automated Basket Assignment"
    });
    return;
  }

  let template = CONFIGS.Templates.get(CONFIGS.Templates.BasketAssignment);
  template.dynamicData = currentInstance.values;
  GmailApp.sendEmail(currentInstance.values["Email Address"], `Cleanroom Basket Assigned`, "", {
    from: CONFIGS.Email.William,
    htmlBody: template.evaluate().getContent(),
    attachments: [generateBasketQRCode(currentInstance), CONFIGS.Drive.get(CONFIGS.Drive.BasketGuide).getAs(MimeType.PDF)],
    name: "Automated Basket Assignment"
  });
  return;
}

/**
 * Marks a basket as returned in the basket index and registration sheets by updating the record row to show the basket is no longer in use.
 *
 * @param {Array|string} basketIdsInput - An array of basket IDs or a single basket ID to be marked as returned.
 */
function returnBasket(basketIdsInput) {

  const basketIndexSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.BasketIndex);
  const basketRegistrationSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.Basket);
  const basketIndexValues = basketIndexSheet.getDataRange().getValues();
  const basketIndexHeaders = basketIndexValues.shift();

  const basketIndex = {};
  basketIndexValues.forEach((row, index) => {
    basketIndex[row[basketIndexHeaders.indexOf("Basket ID")]] = {
      row: index + 2,
      recordRow: row[basketIndexHeaders.indexOf("Record Row")]
    }
  });

  const basketIds = Array.isArray(basketIdsInput) ? basketIdsInput : [basketIdsInput];
  basketIds.forEach(basketId => {
    const basket = basketIndex[basketId];
    basketIndexSheet.getRange(basket.row, 3, 1, basketIndexSheet.getLastColumn() - 2)
      .setValues([[true, false, ...Array(7).fill()]]);

    if (Number.isNaN(basket.recordRow)) {
      return;
    }

    basketRegistrationSheet.getRange(basket.recordRow, 1, 1, basketRegistrationSheet.getLastColumn())
      .setFontLine("line-through")
      .setFontStyle("italic")
      .setFontColor("#d9d9d9");
  });

}
