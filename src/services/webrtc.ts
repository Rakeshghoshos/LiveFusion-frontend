export class WebrtcServices{
    public peer: RTCPeerConnection;
    constructor(){
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" }
            ]
        });
    }

    addTrack(track: MediaStreamTrack, stream: MediaStream) {
        if (this.peer) {
            this.peer.addTrack(track, stream);
            console.log("Track added to peer connection:", track);
        } else {
            console.error("Peer connection not initialized.");
        }
    }

    async sendOffer() {
        try {
          if (this.peer) {
            if (this.peer.signalingState === "stable" || this.peer.signalingState === "have-local-offer") {
              const offer = await this.peer.createOffer();
              await this.peer.setLocalDescription(offer);
              return offer;
            } else {
              console.warn("Cannot create offer in current signaling state:", this.peer.signalingState);
            }
          }
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
      

    async sendAnswer(offer:RTCSessionDescription){
        try {
            if (this.peer) {
                await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await this.peer.createAnswer();
                await this.peer.setLocalDescription(answer);
                return answer;
            }
        } catch (error) {
            console.error("Error creating answer:", error);
        }
    }

    async setLocalDescription(sdp: RTCSessionDescription) {
        try {
            if (this.peer) {
                if (this.peer.signalingState !== 'stable') {
                    console.warn('Attempting to set local description in invalid signaling state:', this.peer.signalingState);
                    return;
                }
                await this.peer.setLocalDescription(sdp);
            }
        } catch (error) {
            console.error("Error setting local description:", error);
        }
    }

    async addIceCandidate(candidate: RTCIceCandidate) {
        try {
            if (this.peer && this.peer.remoteDescription) {
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("ICE candidate added:", candidate);
            } 
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    // Set remote description and apply buffered ICE candidates
    async setRemoteDescription(sdp: RTCSessionDescription) {
        try {
            if (this.peer) {
                await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
                console.log("Remote description set.");
            }
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    }
    // Close the peer connection
    closeConnection() {
        if (this.peer) {
            this.peer.ontrack = null;
            this.peer.onicecandidate = null;
            this.peer.close();
            console.log("Peer connection closed.");
        }
    }
}

let WebRtc = new WebrtcServices();
export default WebRtc;