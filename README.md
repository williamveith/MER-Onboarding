# MER User Onboarding

## Overview

The MER Onboarding System is an advanced automation platform specifically designed to manage and monitor user activities in a lab environment. This system seamlessly integrates user management by scheduling safety training, issuing calendar invites, administering knowledge tests, registering users in the MER directory, and managing digital account creation. It also handles operational tasks such as assigning and revoking basket assignments, generating cleanroom badges, and auto-purging inactive basket assignments to optimize resource utilization and ensure compliance with lab safety standards.

### Key Functionalities

- **Safety Training Scheduling**: Automatically schedules safety training sessions for users, ensuring compliance with lab safety standards.
- **Calendar Invitations**: Sends out calendar invites for training sessions, efficiently managing attendance and scheduling.
- **Knowledge Testing**: Administers tests to evaluate user knowledge on safety materials, essential for maintaining high safety standards.
- **User Registration**: Registers users in the MER directory, which includes creating digital accounts necessary for accessing various lab resources.
- **Basket Management**: Assigns and revokes basket assignments based on user needs and activities, optimizing resource allocation.
- **Cleanroom Badge Creation**: Generates and assigns cleanroom badges, facilitating secure and authorized access to sensitive lab areas.
- **Auto-purge of Inactive Assignments**: Automatically purges basket assignments based on user inactivity, helping to maintain an up-to-date user activity record and efficient use of resources.

This system leverages a variety of Google Workspace tools, including Google Sheets, Google Drive, and Google Calendar, to streamline processes and enhance operational efficiency in lab environments. By automating these tasks, the system significantly reduces administrative overhead, improves accuracy, and ensures a high level of user compliance and safety in the lab.

## Features

### 1. Active User Compilation

- **Functionality**: This feature compiles a comprehensive list of active users based on their most recent activities over a defined period (default is the past six months).
- **Implementation**: The system parses multiple inventory files stored in Google Drive, extracts relevant user activity data, and formats this data into a structured list.
- **Output**: The results are formatted and stored in a designated Google Sheets tab, with extensive formatting to ensure readability and immediate usability.

### 2. Basket Management

- **Functionality**: Manages the assignment and tracking of baskets used in lab environments, which are essential for managing user access to resources.
- **Implementation**: The script checks for user activity and updates basket allocation status accordingly. It handles basket assignments based on cleanroom access needs and updates existing assignments as required.
- **Notifications**: In case of inactivity, the system sends automated purge warnings to users, prompting them to reactivate or return their baskets.

### 3. Automated Communications

- **Functionality**: Sends out various automated communications related to user activities and statuses. This includes emails for lab access confirmation, basket assignments, and purge warnings.
- **Implementation**: Utilizes Google Apps Script's email capabilities to send personalized messages based on user activity and status. It also manages SMS notifications through email to SMS gateways for immediate user alerts.

### 4. Form Submission Handling

- **Functionality**: Automates the response to Google Forms submissions related to lab access and safety training.
- **Implementation**: Processes form submissions to update user records, assign resources, and trigger corresponding actions like sending emails or updating database entries.

### 5. QR Code Generation

- **Functionality**: Generates QR codes for easy access and identification of user baskets.
- **Implementation**: Each assigned basket gets a unique QR code containing relevant user information, which is then printed and can be scanned for quick access.

### 6. User Activity Monitoring

- **Functionality**: Monitors and updates the active status of users based on predefined criteria and timelines.
- **Implementation**: Reviews user activity logs to determine if users remain active within the grace period. Inactive users are automatically marked and notified.

## Technical Architecture

- **Languages**: JavaScript (Google Apps Script)
- **Platforms**: Google Workspace (Google Sheets, Google Drive, Google Calendar, Google Forms)
- **Data Handling**: Script interacts with various Google Sheets to read and write data, utilizes Google Drive for file management, and integrates with Google Calendar for scheduling and event management.

## Configuration and Setup

1. **Google Drive Setup**: Ensure all required folders and files are correctly set up in Google Drive.
2. **Google Sheets Integration**: Set up the necessary sheets with the correct formats and permissions.
3. **Scripts and Triggers**: Deploy the Google Apps Script and configure triggers for automated task execution.

## Usage

- **Updating Active Users**: Run the `updateActiveUsers` function manually or set a trigger for periodic updates.
- **Basket Management**: Monitor the basket management functions via the dedicated Google Sheets and ensure that communications are correctly configured to notify users as needed.

## Project Structure

```txt
New User Onboarding
├── README.md
├── package-lock.json
├── package.json
└── src
    ├── Access Control Request.html
    ├── Active Users.js
    ├── Badges.html
    ├── Basket Assignment Email.html
    ├── Basket Assignment.js
    ├── Basket QR Code.html
    ├── Classes.js
    ├── Configurations.js
    ├── Event Handler.js
    ├── Failed Quiz.html
    ├── Get Cleanroom Supplies.html
    ├── HTML Footer.html
    ├── Inactive Basket Email.html
    ├── Lab Access & Sedona Registration.js
    ├── Lab Access Account Confirmation.html
    ├── Lab Access Calendar Event.html
    ├── Lab Access Text.html
    ├── MER Directory & Building Access Registration.js
    ├── Make Badges.js
    ├── No Baskets Available Email.html
    ├── Passed Quiz.html
    ├── Quiz OH 102.js
    ├── Quiz.html
    ├── Request Training.html
    ├── Safety Training Requests.js
    ├── Text Input.html
    ├── Unit Test.js
    ├── Utilities.js
    └── appsscript.json
```
