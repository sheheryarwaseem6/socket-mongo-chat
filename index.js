const express = require('express');
const app = express();
const cors = require('cors');
var fs = require('fs');
const env = require('dotenv');  
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const userRoutes = require("./routes/userroutes");
const path = require('path'); 
const socket = require('socket.io');
const http = require('http');
const server = http.createServer(app);

const {
    get_messages,
    send_message
} = require('./utlis/messages');


app.use(cors())
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false}))

env.config();

// const options = {
//     key: fs.readFileSync('/home/serverappsstagin/ssl/keys/c2a88_d6811_bbf1ed8bd69b57e3fcff0d319a045afc.key'),
//     cert: fs.readFileSync('/home/serverappsstagin/ssl/certs/server_appsstaging_com_c2a88_d6811_1665532799_3003642ca1474f02c7d597d2e7a0cf9b.crt'),
// };

//  const server = require('https').createServer(options, app);
//  const server = require('http').createServer(app);
//environment variables or you can say constants

//mongodb connection
mongoose.connect (
    process.env.MONGODBURL,
    {
        useNewUrlParser: true,
        useunifiedTopology: true,

    }
    
    ).then(() => {
    console.log('Connected');
});


//routes    
const apiRoutes = require('./routes/userroutes')
const Content = require('./models/Content');
app.use('/api', apiRoutes);
app.use('/upload', express.static('upload'));


/** Content seeder */
const contentSeeder = [
    {
        title: "Privacy Policy",
        content: "This is privacy policy.",
        type: "privacy_policy"
    },
    {
        title: "User Agreement",
        content: "This is User Agreement.",
        type: "user_agreement"
    },
    {
        title: "Terms and Conditions",
        content: "This is terms and conditions.",
        type: "terms_and_conditions"
    }
];
const dbSeed = async () => {
    await Content.deleteMany({});
    await Content.insertMany(contentSeeder);
}
dbSeed().then( () => {
    // mongoose.connection.close();
})

var io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: false,
        transports: ['websocket', 'polling'],
        allowEIO3: true
    },
});


// Run when client connects
io.on('connection', socket => {
    console.log("socket connection " + socket.id);
    socket.on('get_messages', function(object) {
        var user_room = "user_" + object.sender_id;
        socket.join(user_room);
        get_messages(object, function(response) {
            if (response.length > 0) {
                console.log("get_messages has been successfully executed...");
                io.to(user_room).emit('response', { object_type: "get_messages", data: response });
            } else {
                console.log("get_messages has been failed...");
                io.to(user_room).emit('error', { object_type: "get_messages", message: "There is some problem in get_messages..." });
            }
        });
    });
    // SEND MESSAGE EMIT
    socket.on('send_message', function(object) {
        var sender_room = "user_" + object.sender_id;
        var receiver_room = "user_" + object.receiver_id;
        send_message(object, function(response_obj) {
            if (response_obj) {
                console.log("send_message has been successfully executed...");
                io.to(sender_room).to(receiver_room).emit('response', { object_type: "get_message", data: response_obj });
            } else {
                console.log("send_message has been failed...");
                io.to(sender_room).to(receiver_room).emit('error', { object_type: "get_message", message: "There is some problem in get_message..." });
            }
        });
    });
});
// Run when client connects
io.on('connection', socket => {
    console.log("socket connection " + socket.id);
    socket.on('get_messages', function(object) {
        var user_room = "user_" + object.sender_id;
        socket.join(user_room);
        get_messages(object, function(response) {
            if (response.length > 0) {
                console.log("get_messages has been successfully executed...");
                io.to(user_room).emit('response', { object_type: "get_messages", data: response });
            } else {
                console.log("get_messages has been failed...");
                io.to(user_room).emit('error', { object_type: "get_messages", message: "There is some problem in get_messages..." });
            }
        });
    });
    // SEND MESSAGE EMIT
    socket.on('send_message', function(object) {
        var sender_room = "user_" + object.sender_id;
        var receiver_room = "user_" + object.receiver_id;
        send_message(object, function(response_obj) {
            if (response_obj) {
                console.log("send_message has been successfully executed...");
                io.to(sender_room).to(receiver_room).emit('response', { object_type: "get_message", data: response_obj });
            } else {
                console.log("send_message has been failed...");
                io.to(sender_room).to(receiver_room).emit('error', { object_type: "get_message", message: "There is some problem in get_message..." });
            }
        });
    });
});



// app.use(userRoutes)
const PORT = process.env.PORT || 3017;
server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${PORT}`) 
});