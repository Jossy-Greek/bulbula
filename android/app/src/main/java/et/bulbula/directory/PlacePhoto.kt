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
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
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
    AsyncImage(
        model = photo.src,
        contentDescription = null, // the place's name is right beside it
        contentScale = ContentScale.Crop,
        modifier = Modifier.size(size).clip(RoundedCornerShape(size * 0.28f)).background(MaterialTheme.colorScheme.surfaceVariant),
    )
}
