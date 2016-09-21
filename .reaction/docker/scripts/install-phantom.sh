#!/bin/bash

set -e

if [ "${INSTALL_PHANTOMJS}" = "true" ]; then

  printf "\n[-] Installing Phantom.js...\n\n"

  # Script from: https://gist.github.com/julionc/7476620
  # This script install PhantomJS in your Debian/Ubuntu System
  #
  # This script must be run as root:
  # sudo sh install_phantomjs.sh
  #

  if [[ $EUID -ne 0 ]]; then
      echo "This script must be run as root" 1>&2
      exit 1
  fi

  PHANTOM_VERSION="phantomjs-2.1.1"
  ARCH=$(uname -m)

  if ! [ $ARCH = "x86_64" ]; then
      $ARCH="i686"
  fi

  PHANTOM_JS="$PHANTOM_VERSION-linux-$ARCH"

  apt-get update
  apt-get install build-essential wget chrpath libssl-dev libxft-dev -y

  cd ~
  wget https://github.com/Medium/phantomjs/releases/download/v2.1.1/$PHANTOM_JS.tar.bz2
  tar xvjf $PHANTOM_JS.tar.bz2

  mv $PHANTOM_JS.tar.bz2 /usr/local/share/
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/share/phantomjs
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin/phantomjs
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/bin/phantomjs

fi
