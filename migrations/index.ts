import * as migration_20261026_104751_initial from './20261026_104751_initial';
import * as migration_20261026_140230_category_icons from './20261026_140230_category_icons';

export const migrations = [
  {
    up: migration_20261026_104751_initial.up,
    down: migration_20261026_104751_initial.down,
    name: '20261026_104751_initial',
  },
  {
    up: migration_20261026_140230_category_icons.up,
    down: migration_20261026_140230_category_icons.down,
    name: '20261026_140230_category_icons'
  },
];
