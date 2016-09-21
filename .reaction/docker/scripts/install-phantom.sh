#!/bin/bash

set -e

if [ "${INSTALL_PHANTOMJS}" = "true" ]; then

  printf "\n[-] Installing Phantom.js...\n\n"

  # Script based off of phantom installation script found here: https://gist.github.com/julionc/7476620
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

  phantomjs --version
fi
