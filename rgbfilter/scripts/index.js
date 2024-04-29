//Set up for offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

//if canvas is needed
var isBlendModeSupported = window.CSS && CSS.supports && CSS.supports('mix-blend-mode', 'multiply');
var videoCanvas = document.createElement('canvas');
var w = 640;
var h = 480;
var context = videoCanvas.getContext('2d');
var currentFilterColor = 'red';
if (!isBlendModeSupported) {
  prepForCanvas();
}

//Start video
var filterStream;
var button = document.getElementById('launch-camera');
var messenger = document.getElementById('toast');
var video = document.querySelector('video');
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && navigator.mediaDevices.enumerateDevices) {
  navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      for (var i = 0, l = devices.length; i < l; ++i) {
        var device = devices[i];
        if (device.kind === 'videoinput') {
          document.documentElement.classList.add('streamable');
          button.addEventListener('click', playFromMedia);
          return true;
        }
      }

      showUnsupportedMessage()
      return false;
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
      showUnsupportedMessage()
    });
} else {
  showUnsupportedMessage()
}

function showUnsupportedMessage() {
  messenger.querySelector('span').textContent = 'Your device does not have a camera or does not support it in this browser.';
  document.documentElement.classList.add('unsupported');
}

function playFromMedia(e) {
  navigator.mediaDevices.getUserMedia({
    audio: false, 
    video: {
      facingMode: 'environment'
    }
  }).then(onSuccessfulMediaStream)
    .catch(onFailedMediaStream);
}
function onSuccessfulMediaStream(stream) {
  video.scrollIntoView({behavior: 'smooth'});
  filterStream = stream;
  video.srcObject = stream;
  video.onloadedmetadata = function(e) {
    video.play();
    document.documentElement.classList.add('video-loaded');

    if (!isBlendModeSupported) {
      updateCanvasDimensions();
      video.addEventListener('play', playVideoToCanvas);
    }
  };
  document.documentElement.classList.add('streaming');
}
function onFailedMediaStream(err) {
  console.warn(err.name, err.message);
  var messengerText = messenger.querySelector('span');
  if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
    messengerText.textContent = 'Access to the camera was not provided.';
  } else if (err.name === 'OverconstrainedError') {
    messengerText.textContent = 'No camera found.';
  } else {
    messengerText.textContent = 'Unable to connect to camera.';
  }
  messenger.classList.add('active');
}
messenger.addEventListener('animationend', function(e) {
  messenger.classList.remove('active');
});

//Change Filter
var options = Array.from(document.querySelectorAll('input[type=radio]'));
options.forEach(function(option) {
  option.addEventListener('click', function(e) {
    document.documentElement.setAttribute('data-filter', e.currentTarget.id);
    currentFilterColor = e.currentTarget.id;
  })
});

//Stop Streaming
var stopper = document.getElementById('stop');
stopper.addEventListener('click', function(e) {
  filterStream.getTracks()[0].stop();
  document.documentElement.classList.remove('streaming');
});



function prepForCanvas() {
  document.documentElement.classList.add('canvas-fallback');
  var elementParent = document.querySelector('.rgb-player');
  var elementAfter = elementParent.querySelector('nav');
  videoCanvas.width = "640";
  videoCanvas.height = "480";
  elementParent.insertBefore(videoCanvas, elementAfter);

  window.addEventListener('resize', updateCanvasDimensions);  
}
function playVideoToCanvas(e) {
  drawCanvas();
}
function updateCanvasDimensions(e) {
  w = video.videoWidth || 640;
  h = video.videoHeight || 480;
  videoCanvas.width = w;
  videoCanvas.height = h;

  videoCanvas.style.height = (h / w * window.innerWidth) + 'px';
}
    
function drawCanvas() {
  if (video.paused || video.ended) {
    return false;
  }
  context.fillStyle = 'white';
  context.fillRect(0, 0, w, h);
  context.drawImage(video,0,0,w,h);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = currentFilterColor || '#ff0000';
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = 'normal';
  requestAnimationFrame(drawCanvas);
}