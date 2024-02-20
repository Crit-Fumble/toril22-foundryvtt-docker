import fs from"fs";import lockfile from"proper-lockfile";import path from"path";import*as packages from"./packages/_module.mjs";globalThis.packages=packages;import{createLogger,Logger,LogEntry}from"./logging.mjs";import configurePaths from"./paths.mjs";import ServerConfiguration from"./core/config.mjs";import License from"./core/license.mjs";import Updater from"./core/update.mjs";import*as database from"./database/database.mjs";import Files from"./files/files.mjs";import GameServer from"./core/game.mjs";import{World}from"./packages/_module.mjs";import Express from"./server/express.mjs";import UPnP from"./server/upnp.mjs";import{vtt}from"../common/constants.mjs";import{resetDemo}from"./components/demo.mjs";import{ReleaseData}from"../common/config.mjs";import fetch from"node-fetch";import AbortController from"abort-controller";globalThis.fetch=fetch,globalThis.AbortController=AbortController;export default async function initialize({args:e=[],root:o,messages:r=[],debug:t=!1}={}){global.vtt="FoundryVTT",global.release=new ReleaseData(JSON.parse(fs.readFileSync(`${o}/package.json`,"utf8")).release),global.config={},global.startupMessages=r,global.fatalError=null;try{global.paths=configurePaths({root:o,messages:r,debug:t})}catch(e){process.stdout.write(e.stack),process.exit(1)}const s=global.paths,a=global.logger=createLogger(s,r);a.info(`Foundry Virtual Tabletop - Version ${global.release.generation} Build ${global.release.build}`),a.info(`User Data Directory - "${global.paths.user}"`),global.game=new GameServer;let n={};try{n=global.config=await _initializeCriticalFunctions(e,s,a)}catch(e){e.message=`A fatal error occurred while trying to start the Foundry Virtual Tabletop server: ${e.message}`,(a||console).error(e),await new Promise((()=>setTimeout((()=>process.exit(1)),100)))}n.updater=new Updater(s);const{app:i,express:l,license:c,options:p,upnp:u}=n;global.db=n.db,global.express=n.express,global.options=n.options,c.needsSignature||await _launchDefaultWorld(p);try{await l.listen()}catch(e){e.message=`Unable to start Express server: ${e.message}`,(a||console).error(e),await new Promise((()=>setTimeout((()=>process.exit(1)),100)))}return process.on("uncaughtException",(e=>a.error(e))),handleRestart(a),process.once("exit",(()=>handleShutdown({exit:!1,logger:a,express:l,upnp:u}))),process.once("SIGINT",process.exit.bind(null,0)),process.once("SIGTERM",process.exit.bind(null,0)),process.once("SIGHUP",process.exit.bind(null,0)),i&&i.initialize(l.address),n}async function _initializeCriticalFunctions(e,o,r){_testPermissions(),_createUserDataStructure(),await _acquireLockFile(),await _clearUnnecessaryFiles();const t=ServerConfiguration.load();t.initialize(_parseArgs(e));const s=new License(t.service);s.verify();const a=new Files(t);if(a.availableStorageNames.includes("s3"))try{await a.storages.s3.identifyEndpoint()}catch(e){r.error(`Failed to determine S3 endpoint: ${e.message}`),delete a.storages.s3}const n=t.upnp?new UPnP({port:t.port,ttl:t.upnpLeaseDuration}).createMapping():null;let i=null;if(t.isElectron){i=new((await import("./interface/electron.js")).default)(t,r)}const l=new Express(t,o,r);return await Promise.all([]),{adminPassword:t.adminPassword,app:i,db:database,express:l,files:a,license:s,logger:r,options:t,service:t.service,sockets:l.io.sockets.sockets,upnp:n,release:release,vtt:vtt}}function _testPermissions(){const e=global.paths;try{const o=fs.existsSync(e.user)?e.user:path.dirname(e.user);let r=path.join(o,".permission-test.txt");fs.writeFileSync(r,"test"),fs.unlinkSync(r)}catch(o){throw o.message=`You do not have permission to create content in ${e.user}: ${o.message}`,o}}function _createUserDataStructure(){const e=global.paths,o=["user","data","config","logs"];for(let r of o)fs.mkdirSync(e[r],{recursive:!0});if(!fs.existsSync(e.options)){const o={dataPath:e.user},r=fs.existsSync(e.envOptions)?JSON.parse(fs.readFileSync(e.envOptions)):{},t=["compressStatic","fullscreen","hostname","language","localHostname","port","protocol","proxyPort","proxySSL","routePrefix","updateChannel","upnp","upnpLeaseDuration"];for(const e of t)o[e]=r[e];new ServerConfiguration(o).save()}const r=["systems","modules","worlds"],t={systems:"This directory contains systems which define game frameworks for use in Foundry VTT. Each system has its own uniquely named subdirectory containing a system.json manifest file.",modules:"This directory contains add-on modules which add or extend core VTT functionality. Each module has its own uniquely named subdirectory containing a module.json manifest file.",worlds:"This directory contains worlds which define the game and campaign settings in Foundry VTT. Each world has its own uniquely named subdirectory containing a world.json manifest file."};for(let o of r){let r=path.join(e.data,o);fs.mkdirSync(r,{recursive:!0}),fs.writeFileSync(path.join(r,"README.txt"),t[o])}}async function _acquireLockFile(){const e=global.paths;if(await lockfile.check(e.options))throw new Error(`${vtt} cannot start in this directory which is already locked by another process.`);return lockfile.lock(e.options,{stale:1e4})}async function _clearUnnecessaryFiles(){const e=global.paths,o=path.join(e.root,"certs");try{await fs.promises.rm(o,{force:!0,recursive:!0})}catch(e){}}function _parseArgs(e){const o={},r=/^--/;for(let t of e){if(!r.test(t))continue;t=t.replace(r,"");const e=t.split("=");o[e[0]]=!(e.length>1)||e[1]}return"adminKey"in o&&(global.logger.warn("You are using the old --adminKey parameter which has been renamed to --adminPassword"),o.adminPassword=o.adminKey),o}async function _launchDefaultWorld(e){if(e.demoMode)try{return resetDemo()}catch(o){logger.warn(o),e.demo=null}if(e.world){const o=World.get(e.world,{strict:!1});if(!o?.canAutoLaunch)return logger.warn(`The requested World "${e.world}" is not available to auto-launch.`),void(e.world=null);try{await o.setup()}catch(r){logger.error(`The requested World "${e.world}" could not be auto-launched as it encountered an error.`),logger.error(r),e.world=null,await o.deactivate(null,{asAdmin:!0})}}}function handleRestart(e){process.env.restart&&(e.info("Server restarted after update"),delete process.env.restart)}function handleShutdown({exit:e=!0,logger:o,upnp:r,express:t}={}){o.info("Shutting down Foundry Virtual Tabletop server"),r&&r.removeMapping(),t&&t.server.close(),o.info("Shut-down success. Goodbye!"),e&&process.exit()}