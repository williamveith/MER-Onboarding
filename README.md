mkdir src

npm init

npm install @google/clasp --save-dev

touch .claspignore

# clasp login

# Clone project and place it inside src folder
clasp clone "1cdEMrYrx6QgMV9AG6pPuJvX2bG0Ijb8c7FSL2YMfo7QyD4xyAw-MH3tR" --rootDir ./src

# Logs in using the clasp-credential.json
clasp login --creds creds.json