package et.bulbula.directory

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.util.Base64
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalContext
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

/**
 * A photo picked for "Add a place", shrunk before sending: the longest side at most [MAX_SIDE]
 * and saved as JPEG, so a 4 MB camera photo goes up as a few hundred KB.
 */
object PlacePhoto {
    const val MAX_SIDE = 1600

    /** The picked image, upright and shrunk; null if it can't be read (or access to it has gone). */
    suspend fun load(context: Context, uri: Uri): Bitmap? = withContext(Dispatchers.IO) {
        runCatching {
            if (Build.VERSION.SDK_INT >= 28) {
                // ImageDecoder applies the camera's rotation itself.
                ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, uri)) { decoder, info, _ ->
                    val scale = MAX_SIDE.toFloat() / maxOf(info.size.width, info.size.height)
                    if (scale < 1f) decoder.setTargetSize((info.size.width * scale).toInt().coerceAtLeast(1), (info.size.height * scale).toInt().coerceAtLeast(1))
                    decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                }
            } else {
                legacy(context, uri)
            }
        }.getOrNull()
    }

    /** Android 8–8.1: decode at a smaller sample size, then scale and turn it by the EXIF orientation. */
    private fun legacy(context: Context, uri: Uri): Bitmap? {
        val resolver = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2
        val bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) } ?: return null
        val rotation = resolver.openInputStream(uri)?.use {
            when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                else -> 0f
            }
        } ?: 0f
        val scale = minOf(1f, MAX_SIDE.toFloat() / maxOf(bitmap.width, bitmap.height))
        if (rotation == 0f && scale == 1f) return bitmap
        val matrix = Matrix().apply { postScale(scale, scale); postRotate(rotation) }
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    /** JPEG as base64, the way app/m/place takes it. */
    suspend fun base64(bitmap: Bitmap): String = withContext(Dispatchers.Default) {
        ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 82, out)
            Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        }
    }
}

/** The place's photo when it has one, otherwise its category icon: the same size either way. */
@Composable
fun PlaceThumb(place: Place, size: Dp = 40.dp) {
    val photo = place.photo
    if (photo == null) {
        IconTile(place.category, size)
        return
    }
    PlaceImage(
        photo.src,
        contentDescription = null, // the place's name is right beside it
        modifier = Modifier.size(size).clip(RoundedCornerShape(size * 0.28f)),
    )
}

/**
 * A photo from the site. It shimmers while it loads, and keeps shimmering while it can't be
 * fetched (no internet); when the connection comes back it tries again by itself. A photo
 * seen before shows offline straight away: Coil keeps a copy on the phone.
 */
@Composable
fun PlaceImage(url: String, contentDescription: String?, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Crop) {
    val online = Connectivity.online(LocalContext.current)
    var shown by remember(url) { mutableStateOf(false) }
    key(url, online) {
        AsyncImage(
            model = url,
            contentDescription = contentDescription,
            contentScale = contentScale,
            onState = { shown = it is AsyncImagePainter.State.Success },
            modifier = modifier.then(if (shown) Modifier else Modifier.shimmer()),
        )
    }
}

/** A soft light band sweeping across, in the theme's colours: "a photo goes here". */
fun Modifier.shimmer(): Modifier = composed {
    val colors = MaterialTheme.colorScheme
    val base = colors.surfaceVariant
    val shine = lerp(base, Color.White, if (colors.background.luminance() < 0.5f) 0.12f else 0.55f)
    val sweep by rememberInfiniteTransition(label = "shimmer")
        .animateFloat(-1f, 2f, infiniteRepeatable(tween(1300, easing = LinearEasing)), label = "sweep")
    drawBehind {
        val w = size.width
        drawRect(base)
        drawRect(Brush.linearGradient(listOf(base, shine, base), start = Offset(w * sweep - w * 0.5f, 0f), end = Offset(w * sweep + w * 0.5f, size.height)))
    }
}

/** Whether the phone is online, as Compose state. One listener for the whole app. */
object Connectivity {
    private var state: androidx.compose.runtime.MutableState<Boolean>? = null

    fun online(context: Context): Boolean {
        val s = state ?: synchronized(this) {
            state ?: mutableStateOf(true).also { created ->
                val cm = context.applicationContext.getSystemService(ConnectivityManager::class.java)
                fun now() = cm.getNetworkCapabilities(cm.activeNetwork)?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
                created.value = now()
                cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) { created.value = true }
                    override fun onLost(network: Network) { created.value = now() }
                })
                state = created
            }
        }
        return s.value
    }
}
