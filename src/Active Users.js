/**
 * Compiles and updates a list of active users based on their latest activity across multiple inventory data sheets
 * for the past several months. It formats and stores this data in a designated Google Sheets tab.
 */
function updateActiveUsers() {
  const activePeriod = 6; // Months
  const headers = ["First Name Last Name", "Group", "Date", "Time", "Tool", "Use"];
  const numberFormatHead = ["@", "@", "@", "@", "@", "@"];
  const numberFormatBody = ["@", "@", "yyyy-MM-dd", "HH:mm:ss", "@", "#,##0.00000"];

  const today = new Date();
  const timezone = Session.getScriptTimeZone();
  // Generate folder names for the past six months
  const monthFolderNames = [...Array(activePeriod)].map(() => {
    today.setMonth(today.getMonth() - 1)
    return Utilities.formatDate(today, timezone, "yyyy-MM")
  });

  const allMonthsFolder = CONFIGS.Drive.get(CONFIGS.Drive.All);
  const invData = {};
  // Collect data from all inventory files in the respective month folders
  monthFolderNames.forEach(monthFolderName => {
    const folderId = allMonthsFolder.getFilesByName(monthFolderName).next().getTargetId();
    const invFiles = DriveApp.getFolderById(folderId).getFoldersByName("inv").next().getFiles();
    while (invFiles.hasNext()) {
      invFiles.next().getBlob().getDataAsString().split("\r\n").slice(3, -1).forEach(row => {
        const dataRow = row.split("\t")
        const user = dataRow[3]
        if (!invData[user] || invData[user].datetime < dataRow[0] + ' ' + dataRow[1]) {
          invData[user] = { datetime: dataRow[0] + ' ' + dataRow[1], row: dataRow }
        }
      });
    }
  })
  const results = Object.values(invData)
    .map(entry => [entry.row[3], entry.row[2], entry.row[0], entry.row[1], entry.row[4], entry.row[5]].map(value => value.trim()))

  const numberFormat = results.map(row => numberFormatBody)
  numberFormat.unshift(numberFormatHead)
  results.unshift(headers)

  const activeUserSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.Active) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(CONFIGS.Sheet.Active)
  activeUserSheet.clear();
  const dataRange = activeUserSheet.getRange(1, 1, results.length, results[0].length)
  dataRange.setValues(results)
    .setNumberFormats(numberFormat)
    .setFontSize(12)
    .setFontFamily('Courier New')
    .setFontColor('black')

  activeUserSheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground("#efefef")
  activeUserSheet.setFrozenRows(1);

  dataRange.setHorizontalAlignment("left")

  let filter = dataRange.getFilter();
  if (filter) {
    filter.remove();
  }
  const newFilter = dataRange.createFilter()
  newFilter.sort(1, true)
}

/**
 * Updates the 'Active' status of users in the basket index based on their recent activity in the lab.
 * Users who haven't registered activity past a defined grace period are marked as inactive.
 */
