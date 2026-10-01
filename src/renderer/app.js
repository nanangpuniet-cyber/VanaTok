window.addEventListener('DOMContentLoaded', async () => {
  const version = await window.vanatok.getVersion();
  const title = document.querySelector('.brand small');
  if (title) {
    title.textContent = `v${version}`;
  }

  const previewVideo = document.getElementById('previewVideo');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const recordBtn = document.getElementById('recordBtn');
  const screenSourceBtn = document.getElementById('screenSourceBtn');
  const facingButtons = Array.from(document.querySelectorAll('[data-facing]'));

  let stream = null;
  let mediaRecorder = null;
  let chunks = [];
  let isRecording = false;
  let facingMode = 'user';

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      previewVideo.srcObject = stream;
      previewVideo.play();
      startCameraBtn.textContent = 'Camera Active';
      startCameraBtn.classList.add('active');
    } catch (error) {
      console.error('Camera error:', error);
      startCameraBtn.textContent = 'Camera Failed';
      alert('Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    previewVideo.srcObject = null;
    startCameraBtn.textContent = 'Start Camera';
    startCameraBtn.classList.remove('active');
  }

  async function toggleScreenSource() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      previewVideo.srcObject = screenStream;
      previewVideo.play();
      screenSourceBtn.classList.add('active');

      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        previewVideo.srcObject = stream;
        previewVideo.play();
        screenSourceBtn.classList.remove('active');
      });
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Akses layar dibatalkan atau tidak didukung.');
    }
  }

  function startRecording() {
    if (!previewVideo.srcObject) {
      alert('Mulai kamera terlebih dahulu sebelum merekam.');
      return;
    }

    chunks = [];
    mediaRecorder = new MediaRecorder(previewVideo.srcObject);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vanatok-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordBtn.textContent = 'Record';
      recordBtn.classList.remove('recording');
      isRecording = false;
    };

    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = 'Stop';
    recordBtn.classList.add('recording');
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  }

  startCameraBtn.addEventListener('click', async () => {
    if (stream) {
      stopCamera();
      return;
    }
    await startCamera();
  });

  screenSourceBtn.addEventListener('click', toggleScreenSource);

  facingButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const nextFacing = button.dataset.facing;
      if (nextFacing === facingMode) return;

      facingMode = nextFacing;
      if (stream) {
        stopCamera();
        await startCamera();
      }
    });
  });

  recordBtn.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
      stopCamera();
    }
  });
});
