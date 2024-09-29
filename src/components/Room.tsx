import { useEffect ,useRef, useState} from "react";
import { useSocket } from "../sockets/SocketContext";
import WebRtc from "../services/webrtc";
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CallEndIcon from '@mui/icons-material/CallEnd';
// import VolumeUpIcon from '@mui/icons-material/VolumeUp';
// import VolumeOffIcon from '@mui/icons-material/VolumeOff';
// import MicIcon from '@mui/icons-material/Mic';
// import MicOffIcon from '@mui/icons-material/MicOff';

interface Chat {
  message:String,
  sender:String
}

function Room({
  roomId,
  remoteSocketId,
  localAudioTrack,
  localVideoTrack,
}: {
  roomId:string | null,
  remoteSocketId:string | null,
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMettingUser,setIsMeetingUser] = useState(false);
  const {socket} = useSocket();
  const [isRemoteBig, setIsRemoteBig] = useState(true); 
  const [message,setMessage] = useState("");
  const [Chat, setChat] = useState<Chat[]>([]); 
  // const [isMute,setIsMute] = useState(false);
  // const [isMicOff,setIsMicOff] = useState(false);

 useEffect(()=>{
  if (localVideoRef.current && localVideoTrack) {
    const stream = new MediaStream([localVideoTrack]);
    if (localAudioTrack) {
      stream.addTrack(localAudioTrack);
    }
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.onloadedmetadata = () => {
      localVideoRef.current?.play().catch((e) => console.error("Error playing video:", e));
    };
  }
}, [localVideoTrack]);

useEffect(() => {
  if (WebRtc.peer) {
    if (localAudioTrack) {
      WebRtc.peer.addTrack(localAudioTrack, new MediaStream([localAudioTrack]));
    }
    if (localVideoTrack) {
      WebRtc.peer.addTrack(localVideoTrack, new MediaStream([localVideoTrack]));
    }
  }
}, [localAudioTrack, localVideoTrack, WebRtc]);

  useEffect(()=>{
    if(socket){
      socket.emit("getMettingStartUser",{roomId});
      socket.on("getMettingStartUser",({user1})=>{
        if(user1.toString() == socket.id!.toString()){
          setIsMeetingUser(true);
          alert("user joined click call button to start");
        }
      });

     socket.on("incomingCall", async (data) => {
        const answer = await WebRtc.sendAnswer(data.offer);
        socket.emit("accepted", { id: data.id, ans: answer });
    });

    socket.on("accepted", async (data) => {
      console.log("setdesc");
      await WebRtc.peer.setRemoteDescription(data.ans);
    });

    socket.on("endCall",()=>{
      window.location.reload();
    });
    }

    return ()=>{
      socket?.off("startCreatingOffer");
      socket?.off("incomingCall");
      socket?.off("accepted");
    }
  },[socket,WebRtc,remoteSocketId,isMettingUser]);


  useEffect(()=>{
    if(socket){
      WebRtc.peer.addEventListener("negotiationneeded",async ()=>{
        const offer = await WebRtc.sendOffer();
        socket.emit("negotiation",{offer:offer,id:remoteSocketId});
      });
  
      socket.on("negotiation", async (data) => {
        if (WebRtc.peer.signalingState === "stable") {
          const answer = await WebRtc.sendAnswer(data.offer);
          socket.emit("negotiation-done", { id: data.id, ans: answer });
        }
      });
  
      socket.on("negotiation-final", async (data) => {
        console.log("done");
        await WebRtc.peer.setRemoteDescription(data.ans);
      });
    }

    return ()=>{
      socket?.off("negotiation");
      socket?.off("negotiation-final");
    }
  },[socket,remoteSocketId]);

useEffect(() => {
  if (socket && remoteSocketId && WebRtc.peer.currentRemoteDescription) {
    socket.on("ice-candidate", (data) => {
      WebRtc.addIceCandidate(data.candidate).catch((error: any) => {
        console.error("Error adding received ICE candidate:", error);
      });
    });

    WebRtc.peer.onicecandidate = (event: any) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, remoteSocketId });
      }
    };

    return () => {
      socket.off("ice-candidate");
      WebRtc.peer.onicecandidate = null;
    };
  }
}, [socket, remoteSocketId, WebRtc]);


    // Handle track events
    useEffect(() => {
      const handleTrackEvent = (event: RTCTrackEvent) => {
        if (event.streams && event.streams.length > 0) {
          const remoteStream = event.streams[0];
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.onloadedmetadata = () => {
              remoteVideoRef.current?.play().catch((e) => console.error("Error playing remote video:", e));
            };
          }
        }
      };
  
      WebRtc.peer.addEventListener("track", handleTrackEvent);
  
      return () => {
        WebRtc.peer.removeEventListener("track", handleTrackEvent);
      };
    }, [WebRtc]);

    // useEffect(()=>{
    //   const videoElement = remoteVideoRef.current;
    //   if (videoElement) {
    //     videoElement.muted = !isMute;
    //   }
    // },[isMute]);

    // useEffect(()=>{
    //   const videoElement = localVideoRef.current;
    //   if (videoElement && videoElement.srcObject) {
    //     const mediaStream = videoElement.srcObject as MediaStream;
    //     const audioTracks = mediaStream.getAudioTracks();
    //     if (audioTracks.length > 0) {
    //       audioTracks.forEach((track:any) => {
    //         track.enabled = !track.enabled;
    //       });
    //       setIsMicOff(!isMicOff); // Toggle mic state
    //     }
    //   }
    // },[isMicOff]);

    // Stop remote video and clean up
  const stopRemoteVideo = () => {
    if (remoteVideoRef.current) {
      const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }
      remoteVideoRef.current.pause();
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Cleanup WebRTC connection
  const cleanupWebRTC = () => {
    if (WebRtc.peer) {
      WebRtc.peer.close();
    }
  };

  const handleCall = async()=>{
    if(socket){
        const offer = await WebRtc.sendOffer();
        socket.emit("offer", { remoteSocketId: remoteSocketId, offer });
        console.log(offer);
    }
  }

  const handleCallEnd = ()=>{
    stopRemoteVideo();
    cleanupWebRTC();
    if(socket){
      socket.emit("endCall","");
    }
    window.location.reload();
  }

  useEffect(() => {
    if (socket) {
      // Listen for remote messages
      socket.on("message", ({ message, sender }) => {
        setChat((prevChat) => [...prevChat, { message, sender }]);
      });
    }
  }, [socket]);
  
  const handleMessageSend = () => {
    if (message.trim() !== "") {
      const localMessage = { message, sender: "local" };
      setChat((prevChat) => [...prevChat, localMessage]);
  
      if (socket) {
        socket.emit("message", { message, sender: "remote" });
        setMessage("");
      }
    }
  };

  const toggleVideoSize = () => {
    setIsRemoteBig((prev) => !prev); 
  };

  return (
    <div className="w-full h-screen bg-custom-bg flex justify-center items-center">
      {/* Video area for remote or local depending on state */}
      <div className="w-2/3 h-[80vh] flex justify-center items-center relative">
        {/* Remote video (clickable to toggle sizes) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          onClick={toggleVideoSize} // Clicking on remote video will toggle sizes
          className={`object-cover ${isRemoteBig ? 'w-full h-full' : 'w-40 h-40 absolute bottom-4 right-4 border border-gray-400 shadow-lg'}`}
        />

        {/* Local video (clickable to toggle sizes) */}
        <div
          className={`absolute ${isRemoteBig ? 'bottom-4 right-4 w-40 h-40' : 'w-full h-full'} border border-gray-400 shadow-lg`}
          onClick={toggleVideoSize} // Clicking on local video will toggle sizes
        >
          <video
            ref={localVideoRef}
            autoPlay

            className="w-full h-full object-cover"
          />
        </div>

        {/* Call controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {isMettingUser ? (
            <button onClick={handleCall} className="px-4 py-2 bg-blue-500 text-white rounded-md">
              <VideoCallIcon />
            </button>
          ) : null}
          <button onClick={handleCallEnd} className="px-4 py-2 bg-red-500 text-white rounded-md">
            <CallEndIcon/>
          </button>
          {/* {
            isMute ? (
              <button onClick={()=> setIsMute((prev)=> !prev)}><VolumeUpIcon/></button>
            ) :(
              <button onClick={()=> setIsMute((prev)=> !prev)}><VolumeOffIcon/></button>
            )
          }
          {
            isMicOff ? (
              <button onClick={()=> setIsMicOff((prev)=> !prev)}><MicIcon/></button>
            ) :(
              <button onClick={()=> setIsMicOff((prev)=> !prev)}><MicOffIcon/></button>
            )
          } */}
        </div>
      </div>


      <div className="w-1/3 h-[80vh] border-l border-gray-300 p-4 bg-custom-elements">
      <div className="h-full overflow-y-auto">
  {Chat.map((chatItem, idx) => (
    <div
      key={idx}
      className={`mb-2 ${chatItem.sender === "local" ? "text-right" : "text-left"}`}
    >
      <div
        className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
          chatItem.sender === "local" ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
        }`}
      >
        {chatItem.message}
      </div>
    </div>
  ))}
</div>

        {/* Chat input */}
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            className="flex-grow p-2 border border-gray-400 rounded-md text-black"
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md" onClick={handleMessageSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
  
}

export default Room