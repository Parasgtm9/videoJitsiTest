setTimeout(function(){
    (function() {
        var params = {},
            r = /([^&=]+)=?([^&]*)/g;

        function d(s) {
            return decodeURIComponent(s.replace(/\+/g, ' '));
        }
        var match, search = window.location.search;
        while (match = r.exec(search.substring(1)))
            params[d(match[1])] = d(match[2]);
        window.params = params;
    })();
    // ......................................................
    // ..................RTCMultiConnection Code.............
    // ......................................................

    var connection = new RTCMultiConnection();

    connection.autoCloseEntireSession = true;
    connection.publicRoomIdentifier = params.publicRoomIdentifier;

    // by default, socket.io server is assumed to be deployed on your own URL
    connection.socketURL = '/';

    // comment-out below line if you do not have your own socket.io server
    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    connection.socketMessageEvent = 'video-conference-demo';

    connection.session = {
        audio: false,
        video: true
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };

    connection.videosContainer = document.getElementById('videos-container');
    connection.onstream = function(event) {
        console.log(event.streamid)
        var existing = document.getElementById(event.streamid);
        if(existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        }

        event.mediaElement.removeAttribute('src');
        event.mediaElement.removeAttribute('srcObject');
        event.mediaElement.muted = true;
        event.mediaElement.volume = 0;

        var video = document.createElement('video');

        try {
            video.setAttributeNode(document.createAttribute('autoplay'));
            video.setAttributeNode(document.createAttribute('playsinline'));
        } catch (e) {
            video.setAttribute('autoplay', true);
            video.setAttribute('playsinline', true);
        }

        if(event.type === 'local') {
        video.volume = 0;
        try {
            video.setAttributeNode(document.createAttribute('muted'));
        } catch (e) {
            video.setAttribute('muted', true);
        }
        }
        console.log(event.stream)
        video.srcObject = event.stream;

        var width = parseInt(connection.videosContainer.clientWidth / 3) - 20;
        var mediaElement = getHTMLMediaElement(video, {
            title: event.userid,
            buttons: ['full-screen'],
            width: width,
            showOnMouseEnter: false
        });


        connection.videosContainer.appendChild(mediaElement);

        setTimeout(function() {
            mediaElement.media.play();
        }, 5000);

        mediaElement.id = event.streamid;
        
        
        if(event.type === 'local') {
        connection.socket.on('disconnect', function() {
            if(!connection.getAllParticipants().length) {
            location.reload();
            }
        });
        }
    };

    connection.onstreamended = function(event) {
        var mediaElement = document.getElementById(event.streamid);
        if (mediaElement) {
            mediaElement.parentNode.removeChild(mediaElement);
        }
    };

    connection.onMediaError = function(e) {
        if (e.message === 'Concurrent mic process limit.') {
            if (DetectRTC.audioInputDevices.length <= 1) {
                alert('Please select external microphone. Check github issue number 483.');
                return;
            }

            var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
            connection.mediaConstraints.audio = {
                deviceId: secondaryMic
            };

            connection.join(connection.sessionid);
        }
    };

    /* if(!!params.password) {
    connection.password = params.password;
    } */ 

    // detect 2G
    if(navigator.connection &&
    navigator.connection.type === 'cellular' &&
    navigator.connection.downlinkMax <= 0.115) {
    alert('2G is not supported. Please use a better internet service.');
    }
    var predefinedRoomId = '8591591041';
    setTimeout(function(){
        document.getElementById('btn-open-room').onclick = function() {
            this.disabled = true;
            connection.open(predefinedRoomId, function(isRoomOpened, roomid, error) {
                if (error) {
                    if (error === connection.errors.ROOM_NOT_AVAILABLE) {
                        alert('Someone already created this room. Please either join or create a separate room.');
                        return;
                    }
                    alert(error);
                }

                connection.socket.on('disconnect', function() {
                    location.reload();
                });
            });
        };

        document.getElementById('btn-join-room').onclick = function() {
            console.log(predefinedRoomId)
            connection.join(predefinedRoomId, function(isRoomJoined, roomid, error) {
                if (error) {
                    if (error === connection.errors.ROOM_NOT_AVAILABLE) {
                        alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                        return;
                    }
                    if (error === connection.errors.ROOM_FULL) {
                        alert('Room is full.');
                        return;
                    }
                    if (error === connection.errors.INVALID_PASSWORD) {
                        connection.password = prompt('Please enter room password.') || '';
                        if (!connection.password.length) {
                            alert('Invalid password.');
                            return;
                        }
                        connection.join(params.sessionid, function(isRoomJoined, roomid, error) {
                            if (error) {
                                alert(error);
                            }
                        });
                        return;
                    }
                    alert(error);
                }

                connection.socket.on('disconnect', function() {
                    location.reload();
                });
            });
        };
    });
},2000);