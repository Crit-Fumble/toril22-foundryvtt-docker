import { Stairway } from './Stairway.js'
import { StairwayDocument } from './StairwayDocument.js'

// Between WallsLayer (40) and TemplateLayer (50)
const STAIRWAY_LAYER_ZINDEX = 45

/**
 * The Stairway Layer which displays stairway icons within the rendered Scene.
 * @extends {PlaceablesLayer}
 */
export class StairwayLayer extends PlaceablesLayer {
  /** @inheritdoc */
  // TODO: wait for https://github.com/tc39/proposal-static-class-features
  // static documentName = 'Stairway'

  /** @override */
  static get layerOptions () {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: 'stairways',
      canDragCreate: false,
      canDelete: game.user.isGM,
      controllableObjects: false,
      rotatableObjects: false,
      snapToGrid: true,
      gridPrecision: 2,
      zIndex: STAIRWAY_LAYER_ZINDEX
    })
  }

  /* -------------------------------------------- */

  static getConnectionTarget () {
    // name of stairway (used for connection)
    let connectionTarget

    if (Stairway.connectionTarget) {
      // use name and scene of connection target
      connectionTarget = Stairway.connectionTarget
      Stairway.resetConnectionTarget()
    } else {
      // auto generate new name, set current scene
      connectionTarget = foundry.utils.duplicate(Stairway.setConnectionTarget())
    }

    // don't use a specific scene if both stairways are on the same scene
    if (connectionTarget.scene === canvas.scene.id) {
      connectionTarget.scene = null
    }

    return connectionTarget
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  _onClickLeft (event) {
    super._onClickLeft(event)

    // snap the origin to grid when shift isn't pressed
    const { originalEvent } = event.data
    if (this.options.snapToGrid && !originalEvent.isShift) {
      const { origin } = event.interactionData
      event.interactionData.origin = canvas.grid.getSnappedPosition(origin.x, origin.y, this.gridPrecision)
    }

    // position
    const { origin } = event.interactionData

    // get options from layer control
    // TODO: `animate` should be synced with partner
    const animate = this._animate === true
    const disabled = this._disabled === true
    const hidden = this._hidden === true

    // create new stairway
    const doc = new StairwayDocument({ ...StairwayLayer.getConnectionTarget(), disabled, hidden, animate, x: origin.x, y: origin.y }, { parent: canvas.scene })
    const stairway = new Stairway(doc)
    return StairwayDocument.create(stairway.document.toObject(false), { parent: canvas.scene })
  }

  /* -------------------------------------------- */

  static onPasteStairway (_copy, toCreate) {
    // only one stairway should be pasteable at once, warn if we got more
    if (toCreate.length > 1) {
      console.error('more then one stairway was pasted', _copy, toCreate)
      ui.notifications.error(game.i18n.localize('stairways.ui.messages.internal-error'))
    }

    // set correct connection target on paste
    for (const stairway of toCreate) {
      const connectionTarget = StairwayLayer.getConnectionTarget()
      for (const key in connectionTarget) {
        stairway[key] = connectionTarget[key]
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftStart (...args) { }

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftDrop (...args) { }

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftMove (...args) { }

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftCancel (...args) { }
}

// TODO: wait for https://github.com/tc39/proposal-static-class-features
StairwayLayer.documentName = 'Stairway'
