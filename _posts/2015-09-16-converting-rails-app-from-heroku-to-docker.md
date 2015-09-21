---
layout: post
title: Converting Rails Apps From Heroku To Docker
tags:
- docker
- rails
- heroku
---
We recently had to move a rails app from heroku+postgres to our own servers, since heroku free is now enforcing nap times (but I don't wanna nap!).
We don't want to have to manage the rails dependencies ourselves, as they can be a pita. [Docker](https://www.docker.com/) to the rescue!

We need to run 2 containers for this, a postgres container for data storage and the actual rails app. We need to persist our postgres data so we mount a local dir into the postgres container and then link from the app container to the postgres container.

We have a structure similar to:

    -magicapp
    --repo
    --postgres

##RoR docker container
As recommended by the [rails docker page](https://hub.docker.com/_/rails/) we build our own Dockerfile based on their onbuild Dockerfile.

The onbuild Dockerfile builds in some weird places, so it's customised a bit to build in the more traditional (from docker perspective) `/app` folder as a mount point.

    FROM ruby:2.1

    # throw errors if Gemfile has been modified since Gemfile.lock
    RUN bundle config --global frozen 1

    RUN apt-get update && apt-get install -y nodejs --no-install-recommends && rm -rf /var/lib/apt/lists/*
    RUN apt-get update && apt-get install -y mysql-client postgresql-client sqlite3 --no-install-recommends && rm -rf /var/lib/apt/lists/*

    ENV RAILS_ENV production

    RUN mkdir /app
    VOLUME /app
    WORKDIR /app
    COPY Gemfile /app/
    COPY Gemfile.lock /app/
    RUN bundle install

    EXPOSE 3000
    CMD ["rails", "server", "-b", "0.0.0.0"]

We use the normal rails server at this point but can easily be replaced with unicorn or whatever.
Now we can build the docker image (and push to docker hub if wanted).

    docker build -t "gabriel403/magicapp"
    docker push "gabriel403/magicapp"

##Postgres docker container
So now we have a workable docker image for out rails app (with gems pre-bundled thanks to building it!) we want to get a working postgres running for us to store data in! We supply a couple of env variables to create a db/user and password. This one's fairly simple thanks to the existing [postgres image](https://hub.docker.com/_/postgres/):

    docker run --name magicapp-postgres -d -e POSTGRES_USER=magicapp_prod_user -e POSTGRES_DB=magicapp_prod_db -e POSTGRES_PASSWORD=magicapp_prod_pword -v /var/www/vhosts/magicapp/postgres:/var/lib/postgresql/data postgres

When we come to launch our app container the env variables from our postgres container are exposed inside the app container, `POSTGRES_USER` becomes `POSTGRES_ENV_POSTGRES_USER`, but they don't exist outside of the containers, making it awkward to pass in indirectly. We can alter our app so the database.yml references the new env vars:

    production:
      <<: *default
      adapter: postgresql
      database: <%= ENV['POSTGRES_ENV_POSTGRES_DB'] %>
      username: <%= ENV['POSTGRES_ENV_POSTGRES_USER'] %>
      password: <%= ENV['POSTGRES_ENV_POSTGRES_PASSWORD'] %>
      host: <%= ENV['POSTGRES_PORT_5432_TCP_ADDR'] %>
      port: <%= ENV['POSTGRES_PORT_5432_TCP_PORT'] %>

or we can manually pass the details to more standard env vars:

    -e POSTGRES_USER=magicapp_prod_user -e POSTGRES_DB=magicapp_prod_db -e POSTGRES_PASSWORD=magicapp_prod_pword

it's up to you to chose which approach you prefer, but we do pass a couple of env vars in for basic rails operation:

    docker run --link magicapp-postgres:postgres --name magicapp -d -e LANG=en_GB.UTF-8 -e RAIL_ENV=production -e SECRET_KEY_BASE=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab -v /var/www/vhosts/magicapp/repo:/app gabriel403/magicapp

And there we have it, we have a rails app working on docker connecting to another docker container which is running postgres.

<p style="padding-top: 400px;"></p>

##Import postgres backup
Nah that's not it don't worry. You're probably sat there thinking that's no good, what about the years of data we've already got in the heroku db? What about proxying from http[s] to the rails app? Don't worry I got you covered.

If you're using heroku's postgres you should be able to make a backup of the current db and then download it, we can then transfer that to the docker host and import to our postgres db.

![Postgres addon](/images/converting-rails/addon.png)

![Postgres backup](/images/converting-rails/pg-backup.png)

![Postgres backup download](/images/converting-rails/pg-backup-download.png)

Now we can download the backup we've just made. When downloaded it'll have a name like `46213451-51f0-490a-311d-22c24ea1e4f5`, we rename it to `magicapp-dump.dump` and then upload it to a temporary directory on the docker host `/var/www/vhosts/magicapp/tmp` in our case.

Now we can use the default postgres docker image to import the dump into our existing postgres db, we'll be prompted on the command line to enter the password for the user:

    docker run --rm -it --link magicapp-postgres:postgres -v /var/www/vhosts/magicapp/tmp:/tmp postgres sh -c 'exec pg_restore --verbose --clean --no-acl --no-owner -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U "$POSTGRES_ENV_POSTGRES_USER" -d "$POSTGRES_ENV_POSTGRES_DB" /tmp/magicapp-dump.dump'

Now you've got your data restored to your new postgres container!

You'll probably see something like `WARNING: errors ignored on restore: 20` these are normally todo with the dump attempting to drop tables that don't yet exist.

##http proxy container
So we've now got an app running with a db with our restored data in, time for some http[s] proxy magic. We're not using one of the docker special images for this, but a rather awesome image from jwilder called [nginx-proxy](https://hub.docker.com/r/jwilder/nginx-proxy/).

One of the beauties about docker is it it's easy to see what the user has done to the image before we use it, just by looking at the Dockerfile. One of the things that's great about this docker image is that it can handle most of your proxying without fuss, you don't need new containers for each url you wish to proxy. We want to proxy both http as well as https traffic (the rails app will redirect to https for us) we need to tell it where our ssl certificates are, and to forward the appropriate ports, but other than that it's fairly simple to get running.

    docker run -d --name nginx-proxy -p 80:80 -p 443:443 -v /var/www/vhosts/ssl/g403.co:/etc/nginx/certs -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy

When we're using this we actually need to start our rails app with a few more env vars that the proxy container uses to channel.

So instead of

    docker run --link magicapp-postgres:postgres --name magicapp -d -e LANG=en_GB.UTF-8 -e RAIL_ENV=production -e SECRET_KEY_BASE=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab -v /var/www/vhosts/magicapp/repo:/app gabriel403/magicapp

We now need

    docker run --link magicapp-postgres:postgres --name magicapp -d -e CERT_NAME=g403.co -e VIRTUAL_HOST=magicapp.g403.co -e VIRTUAL_PORT=3000 -e LANG=en_GB.UTF-8 -e RAIL_ENV=production -e SECRET_KEY_BASE=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab -v /var/www/vhosts/magicapp/repo:/app gabriel403/magicapp

So now we have a running RoR container, a running Postgres container with data restored from heroku and finally an nginx proxy to forward traffic from normal http/s ports to our app.

##systemd configuration
Whilst docker is happy to run on boot, our container's won't boot or restart by themselves. These are a basic set of systemd files to get all 3 containers to run. Simply put them in `/etc/systemd/system/` and then run `sudo systemctl enable docker-nginx-proxy.service` etc to enable them and get them to start on boot/restart on error etc.

docker-nginx-proxy.service

    [Unit]
    Description=Nginx Proxy Container
    Requires=docker.service
    After=docker.service

    [Service]
    Restart=always
    ExecStartPre=service docker restart
    ExecStart=/usr/bin/docker run --name nginx-proxy -p 80:80 -p 443:443 -v /var/www/vhosts/ssl/g403.co:/etc/nginx/certs -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
    ExecStop=/usr/bin/docker stop -t 2 nginx-proxy ; /usr/bin/docker rm -f nginx-proxy

    [Install]
    WantedBy=multi-user.target

docker-magicapp.service

    [Unit]
    Description=Magicapp Container
    Requires=docker.service
    After=docker.service
    Requires=docker-magicapp-postgres.service
    After=docker-magicapp-postgres.service

    [Service]
    Restart=always
    ExecStart=/usr/bin/docker run --name magicapp --link magicapp-postgres:postgres -e CERT_NAME=g403.co -e VIRTUAL_HOST=magicapp.g403.co -e VIRTUAL_PORT=3000 -e LANG=en_GB.UTF-8 -e RAIL_ENV=production -e SECRET_KEY_BASE=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab -v /var/www/vhosts/magicapp/repo:/app gabriel403/magicapp
    ExecStop=/usr/bin/docker stop -t 2 magicapp ; /usr/bin/docker rm -f magicapp

    [Install]
    WantedBy=multi-user.target

docker-magicapp-postgres.service

    [Unit]
    Description=Magicapp Postgres Container
    Requires=docker.service
    After=docker.service

    [Service]
    Restart=always
    ExecStart=/usr/bin/docker run --name magicapp-postgres -e POSTGRES_USER=magicapp_prod_user -e POSTGRES_DB=magicapp_prod_db -e POSTGRES_PASSWORD=magicapp_prod_pword -v /var/www/vhosts/magicapp/postgres:/var/lib/postgresql/data postgres

    [Install]
    WantedBy=multi-user.target

Note that we don't pass the `-d` flag in the run commands, we don't want to background the running, as this would cause systemd to continuously restart.
