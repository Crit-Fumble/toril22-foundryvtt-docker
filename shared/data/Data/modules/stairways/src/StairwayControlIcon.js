import { STAIRWAY_DEFAULTS } from './StairwayConfig.js'

const ICON_SIZE = 100
const SCALE_BORDER = false

/**
 * A helper for drawing a stairway Control Icon
 * @type {PIXI.Container}
 */
export class StairwayControlIcon extends PIXI.Container {
  /* -------------------------------------------- */

  constructor ({ label, textStyle, typeColor = 0x000000, statusColor = 0x000000, texture, width = 1, height = 1, borderColor = 0xFF5500, tint = null } = {}, ...args) {
    super(...args)

    // options
    this.labelText = label
    this.labelTextStyle = textStyle
    this.typeColor = typeColor
    this.statusColor = statusColor
    this.borderColor = borderColor
    this.iconSrc = texture
    this.tintColor = tint
    this.iconWidth = width
    this.iconHeight = height
    this.rect = this.borderSize

    // add offset
    this.x -= this.width * 0.5
    this.y -= this.height * 0.5

    // interactive hit area
    this.interactive = true
    this.interactiveChildren = false
    this.hitArea = new PIXI.Rectangle(...this.borderSize)

    // create Background, Icon, Border
    this.bg = this.addChild(new PIXI.Graphics())
    this.icon = this.addChild(new PIXI.Sprite())
    this.border = this.addChild(new PIXI.Graphics())

    // draw asynchronously
    this.draw()
  }

  /* -------------------------------------------- */

  /** @override */
  async draw () {
    // load icon texture
    this.texture = this.texture ?? await loadTexture(this.iconSrc)

    // don't draw when destroyed
    if (this.destroyed) return this

    const scale = this.scale

    // Draw background
    this.bg.clear().beginFill(this.typeColor || 0, 0.4).lineStyle(2 * scale, this.statusColor || 0, 1.0).drawRoundedRect(...this.rect, 5).endFill()

    // Draw border
    this.border.clear().lineStyle(2 * scale, this.borderColor, 1.0).drawRoundedRect(...this.rect, 5).endFill()
    this.border.visible = false

    // Draw icon
    this.icon.texture = this.texture
    this.icon.width = this.width
    this.icon.height = this.height
    this.icon.tint = Number.isNumeric(this.tintColor) ? this.tintColor : 0xFFFFFF

    // Draw label
    this.label = this.label || this.addChild(new PreciseText(this.labelText, this.labelTextStyle))
    this.label.anchor.set(0.5, 0)
    this.label.position.set(...this.labelPosition)

    return this
  }

  /* -------------------------------------------- */

  static get canvasScale () {
    return (canvas.dimensions.size || 100) / 100
  }

  /* -------------------------------------------- */

  get scale () {
    if (SCALE_BORDER) {
      return (this.iconWidth + this.iconHeight) / (STAIRWAY_DEFAULTS.width + STAIRWAY_DEFAULTS.height) * StairwayControlIcon.canvasScale
    } else {
      return StairwayControlIcon.canvasScale
    }
  }

  /* -------------------------------------------- */

  get width () {
    return this.iconWidth * ICON_SIZE * StairwayControlIcon.canvasScale
  }

  /* -------------------------------------------- */

  get height () {
    return this.iconHeight * ICON_SIZE * StairwayControlIcon.canvasScale
  }

  /* -------------------------------------------- */

  get borderSize () {
    const scale = this.scale
    return [-2 * scale, -2 * scale, this.width + 4 * scale, this.height + 4 * scale]
  }

  /* -------------------------------------------- */

  get labelPosition () {
    const borderSize = this.borderSize
    return [borderSize[2] * 0.5, borderSize[3]]
  }

  /* -------------------------------------------- */

  _onHoverIn (event) {
    this.border.visible = true
  }

  _onHoverOut (event) {
    this.border.visible = false
  }
}
