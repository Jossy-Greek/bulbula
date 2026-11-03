package et.bulbula.directory

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** The title, then search and categories (pinned while the places scroll under them). */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun DirectoryScreen(
    state: DirectoryState,
    now: Pair<Int, Int>,
    query: String,
    onQuery: (String) -> Unit,
    category: String?,
    onCategory: (String?) -> Unit,
    listState: LazyListState,
    chipState: LazyListState,
    onRefresh: () -> Unit,
    onOpen: (Place) -> Unit,
    onSettings: () -> Unit,
    /** Places waiting for a signed-in admin; null when nobody is signed in. */
    toReview: Int? = null,
    onReview: () -> Unit = {},
) {
    val directory = state.directory
    val places = remember(directory, query, category) { directory?.listings.orEmpty().matching(query, category) }
    val colors = MaterialTheme.colorScheme

    // The status bar area stays the page colour, so the pinned header slides under nothing.
    Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding()) {
        PullToRefreshBox(isRefreshing = state.refreshing && directory != null, onRefresh = onRefresh, modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(bottom = 24.dp + WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()),
                modifier = Modifier.fillMaxSize(),
            ) {
                item {
                    Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.app_name), style = MaterialTheme.typography.headlineLarge, modifier = Modifier.weight(1f))
                        if (toReview != null && toReview > 0) {
                            IconButton(onClick = onReview) {
                                Box {
                                    Icon(painterResource(R.drawable.ic_review), contentDescription = stringResource(R.string.review), tint = colors.primary)
                                    Box(Modifier.align(Alignment.TopEnd).size(8.dp).background(closedColor, CircleShape))
                                }
                            }
                        }
                        IconButton(onClick = onSettings) {
                            Icon(painterResource(R.drawable.ic_settings), contentDescription = stringResource(R.string.settings), tint = colors.onSurfaceVariant)
                        }
                    }
                }
                stickyHeader {
                    Column(Modifier.fillMaxWidth().background(colors.background).padding(top = 8.dp)) {
                        SearchField(query, onQuery)
                        if (directory != null) Categories(directory.categories, category, onCategory, chipState)
                    }
                }
                when {
                    directory == null && state.failed -> item { Offline(onRefresh) }
                    directory == null -> item { Box(Modifier.fillMaxWidth().padding(top = 120.dp), Alignment.Center) { CircularProgressIndicator() } }
                    places.isEmpty() -> item { Muted(stringResource(R.string.none), Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 24.dp)) }
                    else -> itemsIndexed(places, key = { _, p -> p.slug }) { i, place ->
                        PlaceRow(place, showCategory = category == null, now = now, first = i == 0, last = i == places.lastIndex) { onOpen(place) }
                    }
                }
            }
        }
    }
}

/** Name first, then category and landmark; a name that starts with the query ranks first. */
fun List<Place>.matching(query: String, category: String?): List<Place> {
    val q = query.trim().lowercase()
    return filter { p ->
        (category == null || p.category.slug == category) &&
            (q.isEmpty() || listOfNotNull(p.name, p.category.name, p.landmark).any { it.lowercase().contains(q) })
    }.sortedBy { if (q.isNotEmpty() && it.name.lowercase().startsWith(q)) 0 else 1 }
}

@Composable
private fun SearchField(query: String, onQuery: (String) -> Unit) {
    val focus = LocalFocusManager.current
    val colors = MaterialTheme.colorScheme
    Row(
        Modifier
            .padding(horizontal = 16.dp)
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(colors.surface)
            .border(1.dp, colors.outlineVariant, RoundedCornerShape(14.dp))
            .padding(start = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(R.drawable.ic_search), contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(19.dp))
        Box(Modifier.weight(1f).padding(horizontal = 10.dp)) {
            if (query.isEmpty()) Muted(stringResource(R.string.search))
            BasicTextField(
                value = query,
                onValueChange = onQuery,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.onSurface),
                cursorBrush = SolidColor(colors.primary),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { focus.clearFocus() }),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        if (query.isNotEmpty()) {
            IconButton(onClick = { onQuery("") }) {
                Icon(painterResource(R.drawable.ic_close), contentDescription = stringResource(R.string.clear), tint = colors.onSurfaceVariant, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun Categories(categories: List<Category>, selected: String?, onSelect: (String?) -> Unit, state: LazyListState) {
    // Keep the selected chip in view, e.g. after coming back from a place.
    LaunchedEffect(selected, categories) {
        val index = if (selected == null) 0 else categories.indexOfFirst { it.slug == selected } + 1
        val shown = state.layoutInfo.visibleItemsInfo.firstOrNull { it.index == index }
        val fits = shown != null && shown.offset >= 0 && shown.offset + shown.size <= state.layoutInfo.viewportEndOffset
        if (index >= 0 && !fits) state.animateScrollToItem(maxOf(0, index - 1))
    }
    LazyRow(state = state, contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Chip(stringResource(R.string.all), selected == null) { onSelect(null) } }
        items(categories, key = { it.slug }) { c -> Chip(c.name, selected == c.slug) { onSelect(if (selected == c.slug) null else c.slug) } }
    }
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    Text(
        label,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
        color = if (selected) colors.onPrimary else colors.onSurface,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selected) colors.primary else colors.surface)
            .border(1.dp, if (selected) colors.primary else colors.outlineVariant, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 15.dp, vertical = 9.dp),
    )
}

/** One place in the list card; [first] and [last] round the card's corners. */
@Composable
private fun PlaceRow(place: Place, showCategory: Boolean, now: Pair<Int, Int>, first: Boolean, last: Boolean, onClick: () -> Unit) {
    val status = openLine(place.hoursSpec, now, short = true)
    val shape = RoundedCornerShape(topStart = if (first) 18.dp else 0.dp, topEnd = if (first) 18.dp else 0.dp, bottomStart = if (last) 18.dp else 0.dp, bottomEnd = if (last) 18.dp else 0.dp)
    Column(Modifier.padding(horizontal = 16.dp).clip(shape).background(MaterialTheme.colorScheme.surface)) {
        Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            IconTile(place.category)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(place.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                val category = place.category.name.takeIf { showCategory }
                if (category != null || status != null) {
                    Spacer(Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (status != null) {
                            Box(Modifier.size(6.dp).background(status.color, CircleShape))
                            Spacer(Modifier.width(5.dp))
                            Text(status.label, style = MaterialTheme.typography.bodyMedium, color = status.color, fontWeight = FontWeight.Medium, maxLines = 1)
                            if (category != null) Muted(" · ", small = true)
                        }
                        if (category != null) Muted(category, small = true)
                    }
                }
            }
        }
        if (!last) HorizontalDivider(Modifier.padding(start = 68.dp), color = MaterialTheme.colorScheme.outlineVariant)
    }
}

@Composable
private fun Offline(onRetry: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = 120.dp, start = 20.dp, end = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Muted(stringResource(R.string.offline))
        Spacer(Modifier.height(14.dp))
        Button(onClick = onRetry) { Text(stringResource(R.string.retry)) }
    }
}

@Composable
fun Muted(text: String, modifier: Modifier = Modifier, small: Boolean = false) =
    Text(
        text,
        style = if (small) MaterialTheme.typography.bodyMedium else MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        maxLines = if (small) 1 else Int.MAX_VALUE,
        overflow = TextOverflow.Ellipsis,
        modifier = modifier,
    )
