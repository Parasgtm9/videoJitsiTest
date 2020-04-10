let Peer = require('simple-peer')
let socket = io()
var video = document.querySelector('video')
let client = {}

console.log('yes')
function PeerName(isHost){
    console.log(isHost)
    if(isHost){
        document.getElementById('infoLabel').innerHTML = 'Host';
    }
    else{
        document.getElementById('infoLabel').innerHTML = 'Peer';
    }
    document.getElementById('infoLabel').hidden = false;
}
socket.on('PeerName', PeerName)
// get stream
navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(stream => {
    socket.emit('NewClient')
    video.srcObject = stream
    video.play()

    // used to initialize a peer
    function InitPeer(type){
        console.log('initpeer')
        let peer = new Peer({initiator: (type == 'init') ? true : false, stream: stream, trickle: false})
        peer.on('stream', function(stream){
            CreateVideo(stream)
        })
        peer.on('close', function(){
            document.getElementById('peerVideo').remove();
            peer.destroy()
        })
        return peer
    }

    // for peer of type init
    function MakePeer(){
        socket.emit('ConnectedDevice')
        document.getElementById('infoLabel1').hidden = false;
        client.gotAnswer = false
        let peer = InitPeer('init')
        peer.on('signal', function(data){
            if(!client.gotAnswer){
                socket.emit('Offer', data)
            }            
        })
        client.peer = peer
    }

    // for peer of type not init
    function FrontAnswer(offer){
        console.log('frontanwser')
        let peer = InitPeer('notInit')
        peer.on('signal', (data) => {
            socket.emit('Answer', data)
        })
        peer.signal(offer)
    }

    function SignalAnswer(answer){
        console.log('signalanswer')        
        client.gotAnswer = true
        let peer = client.peer
        peer.signal(answer)
    }

    function CreateVideo(stream){ 
        let video = document.createElement('video')
        video.id = 'peerVideo'
        video.srcObject = stream
        video.style = "transform: rotateY(180deg);-webkit-transform:rotateY(180deg);-moz-transform:rotateY(180deg); /* Firefox */"
        video.class = "embed-responsive-item" 
        document.querySelector('#peerDiv').appendChild(video)
        video.play()
        document.getElementById('infoLabel1').hidden = true;
    }

    function SessionActive(){
        document.write("Session Active!!!!!!!!!")
    }

    function Disconnect(){
        document.getElementById('peerVideo').remove();
    }

    function ConnectedDevice(){
        document.getElementById('infoLabel1').hidden = false;
    }   

    socket.on('BackOffer', FrontAnswer)
    socket.on('BackAnswer', SignalAnswer)
    socket.on('SessionActive', SessionActive)
    socket.on('CreatePeer', MakePeer)
    socket.on('Disconnect', Disconnect)
    socket.on('ConnectedDevice', ConnectedDevice)
})
.catch(err => document.write(err))