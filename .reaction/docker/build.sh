#!/bin/bash

# build the base container and then the app container
docker build -f .reaction/docker/base.dockerfile -t getoutfitted/base:latest .
docker build -t getoutfitted/getoutfitted:latest .
