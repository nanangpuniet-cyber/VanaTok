window.addEventListener('DOMContentLoaded', async () => {
  const version = await window.vanatok.getVersion();
  const title = document.querySelector('.brand small');
  if (title) title.textContent = `v${version}`;

  const previewVideo = document.getElementById('previewVideo');
  const previewFrame = document.getElementById('previewFrame');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const recordBtn = document.getElementById('recordBtn');
  const screenSourceBtn = document.getElementById('screenSourceBtn');
  const savePresetBtn = document.getElementById('savePresetBtn');
  const createDraftBtn = document.getElementById('createDraftBtn');
  const captionInput = document.getElementById('captionInput');
  const allowComments = document.getElementById('allowComments');
  const publishStatus = document.getElementById('publishStatus');
  const publishNavBtn = document.getElementById('publishNavBtn');
  const facingButtons = Array.from(document.querySelectorAll('[data-facing]'));
  const brightnessInput = document.getElementById('brightness');
  const contrastInput = document.getElementById('contrast');
  const saturationInput = document.getElementById('saturation');

  let stream = null;
  let screenStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let lastRecording = null;
  let isRecording = false;
  let facingMode = 'user';

  function applyFilterStyles() {
    previewVideo.style.filter = `brightness(${brightnessInput.value}%) contrast(${contrastInput.value}%) saturate(${saturationInput.value}%)`;
  }

  function setPublishStatus(message, state = '') {
    publishStatus.textContent = message;
    publishStatus.dataset.state = state;
  }

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      previewVideo.srcObject = stream;
      await previewVideo.play();
      previewFrame.classList.add('active');
      startCameraBtn.textContent = 'Camera Active';
      startCameraBtn.classList.add('active');
    } catch (error) {
      console.error('Camera error:', error);
      startCameraBtn.textContent = 'Camera Failed';
      alert('Kamera atau mikrofon tidak bisa diakses. Pastikan izinnya sudah diberikan.');
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    previewVideo.srcObject = screenStream || null;
    previewFrame.classList.remove('active');
    startCameraBtn.textContent = 'Start Camera';
    startCameraBtn.classList.remove('active');
  }

  async function toggleScreenSource() {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        screenStream = null;
        previewVideo.srcObject = stream;
        screenSourceBtn.classList.remove('active');
        return;
      }
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      previewVideo.srcObject = screenStream;
      await previewVideo.play();
      screenSourceBtn.classList.add('active');
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        screenStream = null;
        previewVideo.srcObject = stream;
        screenSourceBtn.classList.remove('active');
      });
    } catch (error) {
      console.error('Screen share error:', error);
      setPublishStatus('Screen capture dibatalkan.', 'error');
    }
  }

  function savePreset() {
    localStorage.setItem('vanatok-preset', JSON.stringify({
      brightness: brightnessInput.value,
      contrast: contrastInput.value,
      saturation: saturationInput.value,
      facingMode,
      savedAt: new Date().toISOString()
    }));
    setPublishStatus('Preset berhasil disimpan.', 'success');
  }

  function loadPreset() {
    try {
      const preset = JSON.parse(localStorage.getItem('vanatok-preset') || '{}');
      if (!preset.brightness) return;
      brightnessInput.value = preset.brightness;
      contrastInput.value = preset.contrast;
      saturationInput.value = preset.saturation;
      facingMode = preset.facingMode || 'user';
    } catch (error) {
      console.warn('Preset tidak dapat dibaca:', error);
    }
  }

  function chooseRecorderMimeType() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }

  function startRecording() {
    const activeStream = previewVideo.srcObject;
    if (!activeStream) return alert('Mulai kamera terlebih dahulu sebelum merekam.');
    chunks = [];
    const mimeType = chooseRecorderMimeType();
    mediaRecorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined);
    mediaRecorder.ondataavailable = (event) => event.data?.size && chunks.push(event.data);
    mediaRecorder.onstop = () => {
      lastRecording = new Blob(chunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(lastRecording);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vanatok-${Date.now()}.webm`;
      link.click();
      URL.revokeObjectURL(url);
      recordBtn.textContent = 'Record';
      recordBtn.classList.remove('recording');
      isRecording = false;
      setPublishStatus('Rekaman siap. Anda dapat membuat draft TikTok.', 'success');
    };
    mediaRecorder.start(250);
    isRecording = true;
    recordBtn.textContent = 'Stop';
    recordBtn.classList.add('recording');
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) mediaRecorder.stop();
  }

  function createTikTokDraft() {
    const caption = captionInput.value.trim();
    if (!lastRecording) {
      setPublishStatus('Rekam video terlebih dahulu sebelum membuat draft.', 'error');
      return;
    }
    const draft = {
      caption,
      allowComments: allowComments.checked,
      fileName: `vanatok-${Date.now()}.webm`,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('vanatok-tiktok-draft', JSON.stringify(draft));
    setPublishStatus('Draft tersimpan. Upload TikTok resmi perlu OAuth/API yang disetujui.', 'success');
  }

  brightnessInput.addEventListener('input', applyFilterStyles);
  contrastInput.addEventListener('input', applyFilterStyles);
  saturationInput.addEventListener('input', applyFilterStyles);
  startCameraBtn.addEventListener('click', () => (stream ? stopCamera() : startCamera()));
  screenSourceBtn.addEventListener('click', toggleScreenSource);
  savePresetBtn.addEventListener('click', savePreset);
  createDraftBtn.addEventListener('click', createTikTokDraft);
  publishNavBtn.addEventListener('click', () => document.getElementById('publishPanel').scrollIntoView({ behavior: 'smooth' }));

  facingButtons.forEach((button) => button.addEventListener('click', async () => {
    const nextFacing = button.dataset.facing;
    if (nextFacing === facingMode) return;
    facingMode = nextFacing;
    if (stream) {
      stopCamera();
      await startCamera();
    }
  }));

  recordBtn.addEventListener('click', () => (isRecording ? stopRecording() : startRecording()));
  loadPreset();
  applyFilterStyles();
});
