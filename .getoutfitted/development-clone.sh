#!/bin/bash

cd packages

git clone -b development git@github.com:getoutfitted/reaction-rental-products.git
git clone -b development git@github.com:getoutfitted/reaction-product-importer.git
git clone -b development git@github.com:getoutfitted/reaction-advanced-fulfillment.git
git clone -b development git@github.com:getoutfitted/reaction-zopim.git
git clone -b development git@github.com:getoutfitted/reaction-shipstation.git
git clone -b development git@github.com:getoutfitted/static-pages.git
git clone -b development git@github.com:getoutfitted/reaction-klaviyo.git
git clone -b development git@github.com:getoutfitted/press-feed.git
git clone -b development git@github.com:getoutfitted/transit-times.git
git clone -b development git@github.com:getoutfitted/slack.git
git clone -b development git@github.com:getoutfitted/product-bundler.git
git clone -b development git@github.com:getoutfitted/trail-guide.git

cd ..
