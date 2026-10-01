window.addEventListener('DOMContentLoaded', async () => {
  const version = await window.vanatok.getVersion();
  const title = document.querySelector('.brand small');
  if (title) {
    title.textContent = `v${version}`;
  }

  const previewVideo = document.getElementById('previewVideo');
  const previewFrame = document.getElementById('previewFrame');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const recordBtn = document.getElementById('recordBtn');
  const screenSourceBtn = document.getElementById('screenSourceBtn');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const facingButtons = Array.from(document.querySelectorAll('[data-facing]'));

  const brightnessInput = document.getElementById('brightness');
  const contrastInput = document.getElementById('contrast');
  const saturationInput = document.getElementById('saturation');

  let stream = null;
  let screenStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let isRecording = false;
  let facingMode = 'user';

  function applyFilterStyles() {
    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    const saturation = saturationInput.value;

    previewVideo.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  }

  brightnessInput.addEventListener('input', applyFilterStyles);
  contrastInput.addEventListener('input', applyFilterStyles);
  saturationInput.addEventListener('input', applyFilterStyles);

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
      previewFrame.classList.add('active');
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
    previewVideo.srcObject = screenStream || null;
    previewFrame.classList.remove('active');
    startCameraBtn.textContent = 'Start Camera';
    startCameraBtn.classList.remove('active');
  }

  async function toggleScreenSource() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
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

  function savePreset() {
    const preset = {
      brightness: brightnessInput.value,
      contrast: contrastInput.value,
      saturation: saturationInput.value,
      facingMode,
      savedAt: new Date().toISOString()
    };

    const key = 'vanatok-preset';
    localStorage.setItem(key, JSON.stringify(preset));
    alert('Preset berhasil disimpan.');
  }

  function loadPreset() {
    const preset = JSON.parse(localStorage.getItem('vanatok-preset') || '{}');
    if (!preset.brightness) return;

    brightnessInput.value = preset.brightness;
    contrastInput.value = preset.contrast;
    saturationInput.value = preset.saturation;
    facingMode = preset.facingMode || 'user';
    applyFilterStyles();
  }

  function startRecording() {
    const activeStream = previewVideo.srcObject;
    if (!activeStream) {
      alert('Mulai kamera terlebih dahulu sebelum merekam.');
      return;
    }

    chunks = [];
    mediaRecorder = new MediaRecorder(activeStream);

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
  savePresetBtn.addEventListener('click', savePreset);

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

  loadPreset();
  applyFilterStyles();
});
