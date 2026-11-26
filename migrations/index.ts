import * as migration_20261026_104751_initial from './20261026_104751_initial';
import * as migration_20261026_140230_category_icons from './20261026_140230_category_icons';
import * as migration_20261026_142534_unconfirmed_flag from './20261026_142534_unconfirmed_flag';
import * as migration_20261027_052148_analytics_events from './20261027_052148_analytics_events';
import * as migration_20261027_191339_visitor_reviews from './20261027_191339_visitor_reviews';
import * as migration_20261029_084742_google_details from './20261029_084742_google_details';
import * as migration_20261029_095452_google_menus_reviews from './20261029_095452_google_menus_reviews';
import * as migration_20261029_110236_menu_visibility from './20261029_110236_menu_visibility';
import * as migration_20261029_111213_site_settings from './20261029_111213_site_settings';
import * as migration_20261104_120000_analytics_platform from './20261104_120000_analytics_platform';
import * as migration_20261104_130000_android_update from './20261104_130000_android_update';
import * as migration_20261105_095205_cloud_progress from './20261105_095205_cloud_progress';
import * as migration_20261124_042710_business_gallery from './20261124_042710_business_gallery';
import * as migration_20261124_051134_media_storage_prefix from './20261124_051134_media_storage_prefix';
import * as migration_20261124_083649_corrections_and_submission_limits from './20261124_083649_corrections_and_submission_limits';
import * as migration_20261124_112823_users_reviewer_role from './20261124_112823_users_reviewer_role';
import * as migration_20261126_111306_owner_stats_key from './20261126_111306_owner_stats_key';
import * as migration_20261126_114241_featured_tools from './20261126_114241_featured_tools';

export const migrations = [
  {
    up: migration_20261026_104751_initial.up,
    down: migration_20261026_104751_initial.down,
    name: '20261026_104751_initial',
  },
  {
    up: migration_20261026_140230_category_icons.up,
    down: migration_20261026_140230_category_icons.down,
    name: '20261026_140230_category_icons',
  },
  {
    up: migration_20261026_142534_unconfirmed_flag.up,
    down: migration_20261026_142534_unconfirmed_flag.down,
    name: '20261026_142534_unconfirmed_flag',
  },
  {
    up: migration_20261027_052148_analytics_events.up,
    down: migration_20261027_052148_analytics_events.down,
    name: '20261027_052148_analytics_events',
  },
  {
    up: migration_20261027_191339_visitor_reviews.up,
    down: migration_20261027_191339_visitor_reviews.down,
    name: '20261027_191339_visitor_reviews',
  },
  {
    up: migration_20261029_084742_google_details.up,
    down: migration_20261029_084742_google_details.down,
    name: '20261029_084742_google_details',
  },
  {
    up: migration_20261029_095452_google_menus_reviews.up,
    down: migration_20261029_095452_google_menus_reviews.down,
    name: '20261029_095452_google_menus_reviews',
  },
  {
    up: migration_20261029_110236_menu_visibility.up,
    down: migration_20261029_110236_menu_visibility.down,
    name: '20261029_110236_menu_visibility',
  },
  {
    up: migration_20261029_111213_site_settings.up,
    down: migration_20261029_111213_site_settings.down,
    name: '20261029_111213_site_settings',
  },
  {
    up: migration_20261104_120000_analytics_platform.up,
    down: migration_20261104_120000_analytics_platform.down,
    name: '20261104_120000_analytics_platform',
  },
  {
    up: migration_20261104_130000_android_update.up,
    down: migration_20261104_130000_android_update.down,
    name: '20261104_130000_android_update',
  },
  {
    up: migration_20261105_095205_cloud_progress.up,
    down: migration_20261105_095205_cloud_progress.down,
    name: '20261105_095205_cloud_progress',
  },
  {
    up: migration_20261124_042710_business_gallery.up,
    down: migration_20261124_042710_business_gallery.down,
    name: '20261124_042710_business_gallery',
  },
  {
    up: migration_20261124_051134_media_storage_prefix.up,
    down: migration_20261124_051134_media_storage_prefix.down,
    name: '20261124_051134_media_storage_prefix',
  },
  {
    up: migration_20261124_083649_corrections_and_submission_limits.up,
    down: migration_20261124_083649_corrections_and_submission_limits.down,
    name: '20261124_083649_corrections_and_submission_limits',
  },
  {
    up: migration_20261124_112823_users_reviewer_role.up,
    down: migration_20261124_112823_users_reviewer_role.down,
    name: '20261124_112823_users_reviewer_role',
  },
  {
    up: migration_20261126_111306_owner_stats_key.up,
    down: migration_20261126_111306_owner_stats_key.down,
    name: '20261126_111306_owner_stats_key',
  },
  {
    up: migration_20261126_114241_featured_tools.up,
    down: migration_20261126_114241_featured_tools.down,
    name: '20261126_114241_featured_tools'
  },
];
