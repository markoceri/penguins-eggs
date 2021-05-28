/**
 * penguins-eggs: incubator.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
import Utils from '../utils'
import { IRemix, IDistro } from '../../interfaces'

import { Jessie } from './distros/jessie'
import { Buster } from './distros/buster'
import { Bullseye } from './distros/bullseye'
import { Beowulf } from './distros/beowulf'
import { Focal } from './distros/focal'
import { Bionic } from './distros/bionic'
import Pacman from '../pacman'

const exec = require('../../lib/utils').exec



/**
 *
 */
export default class Incubator {
   verbose = false

   installer = {} as IInstaller

   installerConf = '/etc/penguins-eggs.d/eggs/'

   remix: IRemix

   distro: IDistro

   user_opt: string

   /**
    *
    * @param remix
    * @param distro
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, user_opt = 'live', verbose = false) {
      if (Pacman.packageIsInstalled('calamares')) {
         this.installer.name = 'calamares'
         this.installer.rootConfiguration = '/etc/calamares/'
         if (process.arch === 'x32') {
            this.installer.rootMultiarch = '/usr/lib/i386-linux-gnu/calamares/'
         } else if (process.arch === 'x64') {
            this.installer.rootMultiarch = '/usr/lib/x86_64-linux-gnu/calamares/'
         } else if (process.arch === 'armel') {
            this.installer.rootMultiarch = '/usr/lib/armel-linux-gnu/calamares/'
         }
      } else {
         this.installer.name = 'krill'
         this.installer.rootConfiguration = '/etc/penguins-eggs.d/krill/'
         if (process.arch === 'x32') {
            this.installer.rootMultiarch = '/usr/lib/i386-linux-gnu/penguins-eggs/krill/'
         } else if (process.arch === 'x64') {
            this.installer.rootMultiarch = '/usr/lib/x86_64-linux-gnu/penguins-eggs/krill/'
         } else if (process.arch === 'armel') {
            this.installer.rootMultiarch = '/usr/lib/armel-linux-gnu/penguins-eggs/krill/'
         }
      }

      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      if (remix.branding === undefined) {
         remix.branding = 'eggs'
      }
   }

   /**
    * config
    */
   async config(release = false) {
      const verbose = true
      const echo = Utils.setEcho(verbose)

      this.createInstallerDirs()
      if (this.distro.versionLike === 'jessie') {
         const jessie = new Jessie(this.remix, this.distro, release, this.user_opt, this.verbose)
         await jessie.create()
      } else if (this.distro.versionLike === 'stretch') {
         const stretch = new Jessie(this.remix, this.distro, release, this.user_opt, this.verbose)
         await stretch.create()
      } else if (this.distro.versionLike === 'buster') {
         const buster = new Buster(this.remix, this.distro, release, this.user_opt, this.verbose)
         await buster.create()
      } else if (this.distro.versionLike === 'bullseye') {
         const bullseye = new Bullseye(this.remix, this.distro, release, this.user_opt, this.verbose)
         await bullseye.create()
      } else if (this.distro.versionLike === 'beowulf') {
         const beowulf = new Beowulf(this.remix, this.distro, release, this.user_opt, this.verbose)
         await beowulf.create()
      } else if (this.distro.versionLike === 'focal') {
         const focal = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await focal.create()
      } else if (this.distro.versionLike === 'groovy') {
         const groovy = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await groovy.create()
      } else if (this.distro.versionLike === 'hirsute') {
         const hirsute = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await hirsute.create()
      } else if (this.distro.versionLike === 'bionic') {
         const bionic = new Bionic(this.remix, this.distro, release, this.user_opt, this.verbose)
         await bionic.create()
      }
      this.createBranding()

   }

   /**
    *
    */
   private createInstallerDirs() {
      if (this.installer.name === 'calamares') {
         // Remove krill configuration if present
         shx.exec('rm /etc/penguins-eggs.d/krill -rf')
         if (process.arch === 'x32') {
            shx.exec('rm /usr/lib/i386-linux-gnu/krill -rf')
         } else if (process.arch === 'x64') {
            shx.exec('rm /usr/lib/x86_64-linux-gnu/krill -rf')
         } else if (process.arch === 'x64') {
            shx.exec('rm /usr/lib/armel-linux-gnu/krill -rf')
         }
      }

      // rootConfiguration krill calamares
      if (!fs.existsSync(this.installer.rootConfiguration)) {
         fs.mkdirSync(this.installer.rootConfiguration)
      }
      if (!fs.existsSync(this.installer.rootConfiguration + 'branding')) {
         fs.mkdirSync(this.installer.rootConfiguration + 'branding')
      }
      if (!fs.existsSync(this.installer.rootConfiguration + 'branding/eggs')) {
         fs.mkdirSync(this.installer.rootConfiguration + 'branding/eggs')
      }
      if (!fs.existsSync(this.installer.rootConfiguration + 'modules')) {
         fs.mkdirSync(this.installer.rootConfiguration + 'modules')
      }
      // multiarch e modules
      if (!fs.existsSync(this.installer.rootMultiarch)) {
         fs.mkdirSync(this.installer.rootMultiarch)
      }
      if (!fs.existsSync(this.installer.rootMultiarch + 'modules')) {
         fs.mkdirSync(this.installer.rootMultiarch + 'modules')
      }


      /**
       * ADDONS (only for calamares)
       */
      if (this.installer.name === 'calamares') {
         const calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/calamares/branding`)
         if (fs.existsSync(calamaresBranding)) {
            if (!fs.existsSync(this.installer.rootConfiguration + `branding/${this.remix.branding}`)) {
               fs.mkdirSync(this.installer.rootConfiguration + `branding/${this.remix.branding}`)
            }
            shx.cp(calamaresBranding + '/*', this.installer.rootConfiguration + `branding/${this.remix.branding}/`)
         } else {
            console.log(`${calamaresBranding} not found!`)
            process.exit()
         }

         const calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-debian.png`)
         if (fs.existsSync(calamaresIcon)) {
            shx.cp(calamaresIcon, '/usr/share/icons/')
         } else {
            console.log(`${calamaresIcon} not found!`)
            process.exit()
         }

         const calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-debian.desktop`)
         if (fs.existsSync(calamaresLauncher)) {
            shx.cp(calamaresLauncher, '/usr/share/applications/')
         } else {
            console.log(`${calamaresLauncher} not found!`)
            process.exit()
         }
         // script di avvio
         shx.cp(path.resolve(__dirname, '../../../assets/calamares/install-debian'), '/sbin/install-debian')
      }
   }

   /**
    *
    */
   private createBranding() {

      const branding = require('./branding').branding
      const dir = this.installer.rootConfiguration + '/branding/' + this.remix.branding + '/'
      if (!fs.existsSync(dir)) {
         shx.exec(dir + ' -p')
      }
      const file = dir + 'branding.desc'
      const content = branding(this.remix, this.distro, this.verbose)
      write(file, content, this.verbose)
   }

   /**
    * non dovrebbe servire
    */
   private async createInstallDebian() {
      const scriptInstallDebian = require('./calamares-modules/scripts/install-debian').installDebian
      const scriptDir = `/usr/bin/`
      const scriptFile = scriptDir + 'install-debian'
      const scriptContent = scriptInstallDebian()
      write(scriptFile, scriptContent, this.verbose)
      await exec(`chmod +x ${scriptFile}`)
   }
}

/**
 *
 * @param file
 * @param content
 * @param verbose
 */
function write(file: string, content: string, verbose = false) {
   if (verbose) {
      console.log(`calamares: create ${file}`)
   }
   fs.writeFileSync(file, content, 'utf8')
}
