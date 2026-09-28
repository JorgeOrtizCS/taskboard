# Taskboard

A simple task manager web app. Users can register, log in, and manage their own tasks
(create, read, update, delete). Built for FAU Engineering Design 2 (ED2) using AI tools
to write most of the code.

**Deployed app:** <<< PASTE YOUR NETLIFY LINK >>>

**Demo video (unlisted on YouTube):** https://youtu.be/blh8xA5xmeE

## What the app does

- Register a new account, log in, and log out
- Add tasks with a title, an optional due date, and a status (To do, In progress, Done)
- View your tasks and filter them by status
- Edit a task's title and due date, change its status, or delete it
- Overdue tasks show up in red
- Each user only sees their own tasks. This is enforced in the database with Row Level Security.

## Technologies used

- HTML, CSS, and vanilla JavaScript (no build step)
- Supabase for the Postgres database and user authentication
- Netlify for hosting
- GitHub for version control
- AI tools: Claude (used to generate the app code, database schema, and README), <<< ADD ANY OTHER TOOLS YOU USED >>>

## How it works

- `index.html` has the layout for the login/register screen and the task screen.
- `style.css` has all the styling.
- `app.js` handles the logic. It signs users up and logs them in with Supabase Auth, sends
  create/read/update/delete requests to the `tasks` table, and draws the task list on the page.
- `config.js` holds the Supabase project URL and public key.
- `supabase/schema.sql` creates the `tasks` table and the Row Level Security policies so
  users can only read and change their own rows.

## Setup instructions

1. Clone the repo:
```
   git clone https://github.com/YOUR-USERNAME/taskboard.git
   cd taskboard
```
2. Create a free project at https://supabase.com.
3. In Supabase, open **SQL Editor**, paste in the contents of `supabase/schema.sql`, and run it.
4. In Supabase, go to **Authentication > Sign In / Providers > Email** and turn off
   "Confirm email" so new accounts can log in right away.
5. Go to **Project Settings > API Keys** and copy the Project URL and the publishable key.
   Paste them into `config.js`.
6. Run it locally by opening `index.html` in a browser (or use a local server like `npx serve .`).
7. To deploy, drag the project folder into https://app.netlify.com/drop. No build command is needed.

## Notes

The publishable (anon) key in `config.js` is meant to be public. Security comes from the
Row Level Security policies in `schema.sql`. The secret/service_role key is never used in this project.
