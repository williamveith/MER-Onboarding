/**
 * Submits a lab access request form on behalf of a user by programmatically posting to a Google Form.
 * This function gathers required user information from a `currentInstance` object and submits these details
 * to a pre-configured Google Form via an HTTP POST request. Useful for automating form submissions directly from script logic.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, used to populate the lab access request form.
 */
function submitLabAccessForm(currentInstance) {
  // Define the form submission URL and payload structure based on the Google Form fields.
  const form = {
    url: "https://docs.google.com/forms/u/0/d/e/1FAIpQLSf7M-UE89Lyt-_sLG85dABxECWv00G9XABj29nYAsSzJm_78w/formResponse",
    options: {
      method: 'post',
      payload: {
        'entry.231462656': currentInstance.values["First Name"],
        'entry.1494373819': currentInstance.values["Last Name"],
        'entry.1067143744': currentInstance.values["UT EID"],
        'entry.1139611484': currentInstance.values["Phone Number"],
        'entry.1776831010': currentInstance.values["Email Address"],
        'entry.1385700785': currentInstance.values["UT Affiliation"] === "Non-UT" ? currentInstance.values["Department or Company"] : currentInstance.values["Professor or Supervisor"]
      }
    }
  }

  // Attempt to submit the form using a URL fetch request and log the response status.
  try {
    const response = UrlFetchApp.fetch(form.url, form.options);
    // Log the HTTP response code to monitor success.
    console.log(JSON.stringify({ "Status Code": response.getResponseCode() }));
  } catch (error) {
    // Log detailed error information if the fetch request fails.
    Logger.log("Name:", error.name)
    Logger.log("Stack:", error.stack)
    Logger.log("Message:", error.message)
  }
}

/**
 * Schedules a building access event on the next available business day in the specified calendar.
 * The event is set for a specific time during the business day and includes details about the user from the current instance.
 * A popup reminder is also added to the event 15 minutes before its start.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, including user details like first name, last name, and EID.
 */
function saveToCalendar(currentInstance) {
  /**
   * Calculates the next business day's date and sets the event start time to 1 PM on that day.
   * If today is Friday or the weekend, the event is set for the next Monday.
   * @returns {Date} The calculated start date and time for the event.
   */
  const nextBusinessDay = () => {
    const today = new Date();
    const daysLeftInWeek = 7 - today.getDay();
    const activeDay = daysLeftInWeek > 2 ? today.setDate(today.getDate() + 1) : today.setDate(today.getDate() + (daysLeftInWeek + 1));
    return new Date(new Date(activeDay).setHours(13, 0, 0));
  }

  // Determine the start and end times of the event.
  const start = nextBusinessDay();
  const end = new Date(start.getTime() + 10 * 60 * 1000);

  // Define the title of the event using user details.
  const title = `Building Access: Give Access | User: ${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`;

  // Create the calendar event with a specified title, time, and additional details.
  CONFIGS.Calendar.get().createEvent(title, start, end, {
    description: `Security Center: https://gsc-web.austin.utexas.edu/securitycenter/#/accessconfiguration/cardholders\n\nEID: ${currentInstance.values["UT EID"]}`
  }).setColor(CalendarApp.EventColor.CYAN)
    .addPopupReminder(15);
}

/**
 * Generates a PDF file for building access requests using dynamic data from a form submission.
 * The PDF is created from an HTML template and saved to a designated Google Drive folder.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission,
 * including user details and submission timestamps.
 * @returns {GoogleAppsScript.Base.Blob} A blob representing the generated PDF file.
 */
