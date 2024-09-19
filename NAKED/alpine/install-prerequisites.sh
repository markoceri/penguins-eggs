# install-prerequisites
apk add \
    alpine-conf \
    apk-tools \
    bash-completion \
    cryptsetup \
    curl \
    docs \
    dosfstools \
    fuse \
    git \
    jq \
    lsb-release \
    lsblk \
    lvm2 \
    man-pages \
    mandoc \
    mandoc-apropos \
    mkinitfs \
    musl-locales \
    musl-utils \
    nano \
    nodejs \
    npm \
    parted \
    rsync \
    shadow \
    squashfs-tools \
    sshfs \
    syslinux \
    xdg-user-dirs \
    xorriso

# install grub
apk add \
    grub \
    grub-bios \
    grub-efi \
    efibootmgr

grub-install /dev/sda

# fuse
echo "fuse" | tee /etc/modules-load.d/fuse.conf

# create dirs
mkdir /usr/share/icons
mkdir /usr/share/applications

npm i pnpm -g
