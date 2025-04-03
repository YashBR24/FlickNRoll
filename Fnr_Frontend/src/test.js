const wbm = require('wbm');

const contacts = [
    { phone: '918866993786', name: 'harsh' },
    { phone: '918799523738', name: 'shivam' },
    { phone: '919687368825', name: 'om' },
];

// Message template (personalized with {{name}})
const messageTemplate = 'Hello {{name}}, this is an automated message sent via Node.js!';

async function sendMessages() {
    try {
        // Start wbm session (will display QR code in terminal for authentication)
        await wbm.start({ showBrowser: false, session: true });
        console.log('WhatsApp session started. Scan the QR code with your WhatsApp app.');

        // Send messages to all contacts
        await wbm.send(contacts, messageTemplate);
        console.log('Messages sent successfully!');

        // End the session
        await wbm.end();
        console.log('Session ended.');
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

// Run the function
sendMessages();