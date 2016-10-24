#!/bin/bash

# build the base container and then the app container
docker build -f .getoutfitted/docker/base.dockerfile -t getoutfitted/base:latest .
docker build -t getoutfitted/getoutfitted:latest .
