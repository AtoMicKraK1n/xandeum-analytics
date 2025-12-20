# Xandeum Analytics Dashboard

![Xandeum Analytics](public/logo_edited.avif)

A real-time analytics dashboard for monitoring the Xandeum storage network (pNodes). Built with Next.js 16, TypeScript, and D3.js, featuring interactive 3D globe visualization and comprehensive network health monitoring.

**Live Site**: [xandeum-analytics-lime.vercel.app](https://xandeum-analytics-lime.vercel.app)

**Demo Video**: [Twitter Post](https://x.com/Prakhar158/status/2002430593406308732?s=20)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

- **Real-Time Network Monitoring**: Track 200+ pNodes across the Xandeum network
- **Interactive 3D Globe**: Visualize global node distribution with D3.js canvas rendering
- **Network Health Scoring**: Three-tier health analysis (Healthy, Degraded, Offline)
- **Version Intelligence**: Track software version distribution and adoption rates
- **Node Details**: Comprehensive statistics for individual pNodes including:
  - Storage utilization
  - CPU and RAM usage
  - Network activity (packets sent/received)
  - Uptime tracking
  - Geolocation data
  
---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/AtoMicKraK1n/xandeum-analytics.git
cd xandeum-analytics
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables (Optional)

Create a `.env.local` file for local development:

```bash
# Optional: Only needed if you want to override defaults
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: No environment variables are required for deployment. Vercel automatically provides `VERCEL_URL`.

---

## Project Structure

```
xandeum-analytics/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── geolocation/          # IP geolocation endpoint
│   │   ├── network/
│   │   │   ├── overview/         # Network statistics
│   │   │   └── health/           # Health metrics
│   │   └── pnodes/               # pNode data endpoints
│   │       ├── route.ts          # List all pNodes
│   │       └── [address]/        # Individual pNode stats
│   ├── map/                      # Network map page
│   ├── version-intelligence/    # Version distribution page
│   ├── pnode/[address]/          # Node details page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard homepage
├── components/                   # React Components
│   ├── Globe3D.tsx               # 3D globe (dashboard)
│   ├── Globe3DInteractive.tsx    # 3D globe (map page)
│   ├── NetworkMap2D.tsx          # 2D map component
│   ├── NodePopup.tsx             # Node info popup
│   ├── PNodesTable.tsx           # Sortable node table
│   ├── NavDrawer.tsx             # Navigation sidebar
│   ├── AutoRefresh.tsx           # Auto-refresh handler
│   ├── PageWrapper.tsx           # Page layout wrapper
│   └── VersionDistributionChart.tsx # Version chart
├── lib/                          # Utilities
│   ├── api-client.ts             # API base URL handler
│   └── pnode-client.ts           # pNode RPC client
├── types/                        # TypeScript types
│   └── pnode.ts                  # pNode interfaces
├── public/                       # Static assets
│   └── logo_edited.avif          # Xandeum logo
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## API Documentation

### Internal API Endpoints

#### `GET /api/pnodes`

Fetch all pNodes in the network.

**Response:**

```json
{
  "data": [
    {
      "address": "173.212.207.32:9001",
      "version": "1.0.0",
      "last_seen": "2025-12-20 12:30:00 UTC",
      "last_seen_timestamp": 1734700200
    }
  ]
}
```

#### `GET /api/pnodes/[address]`

Get detailed statistics for a specific pNode.

**Parameters:**

- `address`: Node address (e.g., `173.212.207.32:9001`)

**Response:**

```json
{
  "data": {
    "total_bytes": 1048576000,
    "total_pages": 1000,
    "cpu_percent": 15.5,
    "ram_used": 536870912,
    "ram_total": 8589934592,
    "uptime": 86400,
    "packets_received": 1250,
    "packets_sent": 980,
    "active_streams": 5,
    "version": "1.0.0",
    "last_updated": 1734700200
  }
}
```

#### `GET /api/network/overview`

Get network-wide statistics and health metrics.

**Response:**

```json
{
  "data": {
    "totals": {
      "total": 248,
      "healthy": 200,
      "degraded": 30,
      "offline": 18
    },
    "health": {
      "score": 85,
      "healthyPercentage": 80.6,
      "degradedPercentage": 12.1,
      "offlinePercentage": 7.3
    },
    "versions": {
      "latest": "1.0.0",
      "distribution": {
        "1.0.0": 180,
        "0.9.5": 50,
        "0.9.0": 18
      }
    },
    "lastUpdated": "2025-12-20T12:30:00.000Z"
  }
}
```

#### `GET /api/geolocation?ip=[IP_ADDRESS]`

Get geolocation data for an IP address.

**Parameters:**

- `ip`: IP address (e.g., `173.212.207.32`)

**Response:**

```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "city": "San Francisco",
  "country": "United States",
  "regionName": "California",
  "isp": "Digital Ocean",
  "org": "DigitalOcean, LLC"
}
```

### pNode RPC Protocol

The platform communicates with pNodes using JSON-RPC 2.0 on port 6000.

**Available Methods:**

- `get-version`: Get pNode software version
- `get-stats`: Get comprehensive node statistics
- `get-pods`: Get list of known peer pNodes

**Example Request:**

```bash
curl -X POST http://173.212.207.32:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "get-stats",
    "id": 1
  }'
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository**

2. **Import to Vercel**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your forked repository
   - No environment variables needed
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` triggers a new deployment
   - Preview deployments for pull requests

## Usage Guide

### Dashboard

The main dashboard provides an at-a-glance view of network health:

1. **Network Health Score**: Overall network performance (0-100)
2. **Health Distribution**: Breakdown of healthy, degraded, and offline nodes
3. **3D Globe**: Interactive visualization showing public node locations
4. **Node Table**: Sortable table with all nodes and their status

**Features:**

- Search nodes by IP, address, or version
- Filter by health status (Healthy/Degraded/Offline)
- Click "View Details" to see comprehensive node statistics
- Auto-refreshes every 60 seconds

### Network Map

Interactive 3D globe showing global node distribution:

1. **Globe Interaction**

   - Click and drag to rotate
   - Auto-rotation resumes after 1 second
   - Click any marker to see node details

2. **Smart Popups**

   - Location (city, country)
   - IP address
   - Software version
   - Health status
   - Coordinates

3. **Performance**
   - Limited to 50 nodes for optimal rendering
   - 60 FPS smooth rotation
   - Canvas-based rendering

### Version Intelligence

Track software version distribution across the network:

1. **Top Statistics**

   - Latest version
   - Active versions count
   - Adoption rate
   - Outdated nodes

2. **Version Cards**

   - Ranked by node count
   - Shows percentage of network
   - Latest version highlighted
   - Progress bars for visual comparison

3. **Distribution Chart**
   - Bar chart visualization
   - Interactive display

### Node Details

Click any node to view comprehensive statistics:

- **System Metrics**: CPU usage, RAM utilization
- **Storage Stats**: Total bytes, pages, capacity
- **Network Activity**: Packets sent/received, active streams
- **Geolocation**: City, country, ISP, coordinates
- **Performance Graphs**: Visual representation of resource usage

---

## Troubleshooting

### Common Issues

**Issue**: Globe not showing nodes

- **Solution**: Check browser console for geolocation API errors. Ensure you're not hitting rate limits (45 req/min for IP-API).

**Issue**: "Unable to fetch node details"

- **Solution**: Node's RPC port (6000) may not be publicly accessible. This is expected for private nodes.

**Issue**: Slow performance on map page

- **Solution**: The app limits to 50 nodes. If still slow, reduce `dotSpacing` parameter in Globe3DInteractive.tsx.

**Issue**: Build errors on Vercel

- **Solution**: Ensure you're using Node.js 18+ and all dependencies are properly listed in package.json.

### Debug Mode

Enable verbose logging:

```typescript
// In lib/pnode-client.ts
console.log("[PNodeClient] ..."); // Already included
```

Check browser console (F12) for detailed logs.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow existing code style (Prettier/ESLint)
- Test on multiple browsers
- Update documentation for new features
- Keep components small and focused

---

## Contact

**Developer**: Prakhar Sharma 
**GitHub**: [@AtoMicKraK1n](https://github.com/AtoMicKraK1n)  
**Live Demo**: [xandeum-analytics-lime.vercel.app](https://xandeum-analytics-lime.vercel.app)

