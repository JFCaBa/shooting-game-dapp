# Shooting Game DApp

A web-based version of an AR shooting game, featuring real-time player interactions and location-based gameplay.

## Features

- Real-time multiplayer shooting mechanics
- Location-based player tracking
- Interactive map with player positions
- Ammunition and health management
- Real-time WebSocket communication

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- Google Maps API
- WebSocket for real-time communication

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Google Maps API key
- Modern web browser with geolocation support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shooting-game-dapp.git
cd shooting-game-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=your_api_url
REACT_APP_WS_URL=your_websocket_url
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Development

Start the development server:
```bash
npm start
```

## Project Structure

```
shooting-game-dapp/
├── src/
│   ├── components/        # Reusable UI components
│   ├── services/         # API and game services
│   ├── context/         # React context providers
│   ├── types/           # TypeScript definitions
│   ├── constants/       # App constants
│   └── pages/           # Main app pages
```

## Game Mechanics

- **Shooting**: Click the shoot button to fire
- **Reloading**: Automatic reload when ammo is depleted (3s)
- **Health**: 10 health points, respawn after 60s when depleted
- **Location**: Uses device GPS for player positioning
- **Map**: Real-time player positions and movements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details