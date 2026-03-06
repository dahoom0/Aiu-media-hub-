# Docker Architecture - AIU Media Hub

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Host Machine                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Docker Network (aiu_network)                   │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │              │  │              │  │                 │ │ │
│  │  │    MySQL     │◄─┤    Django    │◄─┤     React       │ │ │
│  │  │   Database   │  │    Backend   │  │    Frontend     │ │ │
│  │  │              │  │              │  │                 │ │ │
│  │  │  Port: 3306  │  │  Port: 8000  │  │   Port: 80      │ │ │
│  │  │              │  │              │  │                 │ │ │
│  │  │  Container:  │  │  Container:  │  │  Container:     │ │ │
│  │  │  aiu_mysql   │  │  aiu_backend │  │  aiu_frontend   │ │ │
│  │  │              │  │              │  │                 │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │ │
│  │         │                 │                    │          │ │
│  │         ▼                 ▼                    ▼          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │   Volume:    │  │   Volume:    │  │     Nginx       │ │ │
│  │  │ mysql_data   │  │   ./media    │  │   Web Server    │ │ │
│  │  │ (Persistent) │  │./staticfiles │  │                 │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Exposed Ports:                                                 │
│  ├─ 80    → Frontend (React + Nginx)                           │
│  ├─ 8000  → Backend (Django + Gunicorn)                        │
│  └─ 3306  → Database (MySQL)                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Container Details

### 1. MySQL Container (aiu_mysql)

```
┌─────────────────────────────────────┐
│         MySQL 8.0 Container         │
├─────────────────────────────────────┤
│ Image: mysql:8.0                    │
│ Port: 3306                          │
│ Volume: mysql_data                  │
│                                     │
│ Environment:                        │
│ ├─ MYSQL_DATABASE=aiu_mediahub     │
│ ├─ MYSQL_USER=aiu                  │
│ ├─ MYSQL_PASSWORD=aiu123           │
│ └─ MYSQL_ROOT_PASSWORD=root123     │
│                                     │
│ Health Check:                       │
│ └─ mysqladmin ping                 │
│                                     │
│ Restart Policy: always              │
└─────────────────────────────────────┘
```

### 2. Django Backend Container (aiu_backend)

```
┌─────────────────────────────────────┐
│      Django Backend Container       │
├─────────────────────────────────────┤
│ Build: From Dockerfile              │
│ Port: 8000                          │
│ Volumes:                            │
│ ├─ ./media                         │
│ └─ ./staticfiles                   │
│                                     │
│ Stack:                              │
│ ├─ Python 3.12                     │
│ ├─ Django                          │
│ ├─ Gunicorn (4 workers)           │
│ └─ mysqlclient                     │
│                                     │
│ Features:                           │
│ ├─ Auto migrations                 │
│ ├─ Auto admin user                 │
│ ├─ Static files collection         │
│ └─ REST API                        │
│                                     │
│ Health Check:                       │
│ └─ HTTP /api/health/               │
│                                     │
│ Restart Policy: always              │
└─────────────────────────────────────┘
```

### 3. React Frontend Container (aiu_frontend)

```
┌─────────────────────────────────────┐
│     React Frontend Container        │
├─────────────────────────────────────┤
│ Build: Multi-stage                  │
│ ├─ Stage 1: Node.js 20 (build)    │
│ └─ Stage 2: Nginx Alpine (serve)  │
│                                     │
│ Port: 80 (HTTP)                     │
│ Port: 443 (HTTPS ready)             │
│                                     │
│ Stack:                              │
│ ├─ React + TypeScript             │
│ ├─ Vite (build tool)               │
│ └─ Nginx (web server)              │
│                                     │
│ Features:                           │
│ ├─ Optimized production build      │
│ ├─ Static file serving             │
│ └─ API proxy to backend            │
│                                     │
│ Health Check:                       │
│ └─ HTTP /                          │
│                                     │
│ Restart Policy: always              │
└─────────────────────────────────────┘
```

## Data Flow

### User Request Flow

