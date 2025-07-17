const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000';
const socket = io(API_URL);

// Connect to WebSocket
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    
    // Join money-updates room
    socket.emit('join-money-updates');
    console.log('Joined money-updates room');

    // Listen for new transactions
    socket.on('new-transaction', (data) => {
        console.log('Received new transaction:', data);
    });

    // Test adding a new transaction
    testAddTransaction();
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

async function testAddTransaction() {
    try {
        // Add a test transaction
        const response = await axios.post(`${API_URL}/api/money-handles/add`, {
            amount: 1000,
            type: "pay",
            toWhom: "Test User",
            sendTo: "Company",
            receiverName: "Test Receiver",
            description: "Test transaction",
            username: "tester",
            pay: true,
            received: false
        });

        console.log('Transaction added:', response.data);
    } catch (error) {
        console.error('Error adding transaction:', error.response?.data || error.message);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Disconnecting from WebSocket server...');
    socket.disconnect();
    process.exit();
}); 