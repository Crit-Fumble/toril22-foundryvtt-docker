import fs from"fs";import ServerCompendiumFolderMixin from"./compendium-folder.mjs";import{tagModelStats}from"../../core/utils.mjs";import*as CONST from"../../../common/constants.mjs";import{PACKAGE_TYPE_MAPPING}from"../../packages/_module.mjs";export default function ServerCompendiumMixin(e,t){return class extends e{static _db=void 0;static packData=t;static folderClass=ServerCompendiumFolderMixin(this);static get package(){return packages[this.packData.packageType.titleCase()].get(this.packData.packageName)}static metadata=(()=>foundry.utils.mergeObject(super.metadata,{permissions:{create:this.#e.bind(this),update:this.#e.bind(this),delete:this.#e.bind(this)}},{inplace:!1}))();static get collectionName(){return this.packData.id}static get implementation(){return db.packs.get(this.collectionName)}static get filename(){return this.packData.absPath}static _getSublevelNames(){const e=super._getSublevelNames();return e.push("folders"),e}static async disconnect(){await super.disconnect(),db.packs.delete(this.collectionName)}static fromSource(e,t={}){return t.pack=this.collectionName,super.fromSource(e,t)}static isOwner(e){const t=CONST.DOCUMENT_OWNERSHIP_LEVELS;return(e.isGM?t.OWNER:this.getUserLevel(e))>=t.OWNER}static getUserLevel(e){const t=CONST.DOCUMENT_OWNERSHIP_LEVELS;let i=t.NONE;const a=(game.compendiumConfiguration||{})[this.collectionName]||{},s=a?.ownership??this.packData?.ownership??{...PACKAGE_TYPE_MAPPING.module.schema.getField("packs.ownership").initial};for(const[a,o]of Object.entries(s))e.hasRole(a)&&(i=Math.max(i,t[o]));return i}static#e(e,t,i){if(((game.compendiumConfiguration||{})[t.collectionName]||{}).locked??"world"!==t.constructor.package.type)throw new Error(`You may not modify the ${t.collectionName} Compendium which is currently locked.`);return db.packs.get(t.collectionName).isOwner(e)}static async deleteCompendium(){await this.disconnect(),await fs.promises.rm(this.filename,{force:!0,recursive:!0}),await fs.promises.rm(`${this.filename}.db`,{force:!0}),logger.info(`Deleted Compendium Pack ${this.collectionName}`)}static async getIndex(e){if(!e)throw new Error("You must provide an array of index fields to retrieve");return this.connected||await this.connect(),this.database._getDocuments(this,{query:{},options:{index:!0,indexFields:e}})}static async getFolders(){return this._db.sublevels.folders.find()}static async getFolder(e,t={}){const i=await this._db.sublevels.folders.get(e);if(void 0!==i)return this.folderClass.fromSource(i,t);if(!0===t.strict)throw new Error(`The Folder [${e}] does not exist in ${this.collectionName}.`)}static async migrate({user:e,...t}={}){logger.info(`Migrating ${this.collectionName} Compendium to updated system template version.`),this.connected||await this.connect();const i=await this.find(),a=this.db.batch();for(let t of i)this.hasTypeData&&t.updateSource({system:t.migrateSystemData()}),tagModelStats(t,{user:e}),t.batchWrite(a),logger.info(`Migrated ${this.documentName} ${t.name} in Compendium pack ${this.collectionName}`);await a.write(),logger.info(`Migrated all ${i.length} ${this.documentName} Documents in Compendium pack ${this.collectionName}`)}}}