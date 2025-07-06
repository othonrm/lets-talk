# Lets Talk

A "modern" JavaScript application built with React, designed to facilitate real-time communication and collaboration. This project leverages ~~best practices in code style, environment configuration, and deployment for scalable~~ web applications.
<br/>
<sub>(works as an example of using sockets for real-time messaging, and WebRTC for video calls, and screensharing)</sub>


## Features

- React-based frontend for a responsive user experience
- Node.js/Express server (see `server.js` and `server/`)
- Environment-based configuration (`.env.example`)
- Code quality enforced with ESLint and Prettier
- Easily deployable (includes `.gcloudignore` for Google Cloud support)
- Lock files for reproducible installs (`pnpm-lock.yaml`)

## Getting Started

### Prerequisites

- Node.js (recommended v18+)
- PNPM package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/othonrm/lets-talk.git
   cd lets-talk
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values.

### Running the App

- **Development mode:**
  ```bash
  yarn start
  ```
  App runs at [http://localhost:3000](http://localhost:3000)

- **Start server:**
  ```bash
  node server.js
  ```
  (Check `server.js` for custom server logic.)

### Scripts

- `pnpm start` – Starts both the BE.
- `pnpm start:client` – Runs the FE in development mode.
- `pnpm start:server` – Runs the BE in development mode.
- `pnpm build` – Builds the application for production.
- `pnpm test` – Run tests

## Project Structure

```
lets-talk/
├── public/           # Static public assets
├── src/              # React application source code
├── server/           # Backend/server-side code
├── server.js         # Main server entry point
├── .env.example      # Example environment variables
├── package.json
```

## Code Quality

- **ESLint:** `.eslintrc.js` for linting rules
- **Prettier:** `.prettierrc` for code formatting

## Deployment

- Optimized for deployment to various cloud providers (see `.gcloudignore` for Google Cloud)
- Production-ready builds go into the `build/` directory

## License

The MIT License (MIT)

Copyright (c) 2020 Jose Othon

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

