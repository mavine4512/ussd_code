# USSD Application for Open Door Property

### Overview
This is a USSD application built with Node.js and Express to handle user interactions for Open Door Property, including functionalities such as tenant registration, payment of rent and utilities, reporting issues, and requesting help. It integrates with Africa's Talking for USSD gateway services and uses Ngrok for testing and tunneling the application.

### Features: 
* Main Menu: Displays a menu with options like tenant registration, tenant info, report issue, payment, help and terms of service.
* Tenant Registration: Allows users to register by providing their name, door number, and ID number.
* Payment: Enables rent payments through M-Pesa or Bank, with validations for tenant existence.
Report Issues: Lets tenants report maintenance issues by describing the problem.
* Help Menu: Provides assistance for rent payment, maintenance, and landlord contact.
### Technologies Used
* Node.js: Server-side JavaScript runtime.
* Express.js: Web framework for building the USSD service.
* MySQL: Database for managing tenants, payments, and reported issues.
* Africa's Talking: USSD gateway for sending and receiving USSD requests.
* Ngrok: Tool for exposing the application to the internet for testing.

### Setup and Installation

1. Clone the Repository

````bash
git clone https://github.com/mavine4512/ussd_code.git
cd ussd-code_testing
````
2. Install Dependencies
````bash
npm install
````
or

````bash
yarn
````
3. Configure Environment Variables
Create a .env file in the root directory and add the following:

````plaintext
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ussdDb
PORT=3001
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
````
4. Set Up the Database
Run the following SQL commands to create the necessary tables:

Tenants Table:

````sql
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    doorNumber VARCHAR(50) NOT NULL,
    idNumber VARCHAR(50) NOT NULL UNIQUE,
    phoneNumber VARCHAR(20) NOT NULL
);
````
Payments Table:
````sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idNumber VARCHAR(50) NOT NULL,
    paymentMethod ENUM('M-Pesa', 'Bank') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bankPin VARCHAR(10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idNumber) REFERENCES tenants(idNumber)
);
````
Issues Table:

````sql
CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idNumber VARCHAR(50) NOT NULL,
    issueDescription TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
````
5. Start the Server
bash

node index.js
Africa's Talking Integration
Sign up at africastalking.com to get an API key and username.
Update your .env file with the Africa's Talking API credentials:
````plaintext
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
````
Configure a USSD sandbox or production URL in the Africa's Talking dashboard. Use the Ngrok URL (see below) to test the app.
Ngrok Setup
Download and install Ngrok from ngrok.com.
Start Ngrok to expose your local server to the internet:
```bash
ngrok http 3001
```
Copy the public URL provided by Ngrok (e.g., https://abcdef.ngrok.io).
Update your Africa's Talking USSD callback URL with the Ngrok URL:
````arduino
https://abcdef.ngrok.io/ussd
````
Usage
1. Launch the App
Start your local server:
````bash

node index.js
````
Run Ngrok to make the server accessible online:

````bash
 ngrok http http://localhost:3001  
 ````
2. Interact with the USSD Application

Dial the USSD code configured in Africa's Talking (e.g., *384*1234#).
Follow the prompts to:
Register as a new tenant.
Pay rent or utilities.
Report issues.
Get help or contact the landlord.
Sample USSD Menu
````markdown
CON Welcome to OPEN DOOR PROPERTY
1. New Tenant (Register)
2. Existing Tenant
3. Report an Issue
4. Pay Rent and Utilities
5. Need Help
6. Terms of Service
````
### Endpoints

Test Endpoint:

URL: /api/test

Method: GET
Description: Returns a simple connection message.
USSD Endpoint:

URL: /ussd

Method: POST
Description: Handles USSD requests and responses.
Development Notes
Use Africa's Talking sandbox for testing USSD functionality in a development environment.
Ensure Ngrok is running during development for external access to the local server.
Test various scenarios for tenant registration, payments, and reporting issues to ensure proper error handling and database integration.

