package com.nanangpuniet.vanatok

import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { VanaTokApp() }
    }
}

@Composable
private fun VanaTokApp() {
    val context = LocalContext.current
    var hasPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        hasPermission = it[Manifest.permission.CAMERA] == true && it[Manifest.permission.RECORD_AUDIO] == true
    }

    LaunchedEffect(Unit) {
        if (!hasPermission) permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
    }

    Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF070D1A)) {
        if (hasPermission) CameraStudio() else PermissionMessage { permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)) }
    }
}

@Composable
private fun PermissionMessage(onRequest: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("VanaTok membutuhkan akses kamera dan mikrofon", color = Color.White)
        Spacer(Modifier.height(16.dp))
        Button(onClick = onRequest) { Text("Berikan izin") }
    }
}

@Composable
private fun CameraStudio() {
    val context = LocalContext.current
    var lens by remember { mutableStateOf(CameraSelector.LENS_FACING_FRONT) }
    var brightness by remember { mutableFloatStateOf(1f) }
    var recording by remember { mutableStateOf<Recording?>(null) }
    var videoCapture by remember { mutableStateOf<VideoCapture<Recorder>?>(null) }
    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    val outputDir = remember { context.cacheDir }

    Column(Modifier.fillMaxSize().background(Color(0xFF070D1A))) {
        Text("VanaTok", color = Color.White, modifier = Modifier.padding(20.dp), style = androidx.compose.material3.MaterialTheme.typography.headlineSmall)
        Box(Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp)) {
            AndroidView(factory = { PreviewView(it).also { view -> previewView = view } }, modifier = Modifier.fillMaxSize())
            Text(if (recording != null) "● REC" else "LIVE", color = if (recording != null) Color.Red else Color.White, modifier = Modifier.align(Alignment.TopStart).padding(16.dp))
        }
        Text("Brightness", color = Color.LightGray, modifier = Modifier.padding(horizontal = 20.dp))
        Slider(value = brightness, onValueChange = { brightness = it }, valueRange = .5f..1.5f, modifier = Modifier.padding(horizontal = 20.dp))
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { lens = if (lens == CameraSelector.LENS_FACING_FRONT) CameraSelector.LENS_FACING_BACK else CameraSelector.LENS_FACING_FRONT; bindCamera(context, previewView, lens) }, modifier = Modifier.weight(1f)) { Text("Flip") }
            Button(onClick = {
                if (recording == null) {
                    val capture = videoCapture ?: return@Button
                    val file = File(outputDir, "vanatok-${System.currentTimeMillis()}.mp4")
                    val options = FileOutputOptions.Builder(file).build()
                    recording = capture.output.prepareRecording(context, options).withAudioEnabled().start(ContextCompat.getMainExecutor(context)) { event ->
                        if (event is VideoRecordEvent.Finalize) { recording = null; shareVideo(context, file) }
                    }
                } else { recording?.stop(); recording = null }
            }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF3F8F)), modifier = Modifier.weight(1f)) { Text(if (recording == null) "Record" else "Stop") }
        }
    }

    LaunchedEffect(previewView, lens) { bindCamera(context, previewView, lens) { videoCapture = it } }
}

private fun bindCamera(context: android.content.Context, view: PreviewView?, lens: Int, onCapture: ((VideoCapture<Recorder>) -> Unit)? = null) {
    if (view == null) return
    val future = ProcessCameraProvider.getInstance(context)
    future.addListener({
        val provider = future.get()
        val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
        val recorder = Recorder.Builder().setQualitySelector(QualitySelector.from(Quality.HD)).build()
        val capture = VideoCapture.withOutput(recorder)
        provider.unbindAll()
        provider.bindToLifecycle(context as ComponentActivity, CameraSelector.Builder().requireLensFacing(lens).build(), preview, capture)
        onCapture?.invoke(capture)
    }, ContextCompat.getMainExecutor(context))
}

private fun shareVideo(context: android.content.Context, file: File) {
    val uri = androidx.core.content.FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply { type = "video/mp4"; putExtra(Intent.EXTRA_STREAM, uri); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }, "Bagikan video"))
}
