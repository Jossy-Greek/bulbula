package et.bulbula.directory

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** The website's category icon (a Lucide name) as a drawable. */
@DrawableRes
fun categoryIcon(name: String): Int = when (name) {
    "coffee" -> R.drawable.ic_coffee
    "croissant" -> R.drawable.ic_croissant
    "shopping-cart" -> R.drawable.ic_shopping_cart
    "pill" -> R.drawable.ic_pill
    "stethoscope" -> R.drawable.ic_stethoscope
    "landmark" -> R.drawable.ic_landmark
    "bed" -> R.drawable.ic_bed
    "home", "house" -> R.drawable.ic_home
    "scissors" -> R.drawable.ic_scissors
    "dumbbell" -> R.drawable.ic_dumbbell
    "wrench" -> R.drawable.ic_wrench
    "graduation-cap" -> R.drawable.ic_graduation_cap
    "heart-pulse" -> R.drawable.ic_heart_pulse
    "church" -> R.drawable.ic_church
    "shield" -> R.drawable.ic_shield
    "hand-heart" -> R.drawable.ic_hand_heart
    else -> R.drawable.ic_store
}

/** A category's icon on a soft tile; community places (worship, public) in amber, businesses in teal. */
@Composable
fun IconTile(category: Category, size: Dp = 40.dp) {
    val colors = MaterialTheme.colorScheme
    val tint = if (category.group == "community") colors.secondary else colors.primary
    Box(Modifier.size(size).background(tint.copy(alpha = 0.12f), RoundedCornerShape(size * 0.28f)), contentAlignment = Alignment.Center) {
        Icon(painterResource(categoryIcon(category.icon)), contentDescription = null, tint = tint, modifier = Modifier.size(size * 0.5f))
    }
}

/** A raised, rounded group of rows. */
@Composable
fun Card(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(MaterialTheme.colorScheme.surface), content = content)
}

/** A row in a [Card]: optional leading icon, content, optional trailing; divider below unless [last]. */
@Composable
fun CardRow(
    @DrawableRes icon: Int? = null,
    iconTint: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    last: Boolean = false,
    onClick: (() -> Unit)? = null,
    trailing: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = 52.dp).then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(painterResource(icon), contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(14.dp))
        }
        Column(Modifier.weight(1f), content = content)
        trailing?.invoke(this)
    }
    if (!last) HorizontalDivider(Modifier.padding(start = if (icon != null) 50.dp else 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
}

/** "● Open now" / "● Closed" in the status colour, optionally followed by muted detail. */
@Composable
fun StatusPill(line: OpenLine, showDetail: Boolean = true) {
    Row(
        Modifier.background(line.color.copy(alpha = 0.12f), CircleShape).padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(Modifier.size(7.dp).background(line.color, CircleShape))
        Text(line.label, style = MaterialTheme.typography.labelLarge, color = line.color, fontWeight = FontWeight.SemiBold)
        if (showDetail && line.detail != null) Text(line.detail, style = MaterialTheme.typography.labelLarge, color = line.color.copy(alpha = 0.8f))
    }
}

/** A row of choices, one selected (appearance, language). */
@Composable
fun <T> PillSwitch(options: List<Pair<T, String>>, selected: T, onSelect: (T) -> Unit) {
    val colors = MaterialTheme.colorScheme
    Row(Modifier.fillMaxWidth().background(colors.surfaceVariant, CircleShape).padding(3.dp)) {
        options.forEach { (value, label) ->
            val on = value == selected
            Text(
                label,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium,
                color = if (on) colors.onSurface else colors.onSurfaceVariant,
                maxLines = 1,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier
                    .weight(1f)
                    .clip(CircleShape)
                    .background(if (on) colors.surface else Color.Transparent)
                    .clickable { onSelect(value) }
                    .padding(vertical = 8.dp),
            )
        }
    }
}