```
User Browser
    │
    ▼
┌─────────────────┐
│  Port 80        │  Frontend Request
│  Nginx          │  (HTML, CSS, JS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React App      │  User Interface
│  (Static Files) │
└────────┬────────┘
         │
         │ API Call
         ▼
┌─────────────────┐
│  Port 8000      │  API Request
│  Gunicorn       │  (REST API)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Django App     │  Business Logic
│  (Python)       │
└────────┬────────┘
         │
         │ SQL Query
         ▼
┌─────────────────┐
│  Port 3306      │  Database Query
│  MySQL          │
└─────────────────┘
```

### File Upload Flow

```
User Upload
    │
    ▼
Frontend (Port 80)
    │
    │ POST /api/upload
    ▼
Backend (Port 8000)
    │
    │ Save to disk
    ▼
./media/ Volume
    │
    │ Store metadata
    ▼
MySQL Database
```

## Network Configuration

### Docker Network (aiu_network)

```
┌─────────────────────────────────────┐
│      Bridge Network: aiu_network    │
├─────────────────────────────────────┤
│                                     │
│  Container Communication:           │
│  ├─ backend → db:3306              │
│  ├─ frontend → backend:8000        │
│  └─ All containers isolated        │
│                                     │
│  External Access:                   │
│  ├─ localhost:80 → frontend        │
│  ├─ localhost:8000 → backend       │
│  └─ localhost:3306 → database      │
│                                     │
└─────────────────────────────────────┘
```

## Volume Management

### Persistent Volumes

```
┌─────────────────────────────────────┐
│         Volume: mysql_data          │
├─────────────────────────────────────┤
│ Type: Docker Volume                 │
│ Purpose: MySQL database files       │
│ Persistence: Survives container     │
│              restart/rebuild        │
│ Location: Docker managed            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Volume: ./media             │
├─────────────────────────────────────┤
│ Type: Bind Mount                    │
│ Purpose: User uploaded files        │
│ Persistence: On host filesystem     │
│ Location: ./media/                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Volume: ./staticfiles          │
├─────────────────────────────────────┤
│ Type: Bind Mount                    │
│ Purpose: Django static files        │
│ Persistence: On host filesystem     │
│ Location: ./staticfiles/            │
└─────────────────────────────────────┘
```

## Health Check System

### Health Check Flow

```
Docker Engine
    │
    │ Every 30 seconds
    ▼
┌─────────────────┐
│  MySQL Check    │  mysqladmin ping
│  Status: ✓      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Backend Check  │  curl /api/health/
│  Status: ✓      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Frontend Check │  wget /
│  Status: ✓      │
└─────────────────┘
```

## Startup Sequence

```
1. Docker Compose Start
   │
   ▼
2. Create Network (aiu_network)
   │
   ▼
3. Create Volumes (mysql_data)
   │
   ▼
4. Start MySQL Container
   │
   │ Wait for health check ✓
   ▼
5. Start Backend Container
   │
   ├─ Wait for MySQL
   ├─ Run migrations
   ├─ Create admin user
   ├─ Collect static files
   └─ Start Gunicorn
   │
   │ Wait for backend ready ✓
   ▼
6. Start Frontend Container
   │
   ├─ Serve static files
   └─ Proxy API requests
   │
   ▼
7. All Services Running ✓
```

## Resource Allocation

### Default Resources

```
┌─────────────────────────────────────┐
│         MySQL Container             │
├─────────────────────────────────────┤
│ CPU: ~10-20% (idle)                 │
│ RAM: ~400-600 MB                    │
│ Disk: ~500 MB + data                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        Backend Container            │
├─────────────────────────────────────┤
│ CPU: ~5-15% (idle)                  │
│ RAM: ~200-400 MB                    │
│ Disk: ~300 MB                       │
│ Workers: 4 Gunicorn processes       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Frontend Container            │
├─────────────────────────────────────┤
│ CPU: ~1-5% (idle)                   │
│ RAM: ~50-100 MB                     │
│ Disk: ~100 MB                       │
└─────────────────────────────────────┘

Total System Requirements:
├─ CPU: 2-4 cores recommended
├─ RAM: 4-8 GB recommended
└─ Disk: 10-20 GB recommended
```

