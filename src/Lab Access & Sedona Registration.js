/**
 * Creates a calendar event for a new lab access account setup, using details from the provided lab access instance.
 * The event includes a dynamically generated description based on template data.
 *
 * @param {LabAccess} labAccessInstance - An instance containing lab access data and user details.
 */
function saveLabAccessAccountCreateToCalendar(labAccessInstance) {
  const title = `Lab Access: Create Account | User: ${labAccessInstance.name}`;

  // Dynamically generate the event description from a template
  const description = (() => {
    let template = CONFIGS.Templates.get(CONFIGS.Templates.LabAccessEvent);
    template.dynamicData = labAccessInstance.dynamicData;
    return template.evaluate().getContent();
  })();

  // Create the calendar event with the specified title, times, and description
  CONFIGS.Calendar.get().createEvent(title, ...labAccessInstance.startAndEndTime, {
    description: description
  }).setColor(CalendarApp.EventColor.GRAY)
    .addPopupReminder(15);
}

/**
 * Sends an automated text message (via email to a SMS gateway) about lab access account setup.
 *
 * @param {LabAccess} labAccessInstance - An instance containing lab access data and user details.
 */
function sendLabAccessText(labAccessInstance) {
  let template = CONFIGS.Templates.get(CONFIGS.Templates.LabAccessText);
  template.dynamicData = labAccessInstance.dynamicData;

  // Send the email with the dynamically generated content
  GmailApp.sendEmail(CONFIGS.Email.Phone, "New User Setup", "", {
    from: CONFIGS.Email.William,
    htmlBody: template.evaluate().getContent(),
    name: "New User Setup"
  });
}

/**
 * Sends an email confirmation for lab access and Sedona account setup, including detailed instructions and account info.
 *
 * @param {LabAccess} labAccessInstance - An instance containing lab access data and user details.
 */
function sendLabAccessConfirmation(labAccessInstance) {
  const subject = `Lab Access & Sedona Account Info | ${labAccessInstance.dynamicData["Name"]} | ${labAccessInstance.dynamicData["UT EID"]}`;
  let template = CONFIGS.Templates.get(CONFIGS.Templates.LabAccessEmail);
  template.dynamicData = labAccessInstance.dynamicData;

  // Send the email with the dynamically generated content
  GmailApp.sendEmail(labAccessInstance.dynamicData["Email Address"], subject, "", {
    from: CONFIGS.Email.William,
    htmlBody: template.evaluate().getContent(),
    name: "Lab Access Automated Message"
  });
}

/**
 * Creates a vCard file for a user with details from the lab access instance and saves it to Google Drive.
 *
 * @param {LabAccess} labAccessInstance - An instance containing lab access data and user details.
 */
function saveVCard(labAccessInstance) {
  const vCardData = `BEGIN:VCARD\r\nVERSION:4.0\r\nN:${labAccessInstance.currentInstance.values["Last Name"]};${labAccessInstance.currentInstance.values["First Name"]}\r\nFN:${labAccessInstance.dynamicData["Name"]}\r\nORG:MER\r\nTEL;TYPE=cell:${labAccessInstance.dynamicData["Phone Number"]}\r\nEMAIL;TYPE=work:${labAccessInstance.dynamicData["Email Address"]}\r\nNOTE:${labAccessInstance.dynamicData["UT EID"]}\r\nEND:VCARD`;
  const fileName = `${labAccessInstance.dynamicData["UT EID"]} - ${labAccessInstance.dynamicData["Name"]}.vcf`;
  const folder = CONFIGS.Drive.get(CONFIGS.Drive.Vcards);

  // Create and save the vCard file in the specified folder
  const file = folder.createFile(fileName, vCardData, "text/vcard");
  file.setDescription(JSON.stringify(labAccessInstance.dynamicData));
}