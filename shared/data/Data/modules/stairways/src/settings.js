export const SETTINGS_KEY = 'stairways'

export function registerSettings () {
  game.settings.register(SETTINGS_KEY, 'dataVersion', {
    scope: 'world',
    config: false,
    type: String,
    default: 'fresh install'
  })
}
