/**
 * Adds a participant to a training event based on the information from the submitted form. This function identifies the appropriate event using a date string from the current instance, checks for an existing trigger, creates a new trigger if necessary, and adds the participant as a guest to the event if they are not already listed.
 *
 * @param {CurrentInstance} currentInstance - The current instance of a spreadsheet on Form Submit event, handling specific interactions with Google Sheets.
 */
function addToTrainingEvent(currentInstance) {
  /**
   * Parses a date string to extract and construct start and end date objects.
   *
   * @param {string} dateString - A string containing date and time information in the format 'YYYY-MM-DD hh:mm to hh:mm'.
   * @returns {Date[]} An array containing two Date objects, the start and end times of the event.
   */
  function getDates(dateString) {
    const parts = dateString.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}:[0-9]{2}/g);
    return [new Date(`${parts[0]}T${parts[1]}:00`), new Date(`${parts[0]}T${parts[2]}:00`)];
  }

  /**
   * Retrieves the event ID and details using Calendar API
   * 
   * @param {string} calendarId - The calendar ID to search within
   * @param {Date} startDate - The start date of the time range to search
   * @param {Date} endDate - The end date of the time range to search
   * @param {string} eventTitle - The title of the event to search for
   * @returns {Object} The event object if found, null otherwise
   */
  function getEventIdAndDetails(calendarId, startDate, endDate, eventTitle) {
    const events = Calendar.Events.list(calendarId, {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    }).items;

    for (const event of events) {
      if (event.summary === eventTitle) {
        return event;
      }
    }
    return null;
  }

  const [startDate, endDate] = getDates(currentInstance.values["Training Session"]);

  const event = getEventIdAndDetails(CONFIGS.Calendar.Id, startDate, endDate, CONFIGS.Calendar.SafetyTraining);

  if (!event) {
    Logger.log(`Error adding user to safety training event: Event does not exist.
                Queried Event Title: ${CONFIGS.Calendar.SafetyTraining}
                Start Date: ${startDate}
                End Date: ${endDate}`);
    throw new Error(`Event not found: ${CONFIGS.Calendar.SafetyTraining}`);
  }

  const isAlreadyGuest = event.attendees === undefined ? false : event.attendees.some(guest => guest.email === currentInstance.values["Email Address"]);

  if (!isAlreadyGuest) {
    const attendees = event.attendees === undefined ? [] : event.attendees.map(guest => ({ email: guest.email }));
    attendees.push({ email: currentInstance.values["Email Address"] });

    const updatedEvent = {
      attendees: attendees
    };

    try {
      Calendar.Events.patch(updatedEvent, CONFIGS.Calendar.Id, event.id, { sendUpdates: 'all' });
      Logger.log('Added guest: %s', currentInstance.values["Email Address"]);
    } catch (error) {
      Logger.log('Error adding guest to safety training calendar event: %s', error.toString());
      return;
    }

    try {
      const eventTrigger = new EventTrigger(event);
      eventTrigger.create();
    } catch (error) {
      Logger.log(`Error creating or checking quiz emnail time trigger for calendar event: ${error.toString()}`);
      return;
    }
  }
}

/**
 * Retrieves all student data from the 'Training' sheet, returning a structured object indexed by student email addresses.
 * This function reads all rows from the specified sheet, uses the first row as headers, and constructs an object where each key is 
 * an email address and the value is an object containing all corresponding data for that student.
 *
 * @returns {Object} An object where each key is a student's email address and the value is an object of their data,
 * structured according to the headers in the sheet.
 */
function getAllStudents() {
  // Retrieve the data range from the 'Training' sheet and get all values.
  const rawValues = CONFIGS.Sheet.get(CONFIGS.Sheet.Training)
    .getDataRange()
    .getValues();

  // Extract headers from the first row.
  const headers = rawValues.shift();

  // Initialize an empty object to store each student's data indexed by their email address.
  const values = {};

  // Process each row to construct the student data object.
  rawValues.forEach(row => {
    const entry = {}
    // Populate the entry object with key-value pairs based on headers.
    row.forEach((value, index) => {
      entry[headers[index]] = value;
    })
    // Index the constructed entry object by the student's email address.
    values[entry["Email Address"]] = entry;
  });
  return values;
}

/**
 * Sends a training quiz to all attendees of a specific training event scheduled for the current day.
 * It checks for training events on the current day, retrieves registered students, and sends them an email with a personalized quiz link.
 * If no events are found or if other errors occur (such as failing to send an email), logs are generated for debugging purposes.
 */
