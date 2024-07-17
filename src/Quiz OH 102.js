/**
 * Evaluates if a quiz participant has passed the quiz based on their score.
 * The function calculates the score percentage by comparing the participant's score against the total possible points available in the quiz.
 * It checks for a passing score, defined as 100%.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, including the participant's score.
 * @returns {boolean} True if the participant's score is equal to or exceeds the passing score, otherwise false.
 */
function passedQuiz(currentInstance) {
  // Define the passing score.
  const PASSING_SCORE = 100;

  /**
   * Converts a score string formatted as "x/y" to a numerical value "x".
   * @param {string} value - The score string.
   * @returns {number|null} The numerical part of the score or null if the format is invalid.
   */
  const convertStringScore = (value) => {
    const parts = value.split('/');
    if (parts.length !== 2) {
      console.error("Invalid score format:", currentInstance.values["Score"]);
      return null;
    }
    return parseFloat(parts[0].trim());
  }

  // Calculate the total points available in the quiz.
  const totalPoints = FormApp.openByUrl(currentInstance.sheet.getFormUrl())
    .getItems(FormApp.ItemType.MULTIPLE_CHOICE)
    .reduce((sum, item) => item.asMultipleChoiceItem().getPoints() + sum, 0);

  // Retrieve and convert the participant's score.
  const points = typeof currentInstance.values["Score"] == "string" ? convertStringScore(currentInstance.values["Score"]) : currentInstance.values["Score"]

  // Calculate the score percentage and determine if it meets or exceeds the passing score.
  return Math.round(points / totalPoints * 100) >= PASSING_SCORE
}

/**
 * Sends an email with quiz results to a participant, including additional onboarding links if applicable.
 * The function determines if the participant needs lab access and constructs appropriate URLs for further actions
 * based on the quiz results. Emails are dynamically generated using a Google Apps Script HTML template.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, including participant details like EID and email address.
 * @param {string} templateName - The name of the HTML template to use for constructing the email body. This is based on whether the participant passed or failed the quiz.
 */
function emailQuizResults(currentInstance, templateName) {
  /**
   * Determines if the participant already has lab access by checking against a list in the LabAccess sheet.
   * @returns {string} Returns "Yes" if lab access is needed, "No" otherwise.
   */
  const needsLabAccess = () => {
    try {
      const labaccessSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.LabAccess)
      const eidIndex = labaccessSheet.getRange(1, 1, 1, labaccessSheet.getLastColumn()).getValues().flat().indexOf("UT EID")
      const eids = labaccessSheet.getRange(2, eidIndex + 1, labaccessSheet.getLastRow(), 1).getValues().flat()
      return eids.includes(currentInstance.values["UT EID"]) ? "No" : "Yes";
    } catch (error) {
      Logger.log(`Existing EID/Lab Access Lookup Failed: ${error}`);
      return "Yes";
    }
  }
  /**
   * Constructs the URL for the onboarding form with pre-filled participant information.
   * @returns {string} The URL to the onboarding Google Form.
   */
  const makeOnboardingUrl = () => {
    return `https://docs.google.com/forms/d/e/1FAIpQLSfki9Rbsr1-miVmU_caLP1GNPRZnrHwrJvVafAHRUNJA3uyCA/viewform?usp=pp_url&entry.2112310779=${encodeURIComponent(currentInstance.values["UT EID"])}&entry.638397220=${encodeURIComponent(currentInstance.values["Email Address"])}&entry.394953257=${encodeURIComponent(currentInstance.values["First Name"])}&entry.1452521463=${encodeURIComponent(currentInstance.values["Last Name"])}&entry.537644763=${encodeURIComponent(needsLabAccess())}`
  }
  /**
   * Constructs the URL for the quiz form with pre-filled participant information.
   * @returns {string} The URL to the quiz Google Form.
   */
  const makeQuizUrl = () => {
    return `https://docs.google.com/forms/d/e/1FAIpQLSd1UHR6E5TShf3hL70CHwkmFmU_xotlLh5h_7LqzHSyNcv8kA/viewform?usp=pp_url&entry.283917136=${encodeURIComponent(currentInstance.values["UT EID"])}&entry.2131416682=${encodeURIComponent(currentInstance.values["First Name"])}&entry.252391519=${encodeURIComponent(currentInstance.values["Last Name"])}`
  }

  // Create the email template and insert dynamic data based on the quiz results.
  let template = HtmlService.createTemplateFromFile(templateName);
  template.dynamicData = {
    name: `${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`,
    url: templateName == CONFIGS.Templates.QuizPass ? makeOnboardingUrl() : makeQuizUrl()
  };
  
  const emailBody = template.evaluate().getContent();
  const progressBarHtml = CONFIGS.Templates.addProgressBar(templateName);
  const fullEmailHtml = emailBody + progressBarHtml;

  const emailSubject = `${templateName} | Safety Training | ${currentInstance.values["UT EID"]}`

  try {
    GmailApp.sendEmail(currentInstance.values["Email Address"], emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: fullEmailHtml,
      name: "Safety Training Automated Message"
    });
  } catch (error) {
    Logger.log(`Failed to send email: ${error}`);
  }
}