import {useRef,useEffect,useState} from "react";
import { useSocket } from "../sockets/SocketContext";
import Room from "./Room";
import {ChatsTeardrop} from "@phosphor-icons/react";
function LandingPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const {socket} = useSocket();
    const [roomId,setroomId] = useState('');
    const [remoteSocketId,setRemoteSocketId] = useState('');
    const [localVideoTrack,setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const[localAudioTrack,setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [isCallButtonClicked,setIsCallButtonClicked] = useState(false);
    useEffect(()=>{
       const getCam = async ()=>{
        try{
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video:true,
                audio:true
            });
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }catch(err){
            alert("could not access camera and microphone please enable it");
        }
       }

       getCam();

       return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => {
            track.stop();
          });
        }
      };
    },[]);


    useEffect(()=>{
      if(socket){
        socket.on("userJoin",({user})=>{
          setRemoteSocketId(user);
        });

        socket?.on("roomId",({roomId})=>{
          alert("this is your room Id send it to other to join this meeting :-       "+"      "+roomId);
          setroomId(roomId);
        });

        socket?.on("notJoined",()=>{
          alert("check the roomId ,should be exactly matched")
          console.log(socket.id+" not joined");
        });
      }

      return ()=>{
        socket?.off("userJoin");
        socket?.off("roomId");
        socket?.off("notJoined");
      }
    },[socket]);

    const handleCall = async()=>{
      socket?.emit("createRoom","");
      setIsCallButtonClicked(true);
    };

    const handleInputChange = async(e:React.ChangeEvent<HTMLInputElement>)=>{
      setroomId(e.target.value);
    };

    const handleJoin = ()=>{
     if(roomId){
      socket?.emit("joinRoom",{roomId});
     }
    };

    if(!remoteSocketId){
      return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-custom-bg">
            <div className="flex flex-col justify-center items-center">
                <div><ChatsTeardrop size={96} color="#d90429" weight="fill" /></div><br/>
                <p  className="text-4xl underline underline-offset-2">LiveFusion</p>
                <p>welcome to LiveFusion where you can video chat!!</p>
                <p>to any one any where any time... unlimited</p>
            </div><br/>
            <div className="flex justify-center items-center">
                <div className="m-5">
                <video ref={videoRef} autoPlay playsInline controls={false} width={450} className="rounded-xl"/><br/>
                </div>
                <div className="flex flex-col text-xl justify-center items-center">
                <p>want to create a new meeting ? click on call</p><br />
                <button onClick={handleCall} className="bg-custom-elements px-6 rounded-3xl font-semibold">Call</button>
                <p>or</p>
                <p>join an existing meeting ? enter the meeting ID and Join !!!</p><br />
                <div className="flex flex-col text-xl justify-center items-center">
                  <input type="text" onChange={(e)=>handleInputChange(e)} value={roomId} className="rounded-3xl p-2 w-80 text-black"/><br/>
                  {!isCallButtonClicked && <button onClick={handleJoin}  className="bg-custom-elements px-6 rounded-3xl font-semibold">Join</button>}
                  {isCallButtonClicked && <p>wait for user to join you will automatically redirect to the meeting</p>}
                </div>
                </div>
            </div>
        </div>
      )
    }
      return (
        <Room
          roomId={roomId}
          remoteSocketId={remoteSocketId}
          localVideoTrack={localVideoTrack}
          localAudioTrack={localAudioTrack}
        />
      );
    
}

export default LandingPage