function updateBasketActiveUserStatus() {
  const gracePeriod = 60; // Days
  const basketIndexSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.BasketIndex);
  const basketIndex = [];
  const basketIndexValues = basketIndexSheet.getDataRange().getValues();
  const basketIndexHeaders = basketIndexValues.shift();
  basketIndexValues.forEach((row, index) => {
    if (row[basketIndexHeaders.indexOf("Basket Avaliable")]) {
      return
    }
    // Compiles basket index information.
    basketIndex.push({
      row: index + 2,
      user: `${row[basketIndexHeaders.indexOf("First Name")]} ${row[basketIndexHeaders.indexOf("Last Name")]}`,
      currentActiveStatus: row[basketIndexHeaders.indexOf("User Active")],
      registeredFor: (new Date() - row[basketIndexHeaders.indexOf("Timestamp")]) / (1000 * 60 * 60 * 24)
    });
  });

  const activeUsersSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.Active);
  const activeUsersValues = activeUsersSheet.getDataRange().getValues();
  const activeUsersHeaders = activeUsersValues.shift();
  const activeUsers = {};
  activeUsersValues.forEach((row, index) => {
    activeUsers[row[activeUsersHeaders.indexOf("First Name Last Name")]] = index + 2;
  });

  const specialCases = new BasketExemption()
  specialCases.exemptUsers.forEach((user, index) => activeUsers[user] = index)

  const userActiveStatus = basketIndex.map(basket => {
    return {
      row: basket.row,
      "newActivityStatus": activeUsers.hasOwnProperty(basket.user),
      "oldActivityStatus": basket.currentActiveStatus,
      user: basket.user,
      registeredFor: basket.registeredFor
    };
  });
  const statusNeedsUpdate = userActiveStatus.filter(user => user["newActivityStatus"] !== user["oldActivityStatus"] && user.registeredFor > gracePeriod);

  // Update the user active status in the basket index sheet.
  statusNeedsUpdate.forEach(status => {
    basketIndexSheet.getRange(`D${status.row}`).setValue(status["newActivityStatus"]);
    Logger.log(`${status.user} went from ${status["oldActivityStatus"] ? "Active" : "Inactive"} to ${status["newActivityStatus"] ? "Active" : "Inactive"}`);
  });
}

/**
 * Sends a purge warning form email to users with inactive baskets.
 * This function checks the basket index sheet for users with inactive and unavailable baskets,
 * creates a form link for each user, and sends an email with the purge warning form.
 */
function sendPurgeWarningForm() {
  const basketIndexSheet = CONFIGS.Sheet.get(CONFIGS.Sheet.BasketIndex);
  const inactiveUsers = [];
  const basketIndexValues = basketIndexSheet.getDataRange().getValues();
  const headers = basketIndexValues.shift()
  const activeStatusIndex = headers.indexOf("User Active");
  const avaliableStatusIndex = headers.indexOf("Basket Available");

  basketIndexValues.forEach((row, index) => {
    if (row[avaliableStatusIndex] === false && row[activeStatusIndex] === false) {
      const user = CurrentInstance.createEvent(CONFIGS.Sheet.BasketIndex, index + 2);
      inactiveUsers.push(user);
    }
  });

  inactiveUsers.forEach(inactiveUser => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSd7UFYFDiByRX9wYhvcq6V_A-GV2Tp2N6pDxp6CwfA29ywOJg/viewform?usp=pp_url&entry.195529864=${inactiveUser.values["UT EID"]}&entry.1486300689=${inactiveUser.values["First Name"]}&entry.1400065751=${inactiveUser.values["Last Name"]}`
    let template = CONFIGS.Templates.get(CONFIGS.Templates.BasketPurge);

    template.dynamicData = {
      "First Name": inactiveUser.values["First Name"],
      "Last Name": inactiveUser.values["Last Name"],
      "Basket ID": inactiveUser.values["Basket ID"],
      url: url
    };

    GmailApp.sendEmail(inactiveUser.values["Email Address"], `Inactive Basket Purge Notification`, "", {
      from: CONFIGS.Email.William,
      htmlBody: template.evaluate().getContent(),
      name: "Automated Basket Purge"
    });
  })
}

/**
 * Adds basket exemptions for the given instances.
 * This function creates a new instance of BasketExemption and adds exemptions for each current instance provided.
 *
 * @param {CurrentInstance[]} currentInstances - An array of CurrentInstance objects representing the current instances to be processed.
 */
function addBasketExemptions(currentInstances) {
  currentInstances = Array.isArray(currentInstances) ? currentInstances : [currentInstances]
  const exemptions = new BasketExemption()
  currentInstances.forEach(currentInstance => {
    exemptions.add(`${currentInstance["First Name"]} ${currentInstance["Last Name"]}`, currentInstance.type[exemptionInfo["type"]]);
  })
}