function createPaperBuildingAccessForm(currentInstance) {
  /**
   * Formats a date string or Date object into a standard format.
   * @param {string|Date} date - The date to format.
   * @returns {string} A string representing the formatted date.
   */
  function formatDate(date) {
    date = typeof date == "string" ? new Date(date) : date;
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  /**
   * Calculates the next business day and sets a specific time for activations.
   * @returns {Date} The calculated next business day with a set time.
   */
  const nextBusinessDay = (date = new Date()) => {
    const today = typeof date == "string" ? new Date(date) : date;
    const daysLeftInWeek = 7 - today.getDay();
    const activeDay = daysLeftInWeek > 2 ? today.setDate(today.getDate() + 1) : today.setDate(today.getDate() + (daysLeftInWeek + 1));
    return new Date(new Date(activeDay).setHours(13, 0, 0));
  }

  // Populate dynamic data for the template
  const dynamicData = currentInstance.values;
  dynamicData["Signature"] = `William Veith wev222 ${currentInstance.values["Timestamp"]}`;
  dynamicData["Date Activated"] = formatDate(nextBusinessDay(currentInstance.values["Timestamp"]));
  dynamicData["Timestamp"] = formatDate(currentInstance.values["Timestamp"]);

  // Get the HTML template for the access form, populate it with dynamic data, and evaluate it
  const template = CONFIGS.Templates.get(CONFIGS.Templates.Access);
  template.dynamicData = dynamicData;
  template.qrCodeData = JSON.stringify(dynamicData);
  const htmlContent = template.evaluate();

  // Define the destination folder and file name for the PDF document
  const recordFolder = CONFIGS.Drive.get(CONFIGS.Drive.AccessForms);
  const fileName = `Access Control Request - ${currentInstance.values["Last Name"]}, ${currentInstance.values["First Name"]} - ${currentInstance.values["UT EID"]}`;

  // Create the PDF file in Google Drive from the evaluated HTML content
  const pdfFile = recordFolder.createFile(htmlContent.getBlob().getAs(MimeType.PDF))
    .setName(`${fileName}.pdf`)
    .setDescription(JSON.stringify(dynamicData));

  // Return the PDF file as a blob for further use or download
  return pdfFile.getAs(MimeType.PDF)
}

/**
 * Sends an email with an attached PDF file of a completed access control request.
 * This function composes an email with a predefined subject and body, attaches the provided PDF, and sends it
 * to a specified recipient. If the email fails to send, an error is logged.
 *
 * @param {GoogleAppsScript.Base.Blob} attachment - The PDF attachment containing the access control request.
 */
function emailAccessControlForm(attachment) {
  // Define the subject line and body content of the email.
  const subject = "Completed: Access Control Request";
  const body = "A completed Access Control Request has been created and completed by a new user. It is attached below.";
  try {
    // Send the email with the specified configurations and attachment.
    GmailApp.sendEmail(CONFIGS.Email.Gerlinde, subject, "", {
      from: CONFIGS.Email.William,
      htmlBody: body,
      name: "Automated Access Control Request",
      attachments: [attachment.getAs(MimeType.PDF)]
    })
  } catch (error) {
    // Log a message to the console if the email fails to send.
    Logger.log("Failed to send building access form");
  }
}

/**
 * Sends an email with personalized information and a link to a form for ordering cleanroom supplies.
 * This function utilizes a Google Apps Script HTML template for the email body, dynamically populated with user-specific data from the current instance.
 *
 * @param {CurrentInstance} currentInstance - An instance containing values from a form submission, such as user name, contact details, and other identifiers.
 */
function emailCleanroomSupplies(currentInstance) {
  const template = CONFIGS.Templates.get(CONFIGS.Templates.Supplies);

  // Populate the template with dynamic data for the user.
  template.dynamicData = {
    name: `${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`,
    url: `https://docs.google.com/forms/d/e/1FAIpQLSfYfbyHjrWy6XcvQSQl5J1hNzsLZjD3McOi5Ks-q33F6LhZqg/viewform?usp=pp_url&entry.1665609710=${encodeURIComponent(currentInstance.values["UT EID"])}&entry.1403771101=${encodeURIComponent(currentInstance.values["Phone Number"])}&entry.168334817=${encodeURIComponent(currentInstance.values["Email Address"])}&entry.1688326647=${encodeURIComponent(currentInstance.values["First Name"])}&entry.1438217424=${encodeURIComponent(currentInstance.values["Last Name"])}`
  };

  // Evaluate the HTML template to generate the final email body.
  const emailBody = template.evaluate().getContent();
  const progressBarHtml = CONFIGS.Templates.addProgressBar(CONFIGS.Templates.Supplies);
  const fullEmailHtml = emailBody + progressBarHtml;

  const emailSubject = `Get Cleanroom Supplies | Safety Training | ${currentInstance.values["UT EID"]}`;

  // Attempt to send the email using the configured details and the evaluated content.
  try {
    GmailApp.sendEmail(currentInstance.values["Email Address"], emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: fullEmailHtml,
      name: "Safety Training Automated Message"
    });
  } catch (error) {
    // Log an error if the email fails to send.
    Logger.log(`Failed to send email: ${error}`);
  }
}
