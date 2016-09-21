#!/bin/bash

set -e

if [ "${INSTALL_PHANTOMJS}" = "true" ]; then

  printf "\n[-] Installing Phantom.js...\n\n"

  # Script based off of phantom installation script found here: https://gist.github.com/julionc/7476620
  apt-get install wget chrpath libssl-dev libxft-dev -y

  cd ~
  wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
  tar xvjf $PHANTOM_JS.tar.bz2

  mv $PHANTOM_JS.tar.bz2 /usr/local/share/
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/share/phantomjs
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin/phantomjs
  ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/bin/phantomjs

  phantomjs --version
fi
