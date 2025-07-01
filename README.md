# BTC Guessing Game

A simple web app where users guess whether the price of Bitcoin (BTC) will go up or down. The guess is only resolved when the price changes and at least 60s have passed.

## Features

- Real-time BTC price from CoinGecko
- User authentication (AWS Cognito)
- Database (AWS DynamoDB)
- Guess up or down, resolve after 60 seconds and when the price of BTC changes
- Scoreboard per user

## Running Locally

1. Copy `.env.example` to `.env.local` and fill in your AWS credentials.
2. Install dependencies:

   ```bash
   yarn install
   # or npm install
   ```

3. Start the dev server:

   ```bash
   yarn dev
   # or npm run dev
   ```

---

MIT License
