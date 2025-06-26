// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const gocardless = require('gocardless-pro-node'); // GoCardless SDK

// Create an Express application
const app = express();

// Enable CORS for all routes (allows requests from any origin)
app.use(cors());

// Parse incoming JSON requests (so req.body is populated)
app.use(express.json()); // Use built-in JSON parser

// Log the GoCardless access token and environment (for debugging)
console.log('GOCARDLESS_ACCESS_TOKEN:', process.env.GOCARDLESS_ACCESS_TOKEN);
console.log('GOCARDLESS_ENVIRONMENT:', process.env.GOCARDLESS_ENVIRONMENT);

// Initialize the GoCardless client with your access token and environment
const client = new gocardless.Client({
  access_token: process.env.GOCARDLESS_ACCESS_TOKEN,
  environment: process.env.GOCARDLESS_ENVIRONMENT,
});

console.log('GoCardless client initialized.');

// 1. Start a redirect flow (user sets up direct debit)
app.post('/api/start-redirect-flow', async (req, res) => {
  // Log the request body for debugging
  console.log('Received body:', req.body);
  try {
    // Destructure name and email from the request body
    const { name, email } = req.body;
    // Generate a random session token for this flow
    const session_token = Math.random().toString(36).substring(2);

    // Prepare parameters for the GoCardless redirect flow
    const params = {
      description: "Direct Debit for GoCardTest", // Description shown to the user
      session_token, // Unique token for this session
      success_redirect_url: `${process.env.BASE_URL}/api/confirm-redirect-flow`, // Where GoCardless will redirect after form completion
      prefilled_customer: {
        given_name: name, // Pre-fill the user's name
        email,            // Pre-fill the user's email
      }
    };
    // Log the parameters being sent to GoCardless
    console.log('Params sent to GoCardless:', params);

    // Create the redirect flow with GoCardless
    const redirectFlow = await client.redirect_flows.create({ params });
    // Log the response from GoCardless
    console.log('GoCardless redirectFlow response:', redirectFlow);

    // Respond to the client with the redirect URL, flow ID, and session token
    res.json({
      redirect_url: redirectFlow.redirect_flows.redirect_url,
      redirect_flow_id: redirectFlow.redirect_flows.id,
      session_token,
    });
  } catch (err) {
    // Log any errors that occur
    console.error('Error in /api/start-redirect-flow:', err.response ? err.response.body : err);
    // Respond with a 500 error and the error message
    res.status(500).json({ error: err.message });
  }
});

// 2. Confirm the redirect flow (after user completes GoCardless form)
app.post('/api/confirm-redirect-flow', async (req, res) => {
  // Log the request body for debugging
  console.log('Received body:', req.body);
  try {
    // Destructure redirect_flow_id and session_token from the request body
    const { redirect_flow_id, session_token } = req.body;
    // Complete the redirect flow with GoCardless
    const redirectFlow = await client.redirect_flows.complete(redirect_flow_id, {
      params: { session_token }
    });
    // Respond with the mandate ID and customer ID
    res.json({
      mandate_id: redirectFlow.links.mandate,
      customer_id: redirectFlow.links.customer,
    });
  } catch (err) {
    // Log any errors that occur
    console.error('Error in /api/confirm-redirect-flow:', err.response ? err.response.body : err);
    // Respond with a 500 error and the error message
    res.status(500).json({ error: err.message });
  }
});

// 3. (Optional) Create a payment
app.post('/api/create-payment', async (req, res) => {
  // Log the request body for debugging
  console.log('Received body:', req.body);
  try {
    // Destructure amount, currency, and mandate_id from the request body
    const { amount, currency, mandate_id } = req.body;
    // Create a payment with GoCardless
    const payment = await client.payments.create({
      params: {
        amount, // Amount in pence/cents (e.g., 1000 = £10.00)
        currency, // Currency code (e.g., 'GBP')
        links: { mandate: mandate_id } // Link the payment to the mandate
      }
    });
    // Respond with the payment object from GoCardless
    res.json(payment);
  } catch (err) {
    // Log any errors that occur
    console.error('Error in /api/create-payment:', err.response ? err.response.body : err);
    // Respond with a 500 error and the error message
    res.status(500).json({ error: err.message });
  }
});

// Start the Express server on port 3000
app.listen(3000, () => {
  console.log('GoCardless backend running on http://localhost:3000');
});
