---
layout: post
title: Using GitHub actions to deploy branch builds to a s3 bucket
tags:
  - GitHub
  - s3
  - GitHub actions
  - Branch builds
---

My first blog post in FIVE YEARS :open_mouth:

One of the problems you get with working on side projects with a group of people is the choices you have to make around tooling. You can use one of the awesome hosting providers like netlify or now.sh, but you're normally limited in the number of people that can join the project to contribute and/or the number of "build minutes" you project can do each month.

For one of the projects I'm involved in we're using a private [GitHub](https://github.com/) repo (which will become public when we're ready) and [Netlify](https://www.netlify.com/) for the initial hosting.
Netlify on the free tier limits you to 200 build minutes/month and 2 collaborators. I decided to investigate how we could use [GitHub actions](https://github.com/features/actions) (limited to 2k minutes/month) and an [s3 bucket](https://aws.amazon.com/s3/pricing/) for which the pricing is pretty trivial.

### GitHub actions

Like many code hosting apps GitHub now offers the ability to run a pipeline for build/testing/deploying code. These can be filtered based on pushing to branch, opening pull requests, making a comment etc, and there are many publicly available pre-built actions that we can use, but we also have the option to write/run our own.

### Website hosting with S3

I'm not going to go over the instructions for setting this up, for once the AWS documentation has pretty good coverage for this [AWS Docs](https://docs.aws.amazon.com/AmazonS3/latest/dev/HowDoIWebsiteConfiguration.html)

For one of the GitHub actions we use for this we do need to do some more manual setup, for the IAM user needed for pushing to the bucket, this is specifically for Gatsby which our project is in [jonelantha/gatsby-s3-action](https://github.com/jonelantha/gatsby-s3-action#notes)

### Putting it all together

For putting it together I created a new [GH repo](https://github.com/gabriel403/branch-builds-into-s3), created a new bucket in [S3](http://gh-actions-branch-builds.s3-website-eu-west-1.amazonaws.com) and setup the website hosting and IAM user as detailed above.

I then added Gatsby to the repo and pushed that up, and finally started work on the GH actions

### lights, cameras, ... git branch name?

I was quite easily able to get the repo building and syncing to s3:

```
name: Deploy to S3

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Use Node.js 12
        uses: actions/setup-node@v1
        with:
          node-version: 12.x
      - name: Build
        run: |
          yarn
          yarn build
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${ { secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${ { secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: gh-actions-branch-builds

```

But all this was doing was pushing the code into the route, so everytime a new commit was pushed on whatever branch it would overwrite it. What I needed to do was push code to a subdir based on the branch name.

GitHub actions provide various environment variables that can be used in scripts, one of these `GITHUB_REF` in branches will contain the branch name, so we're able to extract the branch name from this ref, there are various caveats to this, but for this simple case [Stack Overflow has my back](https://stackoverflow.com/questions/58033366/how-to-get-current-branch-within-github-actions)

We can plug in a couple of extra steps to get the branch name and add it to the gatsby config and then update the gatsby-s3-action to include the branch name and update the gatsby build step to include prefix path

```
      - name: Extract branch name
        shell: bash
        run: echo "##[set-output name=branch_name;]$(echo ${GITHUB_REF#refs/heads/})"
        id: extract_branch
      - name: Find and Replace
        uses: jacobtomlinson/gha-find-replace@master
        with:
          find: 'PATH_PREFIX'
          replace: ${ { steps.extract_branch.outputs.branch_name } }
          include: gatsby-config.js
...
      - name: Build
        run: |
          yarn
          yarn build --prefix-paths
...
      - name: Deploy
        uses: jonelantha/gatsby-s3-action@v1
        with:
          dest-s3-bucket: gh-actions-branch-builds/${ { steps.extract_branch.outputs.branch_name }}
```

Now whenever we push a new branch with changes in this will create a subdirectory in our bucket and the whole thing works amazingly well! :tada:

I've put together a repo for the demo:  
[https://github.com/gabriel403/branch-builds-into-s3](https://github.com/gabriel403/branch-builds-into-s3)

And setup a couple of branch builds as examples:  
[http://gh-actions-branch-builds.s3-website-eu-west-1.amazonaws.com/master/](http://gh-actions-branch-builds.s3-website-eu-west-1.amazonaws.com/master/)  
[http://gh-actions-branch-builds.s3-website-eu-west-1.amazonaws.com/haxing-update/](http://gh-actions-branch-builds.s3-website-eu-west-1.amazonaws.com/haxing-update/)

And there we have it! I haven't had a chance to look into deleting directories when PRs are merged, and I know opening a PR will put `GITHUB_REF` into a weird state, but there are different env vars we can use.

Hope this helps some folks!

Much love :heart:
