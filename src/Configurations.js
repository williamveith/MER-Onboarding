/**
 * @typedef {Object} Calendar
 * @property {string} Id - The calendar ID for the primary user, used to create and manage events.
 * @property {string} SafetyTraining - A specific calendar event title for safety training sessions, used to fetch and manage these events.
 */

/**
 * @typedef {Object} Drive
 * @property {string} AccessForms - Folder ID where access forms are stored and managed.
 * @property {string} All - Folder ID where all monthly invoices are stored.
 * @property {string} Baskets - Folder ID where basket QR Codes are stored.
 * @property {string} BasketGuide - File ID for basket instructions pdf.
 * @property {string} BasketExemptions - File ID for basket exemption json list
 * @property {string} Vcards - Folder ID for storing vCard files for contact management.
 * @property {string} WordList - File ID for the word list used in generating passwords.
 */

/**
 * @typedef {Object} Email
 * @property {string} Gerlinde - Email address for Gerlinde.
 * @property {string} Phone - MMS email format for sending text messages via AT&T to William Veith.
 * @property {string} William - Email address for William Veith.
 */

/**
 * @typedef {Object} Sheets
 * @property {string} Active - The sheet for indexing active users based on tool usage from invoices.
 * @property {string} Basket - Form Response sheet for managing basket registrations within the system.
 * @property {string} BasketIndex - The sheet for indexing and tracking basket information.
 * @property {string} LabAccess - Form Response sheet for managing access to lab facilities and Sedona registration.
 * @property {string} Quiz - Form Response sheet for storing quiz results and details for OH 102 safety communication.
 * @property {string} Registration - Form Response sheet for Access Control Requets.
 * @property {string} Training - Form Response sheet for safety training requests.
 */

/**
 * @typedef {Object} Templates
 * @property {string} Access - PDF Template for access control requests.
 * @property {string} Badges - Template to generate cleanroom badges.
 * @property {string} BasketAssignment - Email Template for sending basket assignment.
 * @property {string} BasketUnavailable - Email Template when no basket is available.
 * @property {string} BasketPurge - Email basket purge correction form.
 * @property {string} BasketQRCode - PDF Template for basket QR Code.
 * @property {string} QuizFail - Email Template for failed quizzes notification.
 * @property {string} LabAccessEmail - Email Template for lab access creation email confirmations.
 * @property {string} LabAccessEvent - Calendar Template for lab access creation calendar event.
 * @property {string} LabAccessText - Text Template for lab access creation SMS.
 * @property {string} QuizPass - Email Template for passed quizzes notification.
 * @property {string} Quiz - Email Template for sending quiz first time.
 * @property {string} Supplies - Email Template for telling users how to get supplies.
 * @property {string} TextInput - UI Template for text input in google sheets.
 * @property {string} TrainingRequest - Email Template for sending how to request training.
 */

/**
 * @typedef {Object} Triggers
 * @property {string} QuizSend - Name of function that sends quiz to everyone in today's training calendar event.
 */

/**
 * Enumerations used in the Google Apps Script project for consistent referencing of Drive files and folders,
 * sheet names, calendar details, email addresses, and templates.
 * @type {{Calendar: Calendar, Drive: Drive, Email: Email, Sheet: Sheets, Templates: Templates, Triggers: Triggers}}
 */
