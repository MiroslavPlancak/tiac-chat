# Tiac Chat

`What does it do?`

The application is meant to provide a real time, live chat capability to all registered and authenticated clients. It encompasses three main channels of communication: 

-Public channels: visible by all connected clients, group chat structure. All connected clients can create new public channels which are visible to all users of the system.

-Private channels: any connected client can create a private channel. The creator of the private channel can add other clients to this channel, as well as remove them at will.

-Private message channels: all connected clients can write to other online or offline clients via direct, private message.

The application includes a searchable list of online and offline users, along with the broadcast of corresponding toast notifications of clients coming online or going offline. Private messaging channel is enhanced by "seen" as well as "is typing" logic.

`How is it structured?`

### Database

As it's persistence foundation the app uses an MSSQL database, which is connected to the back end of the application through Entity Framework. Entity Type Configurations are employed to precisely define database mappings for each domain entity, promoting maintainability and separation of concerns within the application's data layer. Fluent Validation is employed to validate user input and enforce business rules. With a database-first approach, Fluent Validation offers a flexible and expressive way to define validation rules in a fluent manner, enhancing the overall robustness and reliability of the application.

### Back End

Back end follows a three-tiered architecture design in the .NET framework, it is comprised of the following layers:

1) Data Access Layer: This layer's primary responsibility is to communicate with the database, through Entity Framework, and perform various CRUD operations over the data.

2) Business Access Layer: This layer contains the all of the business logic and core functionality of the back end part of the application. It's primary role is an intermediary of communication between Presentation Access Layer and Data Access Layer.

3) Presentation Access Layer: This layer's primary responsibility is communication with the client, which is achieved through exposure of HTTP end points via controllers and Hubs, which use AspNetCore.SignalR library to establish the connection with the connected client.

### Front end

Front end is written in Angular and it employs different communication protocols based on the nature of data interaction: 

HTTP Endpoints: In scenarios where real-time communication isn't necessary, the Angular front end communicates with the Presentation Access Layer via HTTP endpoints. These endpoints facilitate request/response-style communication for tasks such as user authentication, fetching historical messages, or non-real-time updates.

SignalR Hub: For real-time communication needs, such as live messaging and notifications, the front end interacts with the Presentation Access Layer through a SignalR Hub. By invoking methods on the SignalR Hub, the application achieves bi-directional, low-latency communication, ensuring seamless real-time updates and interactions in a client-server manner.


`How do I install it?`

### 1. Clone the Repository
Begin by cloning the repository to your local machine. You can do this by executing the following command in your terminal or command prompt:

`git clone https://github.com/MiroslavPlancak/tiac-chat.git`

### 2. Install Dependencies
Navigate to the `tiac-chat\frontend\PAL` directory in your terminal and install the necessary dependencies by running:

`npm install`

### 3. Import SQL Script
Locate the `tiac_chat_db_script.sql` script file within the root folder of the cloned repository. Import this script into a new database of your choice. Ensure to make any necessary adjustments to your connection string. Example of a connection string:

```typescript
"ConnectionStrings": {
    "DefaultConnection": "server=localhost; database=TiacChat; user id=Miroslav; password=1234; Encrypt=false; TrustServerCertificate=true;"
}
```

### 4. Run Backend Server
Navigate to `backend\TiacChat\TiacChat.Presentation` directory and execute the following command to run the backend server:

`dotnet run `

### 5. Serve Angular Application
Move to the `frontend\PAL\src` directory in your terminal. To simulate multiple clients for development purposes, serve the Angular application locally on different ports.For instance, you can achieve this by running the following commands:

`ng serve --port 4200`
`ng serve --port 4201`
`ng serve --port 4202`

### 6. Register and Login Users
Finally, register three new users and log in with each one locally on different ports using the following URLs:

`User 1: http://localhost:4200/login`
`User 2: http://localhost:4201/login`
`User 3: http://localhost:4202/login`
