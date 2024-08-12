function segfsaefrewfrqw(){
  console.log(Session.getActiveUser().getEmail())
}
function updatePaperAccessForm() {
  const currentInstance = CurrentInstance.createEvent(CONFIGS.Sheet.Registration, 67)
  createPaperBuildingAccessForm(currentInstance);
}

function createPaperBuildingAccessForm1(currentInstance) {
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



  console.log(dynamicData);
  console.log(JSON.stringify(dynamicData));
}
