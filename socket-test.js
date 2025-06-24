const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:5000';
const TEST_TRANSACTIONS = [
    {
        amount: 1000,
        type: "pay",
        toWhom: "Test User 1",
        sendTo: "Company",
        receiverName: "Test Receiver 1",
        description: "Test transaction 1",
        username: "tester1",
        pay: true,
        received: false
    },
    {
        amount: 2000,
        type: "take",
        toWhom: "Test User 2",
        sendTo: "Manager",
        receiverName: "Test Receiver 2",
        description: "Test transaction 2",
        username: "tester2",
        pay: false,
        received: true
    }
];

// Create multiple socket clients to simulate different users
const createSocketClient = (clientId) => {
    const socket = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log(`Client ${clientId}: Connected to WebSocket server`);
        socket.emit('join-money-updates');
    });

    socket.on('join-money-updates', () => {
        console.log(`Client ${clientId}: Joined money-updates room`);
    });

    socket.on('new-transaction', (data) => {
        console.log(`Client ${clientId}: Received new transaction:`, data);
    });

    socket.on('connect_error', (error) => {
        console.error(`Client ${clientId}: Connection error:`, error);
    });

    socket.on('disconnect', () => {
        console.log(`Client ${clientId}: Disconnected from server`);
    });

    return socket;
};

// Test adding transactions
const testAddTransaction = async (transaction) => {
    try {
        console.log('Adding transaction:', transaction);
        const response = await axios.post(`${API_URL}/api/money-handles/add`, transaction);
        console.log('Transaction added successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding transaction:', error.response?.data || error.message);
        throw error;
    }
};

// Run the test
async function runTest() {
    console.log('Starting socket.io test...');

    // Create multiple clients
    const client1 = createSocketClient('Client-1');
    const client2 = createSocketClient('Client-2');

    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test adding transactions
    for (const transaction of TEST_TRANSACTIONS) {
        try {
            await testAddTransaction(transaction);
            // Wait a bit between transactions
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Test failed:', error);
        }
    }

    // Keep the connections alive for a while to see the events
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Cleanup
    console.log('Cleaning up...');
    client1.disconnect();
    client2.disconnect();
    console.log('Test completed');
}

// Run the test
runTest().catch(console.error); 