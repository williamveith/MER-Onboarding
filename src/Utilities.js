/**
 * Creates and displays a custom menu in the Google Sheets UI with multiple utilities that users can run.
 * Each utility corresponds to a specific action, such as generating badge strings or sending emails.
 */
function openUtilitiesWindow() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Utilities')
    .addItem('Create: Badges', 'uiOption_makeBadges')
    .addSeparator()
    .addItem('Update: Building Access Form', 'uiOption_createBuildingAccessForm')
    .addItem('Create: Lab Access Account', 'uiOption_createLabAccess')
    .addSeparator()
    .addItem('Email: Training Request Form', 'uiOption_sendRequestTrainingEmail')
    .addItem('Email: Safety Quiz', 'uiOption_sendQuizEmail')
    .addItem('Email: Building Access Form', 'uiOption_sendBuildingAccessEmail')
    .addItem('Email: Basket Reservation Form', 'uiOption_sendBasketRequestEmail')
    .addSeparator()
    .addItem('Update: Return Basket', 'uiOption_returnBaskets')
    .addItem('Update: Active Users', 'uiOption_updateActiveUsers')
    .addSeparator()
    .addSubMenu(ui.createMenu('Email Templates')
      .addItem('Step 1: Training Request', 'uiOption_sendTrainingRequestEmailTemplate'))
    .addToUi();
}

/**
 * Triggers a user input dialog for generating badge strings based on user data.
 */
function uiOption_makeBadges() {
  createUserInput("makeBadges");
}

/**
 * Triggers a user input dialog for generating building access paper forms based on user data.
 */
function uiOption_createBuildingAccessForm() {
  createUserInput("updatePaperAccessForm");
}

/**
 * Triggers a user input dialog for sending a quiz email to specified recipients.
 */
function uiOption_sendQuizEmail() {
  createUserInput("sendOneOffQuizEmail");
}

/**
 * Triggers a user input dialog for creating lab access accounts.
 */
function uiOption_createLabAccess() {
  createUserInput("createOneOffLabAccess");
}

/**
 * Triggers a user input dialog for sending training request emails.
 */
function uiOption_sendRequestTrainingEmail() {
  createUserInput("sendRequestTrainingEmail");
}

/**
 * Displays a user input interface for sending a building access email.
 * Calls the `createUserInput` function with the appropriate parameter.
 */
function uiOption_sendBuildingAccessEmail() {
  createUserInput("sendBuildingAccessEmail");
}

/**
 * Displays a user input interface for returning baskets.
 * Calls the `createUserInput` function with the appropriate parameter.
 */
function uiOption_returnBaskets() {
  createUserInput("returnBaskets")
}

/**
 * Displays a user input interface for sending a basket request email.
 * Calls the `createUserInput` function with the appropriate parameter.
 */
function uiOption_sendBasketRequestEmail() {
  createUserInput("sendBasketRequestEmail");
}

/**
 * On a time based trigger to update active users by collecting all users found on NNCI Invoices over the last X number of months. The X number of months can be found in the Active Users.gs file
 */
function uiOption_updateActiveUsers() {
  updateActiveUsers();
  updateBasketActiveUserStatus();
}

/**
 * Displays a user input interface for adding basket exemptions.
 * Calls the `createUserInput` function with the appropriate parameter.
 */
function uiOption_addBasketExemptions() {
  createUserInput("addBasketExemptions");
}

/**
 * Displays a user input interface for sending a training request email template.
 * Calls the `createUserInput` function with the appropriate parameter.
 */
function uiOption_sendTrainingRequestEmailTemplate() {
  createUserInput("sendTrainingRequestEmailTemplate");
}

/**
 * Creates a user input dialog specific to the selected function from the Utilities menu.
 * It ensures the user is on the correct sheet and provides a customized prompt for input.
 *
 * @param {string} functionName - The name of the function associated with the specific user input required.
 */
