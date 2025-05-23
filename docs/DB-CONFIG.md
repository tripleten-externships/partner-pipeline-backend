# Configuring MySQL and DBeaver

## Configuring MySQL

1. Go to [dev.mysql.com](https://discord.com/channels/1078663743568883783/1374567457372504074/1374608362414805107) and select 9.3.0 Innovation and relevant OS, or the latest version of Innovation
2. Download the installer (not an archive) for easier installation
3. Installation:
   - Accept the terms
   - Select `Typical`
   - Begin installation
4. After installation, open the configuration app (MySQL Configurator)

### Configurator Steps

1. `Server Installations` remains the same
2. `Type and Networking` stays the same; _ensure port is `3306`_ or another available port and click `Next`
3. `Accounts and Roles`:
   - Open your local **CLONE** of the backend repo,
   - Create a copy of `.env.example` and rename it to `.env` exactly
   - Copy the contents of `DB_PASSWORD` and click `Add User`
   - Add a username
   - Host should be `localhost`
   - Paste `DB_PASSWORD` password into the password fields and click OK
   - Click Next
4. Take note of the service name and click next
   - If you're trying to connect to the server from DBeaver, knowing the service name is a useful troubleshooting step. The service must be running before you connect to the server. On Windows:
     - Press `Ctrl + R` and enter `services.msc` to open the Services window. Look for the service name and ensure it's running.
5. `Server File Permissions`: click next
6. `Sample Databases` your choice, then click next
7. `Apply Configuration`: click `Execute`
8. After executing, click `Next -> Finish`

## Installing and configuring DBeaver

Install from [dbeaver.io](https://dbeaver.io/download/)

1. Ensure the options `Associate SQL files` and `Associate SQLite database files` are selected then install it.

### Using DBeaver

#### Adding a connection (localhost)

1. Open DBeaver (it takes a while)
2. When it finally opens, in the navbar, click `Database -> New Database Connection` or press `Ctrl+Shift+N`
3. Select MySQL from the many options

There are three sections in the window that appears:

- Server
- Authentication
- Advanced

##### -> SERVER TAB

Don't touch anything, but ensure that the port matches the one you selected for your MySQL installation

##### -> AUTHENTICATION TAB

These fields should be filled with the contents of `DB_USERNAME` and `DB_PASSWORD`. Ideally, I think `Username` should remain as root, and this should be reflecting in your `.env` file as well.

##### -> ADVANCED TAB

1. `Local Client` should be the **_MySQL executable_**. Essentially, this should point to your local installation of MySQL. Select it.
   - If you don't see an option for 9.3, close the window, cancelling your changes, and follow the steps for `Adding a New Home`.
2. Click `Finish`

##### Adding a New Home

1. In the navbar, `Click Database -> Driver Manager`, and look for `MySQL`, click it, and click `Edit`
2. In the new window, go to the `Local Client` tab then click the `Add Home` button
3. An explorer window should pop up allowing you to navigate to the FOLDER THAT HAS THE EXECUTABLE. For Windows the executable should be here: `C:\Program Files\MySQL\MySQL Server 9.3\bin`. Navigate there, select the `bin` folder, and click `Select that folder`
4. Click the new 'home' you just created, then click OK and close the window

##### Adding a Database to the new `localhost` connection

1. Right click `Databases` in the new localhost connection and `Create New Database`
2. Paste the contents of `DB_NAME` here and click OK
3. Double-click the localhost connection and you should see a green checkmark that indicates you're connected.

## Running the backend for the first time

1. Go to your backend clone and install dependencies with `npm install`
   - If you get an error about keystone being outdated, ignore it
2. When the dependencies are done installing (and any keystone errors appear) run `npm run dev` to start the server on port `8080`
   - The database with `DB_NAME` that you created in DBeaver will be identified and set up according to the prisma configuration
3. Open `localhost:8080` in your browser and create a new user with credentials you can remember (you can edit these later)
