
Falcone CIPP Backend
Structure:
src/ - application source
scripts/ - helper scripts (seed users)
certs/ - TLS certs for local HTTPS (replace with real certs in production)
Security:
- bcrypt hashing with salt rounds 12
- Joi input validation with strict regex whitelists
- Helmet, rate-limiting, mongo-sanitize, xss-clean
- CSRF protection via csurf
- JWT based auth, no self-registration (seed script creates users)
Dev:
- Copy .env.example to .env and set values
- npm install
- npm run seed
- npm run dev
CI:
- .circleci/config.yml runs tests and SonarQube scanner
