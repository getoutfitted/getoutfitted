## Renewing SSL Cert

1. Comment out SSL forwarding in `/etc/nginx/sites-available/gtfttd`

2. run `nginx -t` to verify config file

3. run `nginx -s reload`

4. run `service nginx reload`

5. run this command `/opt/letsencrypt/letsencrypt-auto renew`

6. Enable SSL forwarding in `/etc/nginx/sites-available/gtfttd`

7. run `nginx -t` to verify config file

8. run `nginx -s reload`

9. run `service nginx reload`
