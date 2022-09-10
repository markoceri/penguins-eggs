/**
 * penguins-eggs: pxe.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import os from 'node:os'
import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'

import http from 'http'
import { IncomingMessage, ServerResponse } from 'http';
import { exec } from '../lib/utils'
import path, { dirname } from 'node:path'

/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}

    settings = {} as Settings
    pxeRoot = ''
    isos: string[] = []


    /**
     * fertilization()
     */
    async fertilization() {
        this.settings = new Settings()
        await this.settings.load()
        this.pxeRoot = path.dirname(this.settings.work_dir.path) + '/pxe/'

        let isos = fs.readdirSync(`/home/eggs/`)
        for (const iso of isos) {
            if (path.extname(iso) === ".iso") {
                this.isos.push(iso)
            }
        }
    }

    /**
     * structure
     */
    async structure() {
        if (fs.existsSync(this.pxeRoot)) {
            await this.tryCatch(`rm ${this.pxeRoot} -rf`)
        }
        let cmd = `mkdir -p ${this.pxeRoot}`
        await this.tryCatch(cmd)

        await this.tryCatch(`mkdir -p ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/PXELINUX/pxelinux.0 ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/PXELINUX/lpxelinux.0 ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/ldlinux.c32 ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/vesamenu.c32 ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/libcom32.c32 ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/libutil.c32 ${this.pxeRoot}`)
        await this.tryCatch(`cp /home/eggs/ovarium/iso/isolinux/isolinux.theme.cfg ${this.pxeRoot}`)
        await this.tryCatch(`cp /home/eggs/ovarium/iso/isolinux/splash.png ${this.pxeRoot}`)
        await this.tryCatch(`cp /usr/lib/syslinux/memdisk ${this.pxeRoot}`)
        for (const iso of this.isos) {
            await this.tryCatch(`ln /home/eggs/${iso} ${this.pxeRoot}/${iso}`)
        }
        await this.tryCatch(`mkdir ${this.pxeRoot}/pxelinux.cfg`)
        let content = ``
        content += `# eggs: pxelinux.cfg/default\n`
        content += `# search path for the c32 support libraries (libcom32, libutil etc.)\n`
        content += `path\n`
        content += `include isolinux.theme.cfg\n`
        content += `UI vesamenu.c32\n`
        content += `menu title Penguin's eggs - Perri's brewery edition - ${Utils.address()}\n`
        content += `PROMPT 0\n`
        content += `TIMEOUT 0\n`
        content += `MENU DEFAULT tftp\n`

        for (const iso of this.isos) {
            content += `LABEL http\n`
            content += `MENU LABEL ${iso}\n`
            content += `KERNEL memdisk\n`
            content += `APPEND iso initrd=http://${Utils.address()}/${iso}\n`
        }

        let file = `${this.pxeRoot}/pxelinux.cfg/default`
        fs.writeFileSync(file, content)
    }

    /**
     * 
     */
    async dnsMasq() {
        let domain = `penguins-eggs.lan`

        let content = ``
        content += `# copy and paste in /etc/dnsmasq.conf\n\n`
        content += `#\n`
        content += `# Don't function as a DNS server:\n`
        content += `port=0\n\n`
        content += `# Log lots of extra information about DHCP transactions.\n`
        content += `log-dhcp\n\n`
        content += `log-queries\n\n`
        content += `log-facility=/home/artisan/dnsmasq.log\n\n`
        content += `interface=${await Utils.iface()}\n\n`
        content += `bind-interfaces\n\n`
        content += `domain=${domain}\n\n`

        // dhcp-full
        content += `dhcp-range=${await Utils.iface()},192.168.1.1,192.168.1.254,255.255.255.0,8h\n\n`

        // dhcp-proxy
        //content += `dhcp-range=${await Utils.iface()},192.168.1.1,proxy\n\n`

        content += `# router\n`
        content += `dhcp-option=option:router,192.168.1.1\n\n`
        content += `# dns\n`
        content += `dhcp-option=option:dns-server,192.168.1.1\n\n`
        content += `dhcp-option=option:dns-server,8.8.8.8\n\n`
        content += `dhcp-option=option:dns-server,8.8.4.4\n\n`
        content += `enable-tftp\n\n`
        content += `tftp-root=${this.pxeRoot}\n\n`
        content += `pxe-prompt="Booting PXE Client", 5\n\n`
        content += `# boot config for BIOS systems\n\n`
        content += `dhcp-match=set:bios-x86,option:client-arch,0\n\n`
        content += `dhcp-boot=tag:bios-x86,lpxelinux.0\n\n`
        content += `# boot config for UEFI systems\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,7\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,9\n\n`
        content += `dhcp-boot=tag:efi-x86_64,lpxelinux.0\n\n`

        let file = '/etc/dnsmasq.d/cuckoo.conf'
        fs.writeFileSync(file, content)

        await exec(`systemctl stop dnsmasq.service`)
        await exec(`rm /home/artisan/dnsmasq.log\n`)

        await exec(`systemctl start dnsmasq.service`)
        // await exec(`systemctl status dnsmasq.service`)
        // console.log(content)
    }

    /**
    * 
    * @param cmd 
    */
    async tryCatch(cmd = '') {
        try {
            await exec(cmd, this.echo)
        } catch (error) {
            console.log(`Error: ${error}`)
            await Utils.pressKeyToExit(cmd)
        }
    }

    /**
     * start http server
     */
    async httpStart() {
        const port = 80
        const pxeRoot = this.pxeRoot + "/"
        http.createServer(function (req: IncomingMessage, res: ServerResponse) {
            fs.readFile(pxeRoot + req.url, function (err, data) {
                if (err) {
                    res.writeHead(404)
                    res.end(JSON.stringify(err))
                    return
                }
                res.writeHead(200)
                res.end(data)
            });
        }).listen(80)
    }
}
