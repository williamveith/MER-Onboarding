# New User Onboarding App in Google Apps Script

This project sets up a Google Apps Script project using `clasp` for local development.

## Steps to Create the Project

1. **Create Project Directory and `src` Folder**

   ```bash
   mkdir src
   ```

2. **Initialize npm Project**

   ```bash
   npm init -y
   ```

3. **Install clasp as a Dev Dependency**

   ```bash
   npm install @google/clasp --save-dev
   ```

4. **Create `.claspignore` File**

   ```bash
   touch .claspignore
   ```

5. **Edit `.claspignore` File**

   Open `.claspignore` in a text editor and add the following lines:

   ```plaintext
   **/**
   !src/**
   src/.clasp.json
   ```

6. **Login to clasp**

   ```bash
   clasp login
   ```

7. **Clone Existing Google Apps Script Project**

   Clone the project and place it inside the `src` folder:

   ```bash
   clasp clone "1cdEMrYrx6QgMV9AG6pPuJvX2bG0Ijb8c7FSL2YMfo7QyD4xyAw-MH3tR" --rootDir ./src
   ```

8. **Login Using the `clasp-credential.json`**

   ```bash
   clasp login --creds creds.json
   ```

9. **Initialize Git Repository**

   ```bash
   git init
   git add .
   git commit -m "First commit"
   ```

## Additional Notes

- Ensure you have Node.js and npm installed.
- The `creds.json` file should contain your clasp credentials for login.

This setup helps you manage your Google Apps Script project efficiently using npm and clasp.
