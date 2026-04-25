# ProHex3D Backend

Backend API untuk ProHex3D, web AI yang memproses foto menjadi model 3D.

Backend ini memakai:

- Node.js
- Express.js
- Multer
- Axios
- Dotenv
- CORS

Untuk tahap awal, backend memakai mode `demo`. Mode ini belum memakai AI 3D asli. Backend akan membuat file `.glb` demo agar alur upload, generate, preview, dan download bisa dites dulu.

---

## Struktur Folder

```txt
backend/
├─ src/
│  ├─ server.js
│  │
│  ├─ config/
│  │  └─ env.js
│  │
│  ├─ routes/
│  │  ├─ upload.route.js
│  │  ├─ generate.route.js
│  │  └─ model.route.js
│  │
│  ├─ controllers/
│  │  ├─ upload.controller.js
│  │  ├─ generate.controller.js
│  │  └─ model.controller.js
│  │
│  ├─ services/
│  │  ├─ ai3d.service.js
│  │  ├─ storage.service.js
│  │  └─ file.service.js
│  │
│  ├─ middleware/
│  │  ├─ upload.middleware.js
│  │  └─ error.middleware.js
│  │
│  └─ utils/
│     ├─ response.util.js
│     └─ file.util.js
│
├─ uploads/
│  └─ .gitkeep
│
├─ results/
│  └─ .gitkeep
│
├─ .env
├─ package.json
└─ README.md