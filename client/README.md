# Next.js + Tailwind CSS Authentication Frontend

This project is a Next.js (TypeScript) frontend for user authentication and profile completion, styled with Tailwind CSS. It connects to a backend (see `../server`) for registration, login, and profile update.

## Features

- User registration
- User login
- Profile completion (phone number and full name)
- Uses fetch to communicate with backend endpoints

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/register/page.tsx` — Registration page
- `src/app/login/page.tsx` — Login page
- `src/app/profile/page.tsx` — Profile completion page

## Backend

Make sure the backend server in `../server` is running and accessible.

---

This project was bootstrapped with `create-next-app` and includes Tailwind CSS and ESLint.
