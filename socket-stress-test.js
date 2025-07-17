const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:5000';
const NUM_CLIENTS = 100; // Number of concurrent clients to test
const CLIENTS_PER_BATCH = 20; // Number of clients to connect in each batch
const BATCH_DELAY = 1000; // Delay between batches in ms

// Test transaction
const TEST_TRANSACTION = {
    amount: 1000,
    type: "pay",
    toWhom: "Test User",
    sendTo: "Company",
    receiverName: "Test Receiver",
    description: "Stress test transaction",
    username: "tester",
    pay: true,
    received: false
};

// Track connected clients and received messages
let connectedClients = 0;
let messageReceivedCount = 0;
const clients = [];
const startTime = Date.now();

// Create a single socket client
const createSocketClient = (clientId) => {
    const socket = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        connectedClients++;
        console.log(`Client ${clientId} connected. Total connected: ${connectedClients}`);
        socket.emit('join-money-updates');
    });

    socket.on('new-transaction', (data) => {
        messageReceivedCount++;
        const latency = Date.now() - startTime;
        console.log(`Client ${clientId} received message. Latency: ${latency}ms`);
    });

    socket.on('connect_error', (error) => {
        console.error(`Client ${clientId} connection error:`, error.message);
    });

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`Client ${clientId} disconnected. Remaining: ${connectedClients}`);
    });

    return socket;
};

// Add a test transaction
const testAddTransaction = async () => {
    try {
        console.log('Adding test transaction...');
        const response = await axios.post(`${API_URL}/api/money-handles/add`, TEST_TRANSACTION);
        console.log('Transaction added successfully');
        return response.data;
    } catch (error) {
        console.error('Error adding transaction:', error.response?.data || error.message);
        throw error;
    }
};

// Connect clients in batches
const connectClientBatch = async (startIndex, count) => {
    console.log(`Connecting clients ${startIndex} to ${startIndex + count - 1}...`);
    for (let i = 0; i < count; i++) {
        const clientId = startIndex + i;
        const client = createSocketClient(clientId);
        clients.push(client);
    }
    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
};

// Run the stress test
async function runStressTest() {
    console.log(`Starting stress test with ${NUM_CLIENTS} clients...`);
    console.log(`Connecting clients in batches of ${CLIENTS_PER_BATCH}...`);

    // Connect clients in batches
    for (let i = 0; i < NUM_CLIENTS; i += CLIENTS_PER_BATCH) {
        const batchSize = Math.min(CLIENTS_PER_BATCH, NUM_CLIENTS - i);
        await connectClientBatch(i, batchSize);
    }

    console.log(`All ${NUM_CLIENTS} clients connected. Waiting for stability...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send test transaction
    console.log('Sending test transaction to all clients...');
    const testStart = Date.now();
    await testAddTransaction();

    // Wait for messages to be received
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Calculate results
    const testDuration = Date.now() - testStart;
    console.log('\nTest Results:');
    console.log('=============');
    console.log(`Total Clients Connected: ${connectedClients}`);
    console.log(`Messages Received: ${messageReceivedCount}`);
    console.log(`Message Delivery Rate: ${((messageReceivedCount / NUM_CLIENTS) * 100).toFixed(2)}%`);
    console.log(`Test Duration: ${testDuration}ms`);
    console.log(`Average Latency: ${(testDuration / messageReceivedCount).toFixed(2)}ms`);

    // Cleanup
    console.log('\nCleaning up...');
    clients.forEach(client => client.disconnect());
    console.log('Test completed');
}

// Run the test
runStressTest().catch(console.error); 