function createUserInput(functionName) {
  let sheetName = undefined;
  let entryType = undefined;
  let options = [];
  switch (functionName) {
    case "makeBadges":
      sheetName = CONFIGS.Sheet.Registration;
      entryType = "Enter row(s) with info for badge(s)";
      break;
    case "updatePaperAccessForm":
      sheetName = CONFIGS.Sheet.Registration;
      entryType = "Enter row(s) with info for building access(s)";
      break;
    case "createOneOffLabAccess":
      sheetName = CONFIGS.Sheet.Registration;
      entryType = "Enter row(s) with info for lab access account(s)";
      break;
    case "sendOneOffQuizEmail":
      sheetName = CONFIGS.Sheet.Training;
      entryType = "Enter row(s) with email address(es) to sent quiz to";
      break;
    case "sendRequestTrainingEmail":
      sheetName = "ANY";
      entryType = "Enter email address(es) to send onboarding to";
      break;
    case "sendBuildingAccessEmail":
      sheetName = "ANY";
      entryType = "Enter email address(es) to send onboarding to";
      break;
    case "returnBaskets":
      sheetName = CONFIGS.Sheet.BasketIndex;
      entryType = "Enter row(s) with info for lab access account(s)"
      break;
    case "sendBasketRequestEmail":
      sheetName = "ANY";
      entryType = "Enter email address(es) to send basket request to";
      break;
    case "sendTrainingRequestEmailTemplate":
      sheetName = "ANY";
      entryType = "Enter email address(es) to send template email for requesting trainings";
  }

  const activeSheetName = SpreadsheetApp.getActiveSheet().getName();
  if (activeSheetName !== sheetName && sheetName !== "ANY") {
    const wrongSheetWarning = `You are on the incorrect sheet\n\nActive Sheet: ${activeSheetName}\nRequired Sheet: ${sheetName}`;
    SpreadsheetApp.getUi().alert(wrongSheetWarning);
  } else {
    const template = CONFIGS.Templates.get(CONFIGS.Templates.TextInput);
    template.sheetName = sheetName;
    template.entryType = entryType;
    template.functionName = functionName;
    const html = template.evaluate()
      .setWidth(600)
      .setHeight(200);
    SpreadsheetApp.getUi()
      .showModalDialog(html, " ");
  }
}

/**
 * Processes input from a form object to extract and validate row numbers. This function supports ranges (e.g., "1-5") and
 * single rows separated by commas. It creates instances for each valid row number in a specified sheet.
 *
 * @param {Object} formObject - The form object containing the user's input.
 * @param {string} sheetName - The name of the sheet where the rows will be processed.
 * @returns {Array<CurrentInstance>} An array of CurrentInstance objects for each valid row.
 */
function processRowNumberInput(formObject, sheetName) {
  Logger.log(formObject)
  const input = formObject.inputText.replace(" ",);
  const rows = input.split(/,/).map(rowNumber => {
    if (rowNumber.includes("-")) {
      const startEnd = rowNumber.split(/-/);
      const range = [];
      while (startEnd[0] <= startEnd[1]) {
        range.push(parseInt(startEnd[0]));
        startEnd[0]++;
      }
      return range;
    }
    return [parseInt(rowNumber)]
  }).flat();

  const uniqueRows = [...new Set(rows)];

  const instances = uniqueRows.map(rowNumber => CurrentInstance.createEvent(sheetName, rowNumber));
  return instances;
}

/**
 * Processes email addresses from a form input, ensuring they meet a basic email format. Filters out invalid emails
 * and duplicates.
 *
 * @param {FormObject} formObject - The form object containing text input from a user.
 * @returns {Array<string>} An array of unique and valid email addresses.
 */
function processEmailAddressInput(formObject) {
  const input = formObject.inputText;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailAddresses = input.split(/[^a-zA-Z0-9.+_@-]+|,/g).filter(email => email !== '' && emailRegex.test(email));
  return [...new Set(emailAddresses)];
}

/**
 * Updates the PDF building access form. This is used when the student ID's improperly covert to scientific notation.
 * 
 * @param {Object} formObject - The form object containing input specifying row numbers in the Registration sheet.
 */
