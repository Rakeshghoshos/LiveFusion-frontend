import {io ,Socket} from "socket.io-client";
import environment from "../env.d";

let socket: Socket | null = null;

export const socketConnection = ()=>{
    if(!socket){
        socket = io(`${environment.SOCKET_URL}`,{
            transports: ["websocket", "polling"], 
            withCredentials: true,
          });

          socket.on("connect", () => {
            console.log("Connected to WebSocket server");
          });
      
          socket.on("disconnect", () => {
            console.log("Disconnected");
          });
        }
};

export const getSocket = (): Socket | null=> {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      console.log("Disconnected from WebSocket");
    }
  };
