src/
│
├── domain/                # Core business logic (pure)
│   ├── entities/
│   │   └── User.js
│   ├── usecases/
│       └── loginUser.js
│
├── application/           # Application logic
│   ├── services/
│   │   └── authService.js
│
├── infrastructure/        # External stuff
│   ├── database/
│   │   └── mongo.js
│   ├── repositories/
│   │   └── userRepo.js
│
├── interfaces/            # Controllers / routes
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│       └── authRoutes.js
│
├── config/
│
├── app.js
└── server.js