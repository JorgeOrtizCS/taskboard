# Taskboard

A simple task manager web app. Users register, log in, and manage their own tasks
(create, read, update, delete). Built for FAU Engineering Design 2 (ED2), using AI tools
to write most of the code.

**Deployed app:** ADD-YOUR-NETLIFY-LINK-HERE

**Demo video (3 to 5 min, unlisted):** ADD-YOUR-YOUTUBE-LINK-HERE

## What the app does

- Register a new account, log in, and log out
- Add tasks with a title, an optional due date, and a status (To do, In progress, Done)
- View your tasks and filter them by status
- Edit a task's title and due date, change its status, or delete it
- Overdue tasks are flagged in red
- Every user only sees their own tasks (enforced in the database with Row Level Security)

## Technologies used

- HTML, CSS, and vanilla JavaScript (no build step)
- [Supabase](https://supabase.com) for the Postgres database and user authentication
- Netlify for hosting
- GitHub for version control
- AI tools used to build it: ADD-WHICH-ONES-YOU-USED (for example Claude, Cursor, ChatGPT)

## Project structure

```
index.html          Page layout (login/register screen and the task screen)
style.css           All styling
config.js           Supabase project URL and public anon key
app.js              App logic: auth, CRUD calls to Supabase, rendering
supabase/schema.sql Database table and Row Level Security policies
```

## Setup instructions

1. Clone the repo:
   ```
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
   cd YOUR-REPO
   ```
2. Create a free project at [supabase.com](https://supabase.com).
3. In the Supabase dashboard, open **SQL Editor**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates the `tasks` table and security policies.
4. Open **Authentication > Providers > Email** and turn off "Confirm email" so new accounts
   can log in right away (optional, but easier for testing).
5. Open **Project Settings > API** and copy the Project URL and the `anon` public key.
   Paste them into `config.js`.
6. Run it locally by opening `index.html` with a simple local server, for example:
   ```
   npx serve .
   ```
   or use the VS Code Live Server extension.
7. To deploy, drag the project folder into Netlify (or connect the GitHub repo). No build
   command is needed and the publish directory is the project root.

## Notes

The Supabase anon key in `config.js` is public by design. Security comes from the Row Level
Security policies in `schema.sql`, which make sure a user can only read and change their own rows.
The `service_role` key is never used in this project.
