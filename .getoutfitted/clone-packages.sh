#!/bin/bash

# Clone packages on Circle CI
if [ "$CIRCLE_BRANCH" = "master" ]; then
  bash ./production-clone.sh
else
  bash ./development-clone.sh
fi
