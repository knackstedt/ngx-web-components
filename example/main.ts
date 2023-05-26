
import express, { Express } from 'express';
import { FilesystemApi } from "./api/files";
import chalk from 'chalk';
import http from 'http';

const app: Express = express();

app.use("/api/filesystem", FilesystemApi);


const server = http.createServer(app);
server.listen(3000);

server.on('error', (error: any) => {

    if (error.syscall !== 'listen') {
        console.error(error);
        return;
    }

    switch (error.code) {
        case 'EACCES':
            return console.error('Port 3000 requires elevated privileges.');
        case 'EADDRINUSE':
            return console.error('Port 3000 is already in use.');
    }
});

server.on('listening', () => {
    const addr: any = server.address();

    console.log("Process pid %s listening on port %s.", process.pid, addr.port || addr);
});
