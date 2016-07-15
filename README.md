# GetOutfitted [![Circle CI](https://circleci.com/gh/reactioncommerce/reaction.svg?style=svg)](https://circleci.com/gh/reactioncommerce/reaction) [![Code Climate](https://codeclimate.com/github/reactioncommerce/reaction/badges/gpa.svg)](https://codeclimate.com/github/reactioncommerce/reaction) [![Gitter](https://badges.gitter.im/JoinChat.svg)](https://gitter.im/reactioncommerce/reaction?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
GetOutfitted is built on a fork of [ReactionCommerce](https://github.com/reactioncommerce/reaction), which is a modern reactive, real-time event driven ecommerce platform.

## Docs
Installation, configuration and development documentation is available on [docs.reactioncommerce.com](https://docs.reactioncommerce.com/)

The Reaction documentation source is located in the [reaction-docs](https://github.com/reactioncommerce/reaction-docs) repository, while the documentation site is the [reactioncommerce/redoc](https://github.com/reactioncommerce/redoc) application.

## Docker Images
Docker images are available on the [Docker Hub](https://hub.docker.com/u/getoutfitted/).

## Roadmap
With ongoing feature development, and strong community contributions, we have a fluid roadmap.

For grouping of development channels by feature, review the [project milestones](https://github.com/getoutfitted/getoutfitted/milestones).

And finally for the kanban-esque, hardcore real time progress overview of Reaction, take a look our [waffle board](https://waffle.io/getoutfitted/getoutfitted)

## Feedback
**Create a GitHub Issue** on the [GetOutfitted Project](https://github.com/getoutfitted/getoutfitted) to report an issue.


## Renewing SSL Cert
__Needs to be done every 60 days__

1. Comment out SSL forwarding in `/etc/nginx/sites-available/gtfttd`  
  That's these lines
  ```
  location / {  
      rewrite     ^ https://$server_name$request_uri? permanent;  
  }
  ```
2. run `nginx -t` to verify config file

3. run `nginx -s reload`

4. run `service nginx reload`

5. run this command `/opt/letsencrypt/letsencrypt-auto renew`

6. Enable SSL forwarding in `/etc/nginx/sites-available/gtfttd`
  That's these lines
  ```
  location / {  
      rewrite     ^ https://$server_name$request_uri? permanent;  
  }
  ```
7. run `nginx -t` to verify config file

8. run `nginx -s reload`

9. run `service nginx reload`
