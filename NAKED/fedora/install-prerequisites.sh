#!/bin/bash

# This script installs prerequisites for penguins-eggs
# on fedora linux, it is intended for development purposes 

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on fedora
if [ ! -f /etc/fedora-release ]; then
    echo "This script is intended for fedora linux only"
    exit 1
fi

# update
dnf -y update


dnf -y install \
    bash-completion \
    cryptsetup \
    curl \
    device-mapper \
    dmraid \
    dosfstools \
    dracut \
    dracut-live \
    fuse \
    git \
    jq \
    lsb-release \
    lvm2 \
    nodejs \
    npm \
    nvme-cli \
    overlayfs-tools \
    parted \
    rsync \
    squashfs-tools \
    sshfs \
    xdg-user-dirs \
    xorriso \
    zstd

# install pnpm
npm i pnpm -g

# disable selinux
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config