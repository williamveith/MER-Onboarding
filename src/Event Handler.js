/**
 * Handles HTTP GET requests to perform various operations based on URL parameters.
 * 
 * @param {GoogleAppsScript.Events.DoGet} e - The event parameter containing the request parameters.
 * @returns {GoogleAppsScript.Content.TextOutput|GoogleAppsScript.HTML.HtmlOutput} The response output.
 * 
 * @example
 * // Retrieves HTML badges for the specified rows
 * // URL: https://script.google.com/a/macros/utexas.edu/s/AKfycbxuqKwaTzlsJEb29qoOITdoA_g1PlzRzc14KGdbYKp3/dev?badges=2%2C3
 * 
 * @example
 * // Simulates form submission and retrieves HTML badges for the specified EID
 * // URL: https://script.google.com/a/macros/utexas.edu/s/AKfycbxuqKwaTzlsJEb29qoOITdoA_g1PlzRzc14KGdbYKp3/dev?content=badges&eid=jl86947
 * 
 * @example
 * // Returns a basket
 * // URL: https://script.google.com/a/macros/utexas.edu/s/AKfycbxuqKwaTzlsJEb29qoOITdoA_g1PlzRzc14KGdbYKp3/dev?basket=N007%2CN180&operation=return
 * 
 * @example
 * // Sends a request training email
 * // URL: https://script.google.com/a/macros/utexas.edu/s/AKfycbxuqKwaTzlsJEb29qoOITdoA_g1PlzRzc14KGdbYKp3/dev?content=sendRequestTrainingEmail&email=williamveith@gmail.com
 */
function doGet(e) {
  if (e.parameter.badges) {
    return doGetHtmlBadges(e.parameter.badges)
  }

  if (e.parameter.content && e.parameter.eid) {
    try {
      function simulatedFormSubmission(data, callback) {
        const formObj = { inputText: data };
        return callback(formObj);
      }
      switch (e.parameter.content) {
        case "badges":
          const rows = getBadgeRows(e.parameter.eid).join();
          return simulatedFormSubmission(rows, doGetHtmlBadges);
        default:
          return ContentService.createTextOutput(`Failure: That functionality does not exist`);
      }
    } catch (error) {
      return ContentService.createTextOutput(`Failure: There was an error running this module.\nError: ${error}`);
    }
  }

  if (e.parameter.basket && e.parameter.operation) {
    switch (e.parameter.operation) {
      case "return":
        try {
          returnBasket(e.parameter.basket)
          return ContentService.createTextOutput("Success: Basket returned successfully.");
        } catch (error) {
          return ContentService.createTextOutput("Failure: Error returning basket - " + error.message);
        }
        break;
    }
    return
  }

  if (e.parameter.content && e.parameter.email) {
    function simulatedFormSubmission(data, callback) {
      const formObj = { inputText: data };
      callback(formObj);
    }
    const actions = {
      "sendRequestTrainingEmail": sendRequestTrainingEmail,
      "sendBuildingAccessEmail": sendBuildingAccessEmail,
      "sendBasketRequestEmail": sendBasketRequestEmail
    };

    if (actions[e.parameter.content]) {
      try {
        simulatedFormSubmission(e.parameter.email, actions[e.parameter.content]);
        return ContentService.createTextOutput("Success: Email sent");
      } catch (error) {
        return ContentService.createTextOutput(`Failure: There was an error running this module.\nError: ${error}`);
      }
    } else {
      return ContentService.createTextOutput(`Failure: That functionality does not exist`);
    }
  }

  return ContentService.createTextOutput(`Failure: Required parameters not provided`);
}

/**
 * Handles the various actions triggered by a form submission event in Google Sheets, depending on the specific sheet configuration.
 * This function routes the event to different processing functions based on the originating sheet's name.
 * 
 * Actions performed can include:
 * - Adding training events.
 * - Emailing quiz results.
 * - Registering new lab access and creating associated accounts.
 * - Handling lab equipment or basket assignments.
 *
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - The event object that contains information about the submitted form,
 * including data from the form, the associated spreadsheet, and the range where the data is recorded.
 */
function onFormSubmission(e) {
  // Instantiate a new CurrentInstance object, freezing it to prevent modification
  const event = Object.freeze(new CurrentInstance(e));

  // Update the spreadsheet to reflect new form data
  event.updateSpreadsheet();

  // Determine actions based on the name of the sheet where the form is submitted
  switch (event.sheet.getName()) {
    case CONFIGS.Sheet.Training:
      // Add form submission to training records
      addToTrainingEvent(event);
      break;

    case CONFIGS.Sheet.Quiz:
      // Send appropriate email based on quiz results
      const emailTemplateName = passedQuiz(event) ? CONFIGS.Templates.QuizPass : CONFIGS.Templates.QuizFail;
      emailQuizResults(event, emailTemplateName)
      break;

    case CONFIGS.Sheet.Registration:
      // Handle new registrations and associated lab access
      if (event.values["Create Lab Access & Sedona Accounts"] == "Yes") {
        submitLabAccessForm(event);
      }
      saveToCalendar(event);
      const pdfFileBlob = createPaperBuildingAccessForm(event);
      emailAccessControlForm(pdfFileBlob);
      emailCleanroomSupplies(event);
      break;

    case CONFIGS.Sheet.LabAccess:
      // Set up new lab access accounts and confirmations
      const labAccess = new LabAccess(event);
      saveLabAccessAccountCreateToCalendar(labAccess);
      sendLabAccessText(labAccess);
      sendLabAccessConfirmation(labAccess);
      saveVCard(labAccess);
      break;

    case CONFIGS.Sheet.Basket:
      // Assign baskets to new lab users & emails building access form to Gerlinde
      assignBasket(event);
      sendBasketEmail(event);
      break;
  }
}