const CONFIGS = (function () {
  const calendar = {
    Id: "williamveith@utexas.edu",
    SafetyTraining: "Training: OH 102 | Description: Site-Specific Hazard Communication"
  };

  const drive = {
    AccessForms: "1ev4Q2xm0vHtMqoNaWZvcVmZ3QWHiEVk4",
    All: "1KlxLf5L0LqOeu0hbwtstSeVtZtgtXCrp",
    Baskets: "1gByNepHNNuD_fNOkQBxXhYAg0R1kmG21",
    BasketExemptions: "1jIYyreY7urDBfSE8M2IyKR-DtAAUAkjx",
    BasketGuide: "1XYHh2Cn2ztbHZ2BB1HKGgWZ110mOg0ZG",
    Vcards: "1nWDsvrXtenq_VkOQPa5ozB1i-47rRaDQ",
    WordList: "1qIuyu3Oe7WPxyWxydv0hro1XcFQUGgxH"
  };

  const email = {
    Gerlinde: "gerlinde@mer.utexas.edu",
    Phone: "9787980710@mms.att.net",
    William: Session.getActiveUser().getEmail() //"williamveith@utexas.edu"
  };

  const sheets = {
    Active: "Active Users",
    Basket: "Basket Registration",
    BasketIndex: "Basket Index",
    LabAccess: "Lab Access & Sedona Registration",
    Quiz: "Quiz OH 102",
    Registration: "MER Directory & Building Access Registration",
    Training: "Safety Training Requests"
  };

  const templates = {
    Access: "Access Control Request",
    Badges: "Badges",
    BasketAssignment: "Basket Assignment Email",
    BasketUnavailable: "No Baskets Available Email",
    BasketPurge: "Inactive Basket Email",
    BasketQRCode: "Basket QR Code",
    LabAccessEmail: "Lab Access Account Confirmation",
    LabAccessEvent: "Lab Access Calendar Event",
    LabAccessText: "Lab Access Text",
    Quiz: "Quiz",
    QuizFail: "Failed Quiz",
    QuizPass: "Passed Quiz",
    Supplies: "Get Cleanroom Supplies",
    TextInput: "Text Input",
    TrainingRequest: "Request Training"
  };

  const triggers = {
    QuizSend: "sendTrainingGroupQuiz"
  }

  function deepFreeze(object) {
    Object.keys(object).forEach(property => {
      if (typeof object[property] === "object" && !Object.isFrozen(object[property])) {
        deepFreeze(object[property]);
      }
    });
    return Object.freeze(object);
  };

  return deepFreeze({
    Calendar: {
      ...calendar,
      get() {
        return CalendarApp.getCalendarById(this.Id);
      }
    },
    Drive: {
      ...drive,
      get(fileFolder) {
        switch (fileFolder) {
          case this.WordList:
          case this.BasketGuide:
          case this.BasketExemptions:
            return DriveApp.getFileById(fileFolder);
          default:
            return DriveApp.getFolderById(fileFolder);
        }
      }
    },
    Email: email,
    Sheet: {
      ...sheets,
      get(sheetName) {
        return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      }
    },
    Templates: {
      ...templates,
      get(templateName) {
        return HtmlService.createTemplateFromFile(templateName);
      },
      addProgressBar(templateName) {

        let currentStep = undefined;
        switch (templateName) {
          case this.TrainingRequest:
            currentStep = 1;
            break;
          case this.Quiz:
          case this.QuizFail:
            currentStep = 3;
            break;
          case this.QuizPass:
          case this.Access:
            currentStep = 4;
            break;
          case this.Supplies:
            currentStep = 5;
            break;
        }

        const steps = [
          "Request safety training",
          "Attend safety training",
          "Pass quiz",
          "Submit MER User Registration form",
          "Get badge, basket, glasses from Facilities Office (1.108)"
        ];

        const stepLinks = [
          "https://docs.google.com/forms/d/e/1FAIpQLScLhxLgJWZLMs2f5JHSxSCYXTRkl56-Cx6zIVKJOFPDx18Qvg/viewform",
          "https://docs.google.com/presentation/d/e/2PACX-1vRFAmNm3h2wHQjyDYqf9cDNUh1gtIBaubTnTnrs-xHmpXcrHWzssG-QeOaZigh2IDCir65n9G3alyHE/pub",
          "https://docs.google.com/forms/d/e/1FAIpQLSd1UHR6E5TShf3hL70CHwkmFmU_xotlLh5h_7LqzHSyNcv8kA/viewform",
          "https://docs.google.com/forms/d/e/1FAIpQLSfki9Rbsr1-miVmU_caLP1GNPRZnrHwrJvVafAHRUNJA3uyCA/viewform",
          "https://docs.google.com/forms/d/e/1FAIpQLSfYfbyHjrWy6XcvQSQl5J1hNzsLZjD3McOi5Ks-q33F6LhZqg/viewform?usp=sf_link"
        ];

        const progressBarTemplate = HtmlService.createTemplateFromFile('HTML Footer');

        progressBarTemplate.currentStep = currentStep;
        progressBarTemplate.completeSteps = Array(currentStep).fill(0).map((item, index) => index + 1);
        progressBarTemplate.totalSteps = steps.length;
        progressBarTemplate.steps = steps;
        progressBarTemplate.links = stepLinks;

        return progressBarTemplate.evaluate().getContent();
      }
    },
    Triggers: triggers
  });
})();