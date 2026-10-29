import * as migration_20261026_104751_initial from './20261026_104751_initial';
import * as migration_20261026_140230_category_icons from './20261026_140230_category_icons';
import * as migration_20261026_142534_unconfirmed_flag from './20261026_142534_unconfirmed_flag';
import * as migration_20261027_052148_analytics_events from './20261027_052148_analytics_events';
import * as migration_20261027_191339_visitor_reviews from './20261027_191339_visitor_reviews';
import * as migration_20261029_084742_google_details from './20261029_084742_google_details';
import * as migration_20261029_095452_google_menus_reviews from './20261029_095452_google_menus_reviews';

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
    name: '20261029_095452_google_menus_reviews'
  },
];