## Security Architecture

### Network Isolation

```
┌─────────────────────────────────────┐
│          External Network           │
│         (Internet/LAN)              │
└────────────┬────────────────────────┘
             │
             │ Exposed Ports Only
             ▼
┌─────────────────────────────────────┐
│         Host Firewall               │
│  ├─ Port 80 (Frontend)             │
│  ├─ Port 8000 (Backend)            │
│  └─ Port 3306 (Database)           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Docker Bridge Network          │
│      (Internal Communication)       │
│                                     │
│  ├─ frontend ↔ backend             │
│  ├─ backend ↔ database             │
│  └─ Isolated from host             │
└─────────────────────────────────────┘
```

## Deployment Workflow

```
Developer Machine
    │
    │ git push
    ▼
Git Repository
    │
    │ git clone
    ▼
Target Server
    │
    │ ./deploy.sh
    ▼
Docker Compose
    │
    ├─ Build Images
    ├─ Create Network
    ├─ Create Volumes
    ├─ Start Containers
    └─ Run Health Checks
    │
    ▼
Application Running ✓
```

## Monitoring Points

```
┌─────────────────────────────────────┐
│         Monitoring Layers           │
├─────────────────────────────────────┤
│                                     │
│  1. Container Level                 │
│     ├─ docker-compose ps           │
│     ├─ docker stats                │
│     └─ Health checks               │
│                                     │
│  2. Application Level               │
│     ├─ docker-compose logs         │
│     ├─ Django logs                 │
│     └─ Nginx logs                  │
│                                     │
│  3. Database Level                  │
│     ├─ MySQL logs                  │
│     ├─ Query performance           │
│     └─ Connection pool             │
│                                     │
│  4. System Level                    │
│     ├─ CPU usage                   │
│     ├─ Memory usage                │
│     ├─ Disk usage                  │
│     └─ Network traffic             │
│                                     │
└─────────────────────────────────────┘
```

## Backup Strategy

```
┌─────────────────────────────────────┐
│          Backup Components          │
├─────────────────────────────────────┤
│                                     │
│  1. Database Backup                 │
│     └─ mysqldump → backup.sql      │
│                                     │
│  2. Media Files Backup              │
│     └─ tar → media_backup.tar.gz   │
│                                     │
│  3. Configuration Backup            │
│     ├─ .env file                   │
│     ├─ docker-compose.yml          │
│     └─ nginx.conf                  │
│                                     │
│  4. Code Backup                     │
│     └─ Git repository              │
│                                     │
└─────────────────────────────────────┘
```

## Scaling Options

### Horizontal Scaling

```
┌─────────────────────────────────────┐
│         Load Balancer               │
│         (Nginx/HAProxy)             │
└────────┬────────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Backend ││Backend ││Backend ││Backend │
│   1    ││   2    ││   3    ││   4    │
└───┬────┘└───┬────┘└───┬────┘└───┬────┘
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
              ▼
        ┌──────────┐
        │  MySQL   │
        │ Cluster  │
        └──────────┘
```

### Vertical Scaling

```
Increase Resources:
├─ CPU: 2 → 4 → 8 cores
├─ RAM: 4GB → 8GB → 16GB
├─ Workers: 4 → 8 → 16
└─ Connections: 100 → 200 → 500
```

## Summary

This architecture provides:
- ✅ **Isolation**: Each service in its own container
- ✅ **Scalability**: Easy to scale horizontally or vertically
- ✅ **Reliability**: Health checks and restart policies
- ✅ **Persistence**: Data survives container restarts
- ✅ **Security**: Network isolation and controlled access
- ✅ **Monitoring**: Multiple monitoring points
- ✅ **Backup**: Comprehensive backup strategy
- ✅ **Portability**: Deploy anywhere with Docker

---

*For deployment instructions, see DOCKER_DEPLOYMENT_GUIDE.md*
*For quick start, see QUICK_START.md*
