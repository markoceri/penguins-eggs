/**
 * ./src/classes/tailor.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import yaml from 'js-yaml'
import fs from 'node:fs'
// pjson
import { createRequire } from 'node:module'
import path from 'node:path'

import { IEggsConfig, IMateria } from '../interfaces/index.js'
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Pacman from './pacman.js'
import SourcesList from './sources_list.js'
import Utils from './utils.js'
const require = createRequire(import.meta.url)
const pjson = require('../../package.json')

/**
 *
 */
export default class Tailor {
  materials = {} as IMateria
  private category = 'costume'
  private costume = ''
  private echo = {}
  private verbose = false

  private wardrobe = ''

  /**
   * @param wardrobe
   * @param costume
   */
  constructor(costume: string, category = 'costume') {
    this.costume = costume
    this.wardrobe = path.dirname(path.dirname(costume))
    this.category = category
  }

  /**
   *
   */
  async prepare(verbose = true, no_accessories = false, no_firmwares = false) {
    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)
    Utils.warning(`preparing ${this.costume}`)

    /**
     * check curl presence
     */
    if (!Pacman.packageIsInstalled('curl')) {
      Utils.pressKeyToExit('In this tailoring shop we use curl. sudo apt update | apt install curl')
      process.exit()
    }

    // Analyze distro
    const distro = new Distro()
    let tailorList = ''
    switch (distro.distroLike) {
      case 'Debian': {
        tailorList = `${this.costume}/debian.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/devuan.yml`
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/ubuntu.yml`
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Debian`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Devuan': {
        tailorList = `${this.costume}/devuan.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/ubuntu.yml`
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Devuan`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Ubuntu': {
        tailorList = `${this.costume}/ubuntu.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          console.log(`trying ` + tailorList)
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/devuan.yml`
            console.log(`trying ` + tailorList)
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Ubuntu`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Arch': {
        tailorList = `${this.costume}/arch.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Arch`)
            process.exit()
          }
        }
        break
      }

      case 'Alpine': {
        tailorList = `${this.costume}/alpine.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Alpine`)
            process.exit()
          }
        }
        break
      }

      case 'Fedora': {
        tailorList = `${this.costume}/fedora.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Fedora`)
            process.exit()
          }
        }
        break
      }
    } // end analyze


    /**
     * find materials
     */
    if (fs.existsSync(tailorList)) {
      this.materials = yaml.load(fs.readFileSync(tailorList, 'utf8')) as IMateria
    } else {
      switch (this.category) {
        case 'costume': {
          this.titles(`${this.category}: ${this.costume}`)
          console.log("Tailor's list " + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
          console.log('Costume will not be installed, operations will abort.\n')
          Utils.pressKeyToExit()
          process.exit()
          break
        }

        case 'try_accessory':
        case 'accessory': {
          this.titles(`${this.category}: ${this.costume}`)
          console.log("Tailor's list " + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
          console.log('Accessory will not be installed, operations will continue.\n')
          sleep(500)
          return
        }
      }
    }


    /**
     * sequence
     */
    const sources_list = new SourcesList()
    let step = ''
    if (this.materials.sequence !== undefined) {
      step = 'analyzing sequence'
      Utils.warning(step)

      /**
       * sequence/repositories
       */
      if (this.materials.sequence.repositories !== undefined) {
        if (distro.familyId === 'debian') {
          /**
           * sequence/repositories/sources_list
           */
          // evito di fallire se sources_list non è presente
          if (this.materials.sequence.repositories.sources_list !== undefined) {
            step = 'analyzing repositories'
            Utils.warning(step)
            if (distro.distroLike === 'Debian') {
              await sources_list.components(this.materials.sequence.repositories.sources_list)
            }
          }

          /**
           * sequence/repositories/sources_list_d
           */
          if (this.materials.sequence.repositories.sources_list_d !== undefined && this.materials.sequence.repositories.sources_list_d[0] !== null) {
            step = 'adding repositories to /etc/apt/sources_list_d'
            Utils.warning(step)

            for (const cmd of this.materials.sequence.repositories.sources_list_d) {
              try {
                // repeat 3 times if fail curl or others commands
                for (let i = 0; i < 2; i++) {
                  const result = await exec(cmd, this.echo)
                  if (result.code === 0) {
                    break
                  }
                }
              } catch (error) {
                await Utils.pressKeyToExit(JSON.stringify(error))
              }
            }
          }
        }

        /**
         * sequence/repositories/update
         */
        if (this.materials.sequence.repositories.update === undefined) {
          console.log('repositiories, and repositories.update MUST be defined on sequence')
          process.exit()
        }

        step = 'repositories update'
        Utils.warning(step)
        if (this.materials.sequence.repositories.update) {
          switch (distro.familyId) {
            case 'debian': {
              await exec('apt-get update', Utils.setEcho(false))
              break
            }

            case 'archlinux': {
              await exec('pacman -Sy', Utils.setEcho(false))
              break
            }

            case 'alpine': {
              await exec('apk update', Utils.setEcho(false))
              break
            }

            case 'fedora': {
              await exec('dnf update', Utils.setEcho(false))
              break
            }
          }
        }

        /**
         * sequence/repositories/upgrade
         */
        if (this.materials.sequence.repositories.upgrade !== undefined) {
          step = 'repositories upgrade'
          Utils.warning(step)
          if (this.materials.sequence.repositories.upgrade) {
            switch (distro.familyId) {
              case 'debian': {
                await exec('apt-get full-upgrade', Utils.setEcho(false))
                break
              }

              case 'archlinux': {
                await exec('pacman -Su', Utils.setEcho(false))
                break
              }

              case 'alpine': {
                await exec('apk upgrade', Utils.setEcho(false))
                break
              }

              case 'fedora': {
                await exec('dnf upgrade', Utils.setEcho(false))
                break
              }
            }
          } //  upgrade true
        } // undefined upgrade
      } // end sequence/repositories

      /**
       * sequence/cmds
       */
      if (this.materials.sequence.cmds !== undefined && Array.isArray(this.materials.sequence.cmds)) {
        step = 'sequence commands'
        Utils.warning(step)
        for (const cmd of this.materials.sequence.cmds) {
          if (fs.existsSync(`${this.costume}/${cmd}`)) {
            await exec(`${this.costume}/${cmd} ${this.materials.name}`, Utils.setEcho(true))
          } else {
            // exec cmd real env
            await exec(`${cmd} ${this.materials.name}`, Utils.setEcho(true))
          }
        }
      }

      /**
       * install packages
       */
      if (this.materials.sequence.packages !== undefined) {
        switch (distro.familyId) {
          case 'debian': {
            const packages = await this.packagesExists(this.materials.sequence.packages, true, 'packages')
            if (packages.length > 1) {
              await this.packagesInstall(packages)
            }
            break
          }

          case 'archlinux': {
            await this.packagesInstall(this.materials.sequence.packages, 'packages', `pacman -Sy --noconfirm`)
            break
          }

          case 'alpine': {
            await this.packagesInstall(this.materials.sequence.packages, 'packages', `apk add`)
            break
          }

          case 'fedora': {
            await this.packagesInstall(this.materials.sequence.packages, 'packages', `dnf install -y`)
            break
          }
        }
      }

      /**
       * Debian: try_packages, debs
       */
      if (distro.familyId === 'debian') {
        if (this.materials.sequence.try_packages !== undefined) {
          const try_packages = await this.packagesExists(this.materials.sequence.try_packages, false)
          if (try_packages.length > 1) {
            await this.packagesInstall(try_packages, 'try packages ')
          }
        }

        if (this.materials.sequence.debs !== undefined && this.materials.sequence.debs) {
          step = 'installing local packages'
          Utils.warning(step)
          let pathDebs = `${this.costume}/debs/${distro.codenameLikeId}`
          if (!fs.existsSync(pathDebs)) {
            pathDebs = `${this.costume}/debs`
          }
          if (fs.existsSync(pathDebs)) {
            await exec(`dpkg -i ${pathDebs}/*.deb`)
          }
        }
      }

      /**
       * sequence/packages_python
       */
      if (this.materials.sequence.packages_python !== undefined && Array.isArray(this.materials.sequence.packages_python)) {
        let cmd = 'pip install '
        let pip = ''
        for (const elem of this.materials.sequence.packages_python) {
          cmd += ` ${elem}`
          pip += `, ${elem}`
        }

        step = `installing python packages pip ${pip.slice(2)}`
        Utils.warning(step)
        await exec(cmd, this.echo)
      }

      /**
       * sequence/accessories
       */
      if (!no_accessories) {
        if (this.materials.sequence.accessories !== undefined && Array.isArray(this.materials.sequence.accessories)) {
          step = 'wearing accessories'
          for (const elem of this.materials.sequence.accessories) {
            if ((elem === 'firmwares' || elem === './firmwares') && no_firmwares) {
              continue
            }

            if (elem.slice(0, 2) === './') {
              // local accessory
              const tailor = new Tailor(`${this.costume}/${elem.slice(2)}`, 'accessory')
              await tailor.prepare(verbose)
            } else {
              // global accessory
              const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`, 'accessory')
              await tailor.prepare(verbose)
            }
          }
        }

        /**
         * Debian: try_accessories
         */
        if (distro.familyId === 'debian') {
          if (this.materials.sequence.try_accessories !== undefined &&
            Array.isArray(this.materials.sequence.try_accessories)
          ) {
            step = 'wearing try_accessories'
            for (const elem of this.materials.sequence.try_accessories) {
              if ((elem === 'firmwares' || elem === './firmwares') && no_firmwares) {
                continue
              }

              if (elem.slice(0, 2) === './') {
                // local accessory
                const tailor = new Tailor(`${this.costume}/${elem.slice(2)}`, 'try_accessory')
                await tailor.prepare(verbose)
              } else {
                // global accessory
                const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`, 'try_accessory')
                await tailor.prepare(verbose)
              }
            }
          } // no-try-accessories
        } // no-debian
      } // no-accessories
    } // end sequence

    /**
     * customize
     */
    if (this.materials.customize !== undefined) {
      /**
       * customize/dirs
       */
      if (this.materials.customize.dirs && fs.existsSync(`/${this.costume}/dirs`)) {
        step = 'copying dirs'
        Utils.warning(step)
        let cmd = `rsync -avx  ${this.costume}/dirs/* /`
        await exec(cmd, this.echo)

        // chown root:root /etc -R
        cmd = 'chown root:root /etc/sudoers.d /etc/skel -R'
        await exec(cmd, this.echo)

        /**
         * Copyng skel in /home/user
         */
        if (fs.existsSync(`${this.costume}/dirs/etc/skel`)) {
          const user = await Utils.getPrimaryUser()
          step = `copying skel in /home/${user}/`
          Utils.warning(step)
          cmd = `rsync -avx  ${this.costume}/dirs/etc/skel/.config /home/${user}/`
          await exec(cmd, this.echo)
          await exec(`chown ${user}:${user} /home/${user}/ -R`)
        }
      }

      /**
       * customize/runs
       */
      if (this.materials.customize.cmds !== undefined && Array.isArray(this.materials.customize.cmds)) {
        step = 'customize commands'
        Utils.warning(step)

        for (const cmd of this.materials.customize.cmds) {
          if (fs.existsSync(`${this.costume}/${cmd}`)) {
            await exec(`${this.costume}/${cmd} ${this.materials.name}`, Utils.setEcho(true))
          } else {
            // exec cmd real env
            await exec(`${cmd}`, Utils.setEcho(true))
          }
        }
      }
    }

    /**
     * reboot
     */
    if (this.materials.reboot) {
      Utils.warning('Reboot')
      await Utils.pressKeyToExit('system need to reboot', true)
      await exec('reboot')
    } else {
      console.log(`You look good with: ${this.materials.name}`)
    }
  }

  /**
   *
   * @param packages
   * @param verbose
   * @param section
   * @returns
   */
  async packagesExists(packages: string[], verbose = false, section = ''): Promise<string[]> {
    const packages_we_want = '/tmp/packages_we_want'
    const packages_not_exists = '/tmp/packages_not_exists'
    const packages_exists = '/tmp/packages_exists'

    await exec(`rm -f ${packages_we_want}`)
    await exec(`rm -f ${packages_not_exists}`)
    await exec(`rm -f ${packages_exists}`)

    /**
     * packages_we_want
     */
    let content = ''
    packages.sort()
    for (const elem of packages) {
      if (!Pacman.packageIsInstalled(elem)) {
        content += elem + '\n'
      }
    }

    fs.writeFileSync(packages_we_want, content, 'utf-8')

    /**
     * packages_exists
     */
    const distro = new Distro()
    await (distro.familyId === 'debian' ? exec(`apt-cache --no-generate pkgnames | sort | comm -12 - ${packages_we_want} > ${packages_exists}`) : exec(`pacman -S --list | awk '{print $2}' | sort | comm -12 - ${packages_we_want} > ${packages_exists}`))

    /**
     * packages_not_exists
     */
    if (verbose) {
      await (distro.familyId === 'debian' ? exec(`apt-cache --no-generate pkgnames | sort | comm -13 - ${packages_we_want} > ${packages_not_exists}`) : exec(`pacman -S --list | awk '{print $2}' | sort | comm -13 - ${packages_we_want} > ${packages_not_exists}`))
      const not_exist_packages = fs.readFileSync(packages_not_exists, 'utf8').split('\n')
      if (not_exist_packages.length > 1) {
        // Una riga c'è sempre
        let content = ''
        // for (const elem of not_exist_packages) {
        for (let i = 0; i < not_exist_packages.length - 1; i++) {
          content += `- ${not_exist_packages[i]}\n`
        }

        this.titles('tailor')
        console.log('Following packages from ' + chalk.cyan(this.materials.name) + ' section: ' + chalk.cyan(section) + ', was not found:')
        console.log(content)
        Utils.pressKeyToExit('Press a key to continue...')
      }
    }

    return fs.readFileSync(packages_exists, 'utf8').split('\n')
  }


  /**
 * - check if every package if installed
 * - if find any packages to install, install it
 */
  async packagesInstall(packages: string[], comment = 'packages', cmd = 'apt-get install -yqq ') {
    if (packages[0] !== null) {
      const elements: string[] = []
      let strElements = ''
      for (const elem of packages) {
        elements.push(elem)
        cmd += ` ${elem}`
        strElements += `, ${elem}`
      }

      if (elements.length > 0) {
        let step = `installing ${comment}: `
        if (!this.verbose) {
          step += strElements.slice(2)
        }

        /**
         * prova 3 volte
         */
        const limit = 3
        for (let tempts = 1; tempts < limit; tempts++) {
          this.titles(step)
          Utils.warning(`tempts ${tempts} of ${limit}`)
          if (await tryCheckSuccess(cmd, this.echo)) {
            break
          }
        }
      }
    }
  }

  /**
   *
   * @param command
   */
  titles(command = '') {
    console.clear()
    console.log('')
    console.log(' E G G S: the reproductive system of penguins')
    console.log('')
    console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') + chalk.bgWhite.blue(" Perri's Brewery edition ") + chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
    console.log('wearing: ' + chalk.bgBlack.cyan(this.costume) + ' ' + chalk.bgBlack.white(command) + '\n')
  }
}

/**
 *
 * @param cmd
 * @param echo
 * @returns
 */
async function tryCheckSuccess(cmd: string, echo: {}): Promise<boolean> {
  let success = false
  try {
    await exec(cmd, echo)
    success = true
  } catch {
    success = false
  }

  return success
}

/**
 *
 * @param ms
 * @returns
 */
function sleep(ms = 0) {
  return new Promise((resolve) => {
     setTimeout(resolve, ms);
  });
}
