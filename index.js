import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase, getDatabase } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to the database before starting the server
await connectToDatabase();

// Test endpoint
app.get('/api/test', (req, res) => {
    res.send('Connection was established');
});

// USSD endpoint
app.post('/ussd', async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    let response = '';
    const inputs = text.split('*');
    const fullName = inputs[1] || '';
    const doorNumber = inputs[2] || '';
    const idNumber = inputs[3] || '';

    const db = getDatabase(); // Get the database connection

    switch (inputs[0]) {
        case ''://Main menu
            response = `CON Welcome to OPEN DOOR PROPERTY
            1. New Tenant (Register)
            2. Existing Tenant
            3. Report an Issue
            4. Pay Rent and Utilities
            5. Need Help
            6. Terms of Service`;
            break;

        case '1': // New Tenant Registration
            switch (inputs.length) {
                case 1:
                    response = `CON Please provide your full name:`;
                    break;
                case 2:
                    response = `CON Hello ${fullName}, please enter your door number:`;
                    break;
                case 3:
                    response = `CON Thank you, ${fullName}. Your door number is ${doorNumber}.
                    Please enter your ID number:`;
                    break;
                case 4:
                    try {
                        // Insert tenant details into the database
                        await db.query(
                            'INSERT INTO tenants (fullName, doorNumber, idNumber, phoneNumber, sessionId, serviceCode) VALUES (?, ?, ?, ?,?,?)',
                            [fullName, doorNumber, idNumber, phoneNumber, sessionId, serviceCode]
                        );
                        response = `END Registration successful!
                        Full Name: ${fullName}
                        Door Number: ${doorNumber}
                        ID Number: ${idNumber}
                        Thank you for joining OPEN DOOR PROPERTY.`;
                    } catch (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            response = `END Registration failed. ID number already exists.`;
                        } else {
                            console.error('Database error:', err.message);
                            response = `END Registration failed due to a technical issue.`;
                        }
                    }
                    break;
                default:
                    response = `END Invalid input for registration.`;
                    break;
            }
            break;

        case '2': // Existing Tenant
            switch (inputs.length) {
                case 1:
                    response = `CON Enter your ID Number:`;
                    break;
                case 2:
                    try {
                        const [rows] = await db.query('SELECT * FROM tenants WHERE idNumber = ?', [inputs[1]]);
                        if (rows.length === 0) {
                            response = `END No tenant found with ID number: ${inputs[1]}.`;
                        } else {
                            const tenant = rows[0];
                            response = `END Tenant Details:
                            Name: ${tenant.fullName}
                            Door Number: ${tenant.doorNumber}
                            Phone: ${tenant.phoneNumber}
                            ID Number: ${tenant.idNumber}
                            Thank you.
                            `;
                            
                        }
                    } catch (err) {
                        console.error('Database error:', err.message);
                        response = `END Failed to retrieve tenant details.`;
                    }
                    break;
                default:
                    response = `END Invalid input for existing tenant.`;
                    break;
            }
            break;

        case '3': // Report an Issue
            switch (inputs.length) {
                case 1: // Step 1: Ask for ID number
                    response = `CON Enter your ID Number:`;
                    break;

                case 2: // Step 2: Ask for the issue description
                    response = `CON Thank you. Please describe the issue:`;
                    break;

                case 3: // Step 3: Save the issue and show a thank-you message
                    try {
                        const idNumber = inputs[1]; // Extract ID number
                        const issueDescription = inputs[2]; // Extract issue description

                        // Save the issue to the database
                        await db.query(
                            'INSERT INTO issues (idNumber, issueDescription) VALUES (?, ?)',
                            [idNumber, issueDescription]
                        );

                        response = `END Thank you for reporting the issue. Our team will address it shortly.`;
                    } catch (err) {
                        console.error('Database error:', err.message);
                        response = `END Failed to report the issue due to a technical error. Please try again later.`;
                    }
                    break;

                default: // Invalid input
                    response = `END Invalid input for reporting an issue.`;
                    break;
            }
        break;

            case '4': // Pay Rent and Utilities
                switch (inputs.length) {
                    case 1: // Step 1: Ask for ID number
                        response = `CON Enter your ID Number:`;
                        break;

                    case 2: // Step 2: Check ID and prompt for payment method
                        try {
                            const idNumber = inputs[1]; // Extract ID number
                            const [rows] = await db.query('SELECT * FROM tenants WHERE idNumber = ?', [idNumber]);

                            if (rows.length === 0) {
                                // No tenant found, redirect to registration
                                response = `END No tenant found with ID number: ${idNumber}.
                                Please register as a new tenant to proceed.`;
                            } else {
                                const tenant = rows[0]; // Get tenant details
                                response = `CON Hello ${tenant.fullName}, kindly choose a payment method:
                                1. M-Pesa
                                2. Bank`;
                            }
                        } catch (err) {
                            console.error('Database error:', err.message);
                            response = `END Failed to retrieve tenant details. Please try again later.`;
                        }
                        break;

                    case 3: // Step 3: Handle Payment Method
                        if (inputs[2] === '1') {
                            // M-Pesa payment success
                            try {
                                const idNumber = inputs[1]; // Extract ID number
                                const [rows] = await db.query('SELECT * FROM tenants WHERE idNumber = ?', [idNumber]);

                                if (rows.length === 0) {
                                    response = `END No tenant found with ID number: ${idNumber}.`;
                                } else {
                                    // Insert payment into the database
                                    await db.query(
                                        'INSERT INTO payments (idNumber, paymentMethod, amount) VALUES (?, ?, ?)',
                                        [idNumber, 'M-Pesa', 5000] // Assuming fixed rent of 5000
                                    );
                                    response = `END Payment successful via M-Pesa.
                                    Thank you for paying your rent.`;
                                }
                            } catch (err) {
                                console.error('Database error:', err.message);
                                response = `END Payment failed due to a technical issue. Please try again later.`;
                            }
                        } else if (inputs[2] === '2') {
                            // Bank payment, ask for PIN
                            response = `CON Enter your Bank PIN:`;
                        } else {
                            response = `END Invalid payment method selected.`;
                        }
                        break;

                    case 4: // Step 4: Confirm Bank Payment
                        try {
                            const idNumber = inputs[1]; // Extract ID number
                            const bankPin = inputs[3]; // Extract Bank PIN
                            const [rows] = await db.query('SELECT * FROM tenants WHERE idNumber = ?', [idNumber]);

                            if (rows.length === 0) {
                                response = `END No tenant found with ID number: ${idNumber}.`;
                            } else {
                                // Insert payment into the database
                                await db.query(
                                    'INSERT INTO payments (idNumber, paymentMethod, amount, bankPin) VALUES (?, ?, ?, ?)',
                                    [idNumber, 'Bank', 15000, bankPin] // Assuming fixed rent of 5000
                                );
                                response = `END Payment successful via Bank.
                                Thank you for paying your rent.`;
                            }
                        } catch (err) {
                            console.error('Database error:', err.message);
                            response = `END Payment failed due to a technical issue. Please try again later.`;
                        }
                        break;

                    default:
                        response = `END Invalid input for payment.`;
                        break;
                }
            break;

       case '5': // Need Help
    switch (inputs.length) {
        case 1: // Step 1: Show Help Options
            response = `CON Choose Help Option:
            1. Pay Rent and Utilities.
            2. Maintenance.
            3. Talk to Landlord`;
            break;

        case 2: // Step 2: Handle Each Help Option
            if (inputs[1] === '1') {
                // Help with Paying Rent and Utilities
                response = `END For help with paying rent and utilities, please select option 4 from the main menu and follow the steps to complete your payment.`;
            } else if (inputs[1] === '2') {
                // Help with Maintenance
                response = `END To report maintenance issues, please select option 3 from the main menu and describe the issue for prompt assistance.`;
            } else if (inputs[1] === '3') {
                // Help with Talking to Landlord
                response = `END You can contact the landlord directly at ${phoneNumber}. Thank you.`;
            } else {
                // Invalid Help Option
                response = `END Invalid option selected. Please try again.`;
            }
            break;

        default: // Invalid input for the help menu
            response = `END Invalid input for help. Please try again.`;
            break;
    }
    break;

        case '6': // Terms of Service
            response = `END Terms of Service:
            1. Rent must be paid by the 5th of each month.
            2. No illegal activities on the property.
            3. Maintenance issues must be reported immediately.
            Thank you for choosing OPEN DOOR PROPERTY.`;
            break;

        default:
            response = `END Invalid option. Please try again.`;
            break;
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`USSD Server listening on port ${PORT}`));