function updatePaperAccessForm(formObject) {
  const currentInstancesInput = processRowNumberInput(formObject, CONFIGS.Sheet.Registration);
  const currentInstances = Array.isArray(currentInstancesInput) ? currentInstancesInput : [currentInstancesInput];
  currentInstances.forEach(currentInstance => createPaperBuildingAccessForm(currentInstance))
}

/**
 * Sends a customized quiz email to the specified recipients. Each recipient's details are dynamically inserted into the quiz URL.
 *
 * @param {Object} formObject - The form object containing input specifying row numbers in the Training sheet.
 */
function sendOneOffQuizEmail(formObject) {
  const currentInstancesInput = processRowNumberInput(formObject, CONFIGS.Sheet.Training);
  const currentInstances = Array.isArray(currentInstancesInput) ? currentInstancesInput : [currentInstancesInput];
  currentInstances.forEach(currentInstance => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSd1UHR6E5TShf3hL70CHwkmFmU_xotlLh5h_7LqzHSyNcv8kA/viewform?usp=pp_url&entry.283917136=${encodeURIComponent(currentInstance.values["UT EID"])}&entry.2131416682=${encodeURIComponent(currentInstance.values["First Name"])}&entry.252391519=${encodeURIComponent(currentInstance.values["Last Name"])}`;

    let template = CONFIGS.Templates.get(CONFIGS.Templates.Quiz);
    template.dynamicData = {
      name: `${currentInstance.values["First Name"]} ${currentInstance.values["Last Name"]}`,
      url: url
    };

    const emailBody = template.evaluate().getContent();
    const progressBarHtml = CONFIGS.Templates.addProgressBar(CONFIGS.Templates.Quiz);
    const fullEmailHtml = emailBody + progressBarHtml;

    const emailSubject = `Quiz | Safety Training | ${currentInstance.values["UT EID"]}`;

    GmailApp.sendEmail(currentInstance.values["Email Address"], emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: fullEmailHtml,
      name: "Safety Training Automated Message"
    });
  });
}

/**
 * Processes the form data to retrieve basket IDs and returns them using the `returnBasket` function.
 *
 * @param {FormObject} formObject - The form data object containing the input text.
 */
function returnBaskets(formObject) {
  const currentInstancesInput = processRowNumberInput(formObject, CONFIGS.Sheet.BasketIndex);
  const currentInstances = Array.isArray(currentInstancesInput) ? currentInstancesInput : [currentInstancesInput];
  const basketIdsInput = currentInstances.map(instance => instance.values["Basket ID"])
  returnBasket(basketIdsInput)
}

/**
 * Processes input from a form to create lab access accounts for specified rows in the Registration sheet.
 * It utilizes the `processRowNumberInput` function to get the row numbers and then submits a form for each row to create lab access.
 *
 * @param {Object} formObject - The form object containing input specifying row numbers in the Registration sheet.
 */
function createOneOffLabAccess(formObject) {
  const currentInstancesInput = processRowNumberInput(formObject, CONFIGS.Sheet.Registration);
  const currentInstances = Array.isArray(currentInstancesInput) ? currentInstancesInput : [currentInstancesInput];
  currentInstances.forEach(currentInstance => submitLabAccessForm(currentInstance));
}

/**
 * Sends onboarding emails to new users with a link to complete necessary training forms. The function processes
 * input email addresses to ensure validity, then sends an email to each with personalized information.
 *
 * @param {Object} formObject - The form object containing input with email addresses to whom the training request will be sent.
 */
function sendRequestTrainingEmail(formObject) {
  const emailAddressInputs = processEmailAddressInput(formObject);
  const emailAddresses = Array.isArray(emailAddressInputs) ? emailAddressInputs : [emailAddressInputs];
  emailAddresses.forEach(emailAddress => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLScLhxLgJWZLMs2f5JHSxSCYXTRkl56-Cx6zIVKJOFPDx18Qvg/viewform?usp=pp_url&entry.2100904761=${encodeURIComponent(emailAddress)}`;
    let template = CONFIGS.Templates.get(CONFIGS.Templates.TrainingRequest);
    template.dynamicData = {
      url: url
    };

    const emailBody = template.evaluate().getContent();
    const progressBarHtml = CONFIGS.Templates.addProgressBar(CONFIGS.Templates.TrainingRequest);
    const fullEmailHtml = emailBody + progressBarHtml;

    const emailSubject = `MER | New User Onboarding`;

    GmailApp.sendEmail(emailAddress, emailSubject, "", {
      from: CONFIGS.Email.William, // Remember you changed this in the CONFIGS so it just uses the session email
      htmlBody: fullEmailHtml,
      name: "New User Onboarding Automated Message"
    });
  });
}

