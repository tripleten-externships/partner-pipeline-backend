# Mac OS: Configuring DB with DBeaver

## Download MySQL

1. Go to [dev.mysql.com](https://dev.mysql.com) and select **9.3.0 Innovation** and the relevant OS.
2. Download the **installer** (not an archive) for easier installation.
3. Begin installation.
4. Accept the terms.
5. Select **Typical**.
6. Complete installation.
7. After installation, go to **Settings** → scroll to the bottom → click **MySQL** to open configuration.
8. Start MySQL server.

---

## Configure `.env`

1. Open your local clone of the backend repo.
2. Create a copy of `.env.example` and rename it to `.env`.
3. Copy or create a new `DB_Password`. Must be at least 8 characters long.
4. Take note of `DB_Username` — you will need it for DBeaver.

---

## Set Up DBeaver

1. Go to [dbeaver.io/download](https://dbeaver.io/download/) and select the appropriate installer based on your hardware.
2. After installation, open DBeaver → click **New Connection** → select **MySQL**.
3. Paste your `DB_Password` into the **Password** field.
4. Ensure the **Username** matches `DB_Username` in your `.env` file.
5. Scroll down to **Advanced** → confirm **Local Client** points to your MySQL executable:
   - Go to **Finder**.
   - Press `Cmd + Shift + G` to open **Go To Folder**.
   - Enter `/usr/local/mysql/bin`.
   - Press Enter.
   - Copy the path.
   - Return to DBeaver → check if Local Client matches this path.
   - If not:
     1. Click the dropdown next to Local Client.
     2. Click **Browse…**.
     3. Click **Add Home**.
     4. Paste the path into the search bar.
     5. Select the folder that appears.
     6. Click **OK** to close the Database Client Homes window.
     7. Ensure the correct location is selected for Local Client.
6. Navigate to **Driver Properties** → scroll down to `allowPublicKeyRetrieval` → set it to **TRUE**.
7. Click **OK** to finish connection settings.
8. In the new localhost connection, right-click **Databases** → select **Create New Database**.
9. Input `DB_NAME` and click **OK**.

You should now see a green checkmark when double-clicking the localhost connection — this means you're successfully connected.

---

## Run the Backend Server

1. Go to your backend repo.
2. Run:

   ```bash
   npm install
   ```

3. If you get an error about keystone being outdated, ignore it, and when the dependencies are done installing do npm run dev to start the server on port 8080. This will identify the database with DB_NAME that you created in DBeaver, and add all the schemas and what-have-you to it. Open localhost:8080 in your browser and create a new user with credentials you can remember (you can edit these later)