function sendTrainingGroupQuiz() {
  // Set the time range for today to find events happening today
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Fetch the first event matching the safety training criteria for today
  const event = CONFIGS.Calendar.get().getEvents(startDate, endDate, { search: CONFIGS.Calendar.SafetyTraining })[0];

  // If no event is found, log the error and exit the function
  if (event === undefined) {
    Logger.log(`Function: sendTrainingGroupQuiz\nError: No Training Events Found\nCalendar ID: ${CONFIGS.Calendar.Id}\nStart Date: ${startDate}\nEnd Date: ${endDate}\nTitle: ${CONFIGS.Calendar.SafetyTraining}`);
    return;
  }

  // Retrieve all student data from the training sheet
  const allStudents = getAllStudents();

  // Send an email with a quiz link to each guest who has not declined the invitation
  event.getGuestList().forEach(guest => {
    try {
      if (guest.getGuestStatus() === CalendarApp.GuestStatus.NO) {
        Logger.log(`Training Quiz not sent to: ${guest.getEmail()}\nReason: Declined calendar invite`)
        return;
      }
      const email = guest.getEmail();
      const url = `https://docs.google.com/forms/d/e/1FAIpQLSd1UHR6E5TShf3hL70CHwkmFmU_xotlLh5h_7LqzHSyNcv8kA/viewform?usp=pp_url&entry.283917136=${encodeURIComponent(allStudents[email]["UT EID"])}&entry.2131416682=${encodeURIComponent(allStudents[email]["First Name"])}&entry.252391519=${encodeURIComponent(allStudents[email]["Last Name"])}`

      let template = CONFIGS.Templates.get(CONFIGS.Templates.Quiz);
      template.dynamicData = {
        name: `${allStudents[email]["First Name"]} ${allStudents[email]["Last Name"]}`,
        url: url
      };

      const emailBody = template.evaluate().getContent();
      const progressBarHtml = CONFIGS.Templates.addProgressBar(CONFIGS.Templates.Quiz);
      const fullEmailHtml = emailBody + progressBarHtml;

      const emailSubject = `Quiz | Safety Training | ${allStudents[email]["UT EID"]}`
      GmailApp.sendEmail(email, emailSubject, "", {
        from: CONFIGS.Email.William,
        htmlBody: fullEmailHtml,
        name: "Safety Training Automated Message"
      });
    } catch (error) {
      Logger.log(`Failed to send email: ${error}`);
    }
  })

  // Clean up event trigger associated with this event after sending the quiz
  const eventTrigger = new EventTrigger(event);
  eventTrigger.destroy();
}

/**
 * Updates the dropdown list in the Google Form associated with training events by fetching upcoming events from a Google Calendar and formatting their date and time into a dropdown list. This function adjusts the form to reflect events that are scheduled to start from the next day and extend up to two months into the future.
 */
function updateTrainingDropdown() {
  /**
   * Formats the period of an event into a string suitable for dropdown display.
   * 
   * @param {Date} start - The start time of the event.
   * @param {Date} end - The end time of the event.
   * @returns {string} The formatted date and time string.
   */
  const formatEventPeriod = (start, end) => {
    const timeZone = Session.getScriptTimeZone();
    const dateFormat = "yyyy-MM-dd";
    const timeFormat = "HH:mm";
    return `${Utilities.formatDate(start, timeZone, dateFormat)} | ${Utilities.formatDate(start, timeZone, timeFormat)} to ${Utilities.formatDate(end, timeZone, timeFormat)}`;
  }

  // Set the start date to tomorrow.
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  // Set the end date to two months from the start date.
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 2);

  // Retrieve the form URL from configuration and access the form.
  const formUrl = CONFIGS.Sheet.get(CONFIGS.Sheet.Training).getFormUrl();
  const dropdownItem = FormApp.openByUrl(formUrl).getItems(FormApp.ItemType.LIST)[0].asListItem();

  // Fetch events from the calendar that are tagged with 'SafetyTraining'.
  const events = CONFIGS.Calendar.get().getEvents(startDate, endDate, { search: CONFIGS.Calendar.SafetyTraining });

  // Map each event to a formatted string and create a choice for each event.
  const choices = events.map(event => formatEventPeriod(event.getStartTime(), event.getEndTime()))
    .map(choiceText => dropdownItem.createChoice(choiceText));

  // Set the dropdown choices to the newly created list of choices.
  dropdownItem.setChoices(choices);
}