const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const port = 3000;

// Configure express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Store active checks
const activeChecks = new Map();

// Initialize WhatsApp client
let isClientReady = false;
client.on('qr', async (qr) => {
    // Generate QR code for initial authentication
    const qrDataUrl = await qrcode.toDataURL(qr);
    global.latestQR = qrDataUrl;
});

client.on('ready', () => {
    console.log('Client is ready!');
    isClientReady = true;
});

client.initialize();

// Function to check SIH status
async function checkSIHStatus(sihCode) {
    const headers = {
        "FIND AND PUT"
    };

    const cookies = {
        "FIND AND PUT"
    };

    try {
        // Convert cookies object to string format
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        const response = await axios.get('https://www.sih.gov.in/screeningresult', {
            headers: {
                ...headers,
                'Cookie': cookieString
            },
            httpsAgent: new (require('https').Agent)({  
                rejectUnauthorized: false
            })
        });

        console.log(`Status code: ${response.status}`);
        return response.data.includes(sihCode);
    } catch (error) {
        console.error('Error checking SIH status:', error.message);
        return false;
    }
}

// Schedule checks every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    if (!isClientReady) return;
    
    console.log('Running SIH status check...', new Date().toLocaleString());
    
    for (const [sihCode, phoneNumber] of activeChecks.entries()) {
        const isFound = await checkSIHStatus(sihCode);
        console.log(`Checking ${sihCode} for ${phoneNumber}: ${isFound ? 'Found!' : 'Not found'}`);
        
        if (isFound) {
            // Send WhatsApp message
            const chatId = phoneNumber + '@c.us';
            await client.sendMessage(chatId, `Your SIH problem statement (${sihCode}) has been updated!`);
            activeChecks.delete(sihCode);
            console.log(`Notification sent and removed check for ${sihCode}`);
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/qr', (req, res) => {
    res.json({ qr: global.latestQR || null });
});

app.post('/register', (req, res) => {
    const { sihCode, phoneNumber } = req.body;
    activeChecks.set(sihCode, phoneNumber);
    res.json({ 
        success: true, 
        message: `Started checking for SIH code: ${sihCode}. You will receive WhatsApp updates at: ${phoneNumber}`
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 