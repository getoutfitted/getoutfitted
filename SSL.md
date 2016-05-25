## Renewing SSL Cert
__Needs to be done every 60-90 days.__

1. Comment out SSL forwarding in `/etc/nginx/sites-available/gtfttd`

2. run `nginx -t` to verify config file

3. run `nginx -s reload`

4. run `service nginx reload`

5. run this command `/opt/letsencrypt/letsencrypt-auto renew`

6. Enable SSL forwarding in `/etc/nginx/sites-available/gtfttd`

7. run `nginx -t` to verify config file

8. run `nginx -s reload`

9. run `service nginx reload`


### Generating new SSL Cert
./letsencrypt-auto certonly -a webroot --webroot-path=/home/gtfttd/bundle -d getoutfitted.com


### Resources
https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04

#### Notes
* SSL Certs lives here: /etc/letsencrypt/live/getoutfitted.com/fullchain.pem;
