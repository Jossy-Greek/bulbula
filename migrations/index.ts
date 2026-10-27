import * as migration_20261026_104751_initial from './20261026_104751_initial';
import * as migration_20261026_140230_category_icons from './20261026_140230_category_icons';
import * as migration_20261026_142534_unconfirmed_flag from './20261026_142534_unconfirmed_flag';
import * as migration_20261027_052148_analytics_events from './20261027_052148_analytics_events';

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
    name: '20261027_052148_analytics_events'
  },
];