/**
 * Processes email address input from the form data and sends building access emails to the provided addresses.
 *
 * @param {FormObject} formObject - The form data object containing the input text.
 */
function sendBuildingAccessEmail(formObject) {
  const emailAddressInputs = processEmailAddressInput(formObject);
  const emailAddresses = Array.isArray(emailAddressInputs) ? emailAddressInputs : [emailAddressInputs];
  emailAddresses.forEach(emailAddress => {
    const template = CONFIGS.Templates.get(CONFIGS.Templates.QuizPass);

    template.dynamicData = {
      name: `MER User`,
      url: `https://docs.google.com/forms/d/e/1FAIpQLSfki9Rbsr1-miVmU_caLP1GNPRZnrHwrJvVafAHRUNJA3uyCA/viewform?usp=pp_url&entry.638397220=${encodeURIComponent(emailAddress)}&entry.537644763=No`
    }
    const emailSubject = `${CONFIGS.Templates.QuizPass} | Safety Training | MER User`

    GmailApp.sendEmail(emailAddress, emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: template.evaluate().getContent(),
      name: "Safety Training Automated Message"
    });
  });
}

/**
 * Sends a basket request email to the specified recipients.
 *
 * @param {Object} formObject - The form object containing input with email addresses to whom the basket request will be sent.
 */
function sendBasketRequestEmail(formObject) {
  const emailAddressInputs = processEmailAddressInput(formObject);
  const emailAddresses = Array.isArray(emailAddressInputs) ? emailAddressInputs : [emailAddressInputs];
  emailAddresses.forEach(emailAddress => {
    const template = CONFIGS.Templates.get(CONFIGS.Templates.Supplies);

    template.dynamicData = {
      name: `MER User`,
      url: `https://docs.google.com/forms/d/e/1FAIpQLSfYfbyHjrWy6XcvQSQl5J1hNzsLZjD3McOi5Ks-q33F6LhZqg/viewform?usp=pp_url&entry.168334817=${encodeURIComponent(emailAddress)}`

    };

    const emailSubject = `Get Cleanroom Supplies | Safety Training | MER User`;

    GmailApp.sendEmail(emailAddress, emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: template.evaluate().getContent(),
      name: "Safety Training Automated Message"
    });
  })
}

/**
 * Sends training request email templates to the specified recipients.
 *
 * @param {Object} formObject - The form object containing input with email addresses to whom the template email will be sent.
 */
function sendTrainingRequestEmailTemplate(formObject) {
  const emailAddressInputs = processEmailAddressInput(formObject);
  const emailAddresses = Array.isArray(emailAddressInputs) ? emailAddressInputs : [emailAddressInputs];
  emailAddresses.forEach(emailAddress => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLScLhxLgJWZLMs2f5JHSxSCYXTRkl56-Cx6zIVKJOFPDx18Qvg/viewform`;
    let template = CONFIGS.Templates.get(CONFIGS.Templates.TrainingRequest);
    template.dynamicData = {
      url: url
    };

    const emailBody = template.evaluate().getContent();
    const progressBarHtml = CONFIGS.Templates.addProgressBar(CONFIGS.Templates.TrainingRequest);
    const fullEmailHtml = emailBody + progressBarHtml;

    const emailSubject = `MER | New User Onboarding`;

    GmailApp.sendEmail(emailAddress, emailSubject, "", {
      from: CONFIGS.Email.William,
      htmlBody: fullEmailHtml,
      name: "New User Onboarding Automated Message"
    });
  })
}